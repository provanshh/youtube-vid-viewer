import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const META_URL = "https://noembed.com/embed?url=";

const INPUT_SCHEMA = z.object({
  url: z.string().min(1),
  category: z.enum(["videos", "shorts", "channel", "posts"]),
});

function normalizeYouTubeAvatarUrl(url: string): string {
  return url.replace(/https:\/\/(?:yt3\.googleusercontent\.com|yt3\.ggpht\.com)/, "https://yt3.ggpht.com");
}

function decodeYouTubeEscapes(value: string): string {
  return value.replace(/\\\//g, "/");
}

function extractOgImageUrl(html: string): string | undefined {
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (!ogImageMatch) return undefined;

  const decoded = decodeYouTubeEscapes(ogImageMatch[1]);
  if (!/^https?:\/\//i.test(decoded)) return undefined;
  return normalizeYouTubeAvatarUrl(decoded);
}

function extractYouTubeAvatarUrl(html: string): string | undefined {
  const ogImage = extractOgImageUrl(html);
  if (ogImage) return ogImage;

  const structuredMatch = html.match(/"avatar":\{"thumbnails":\[\{"url":"([^"]+)"/);
  if (structuredMatch) return normalizeYouTubeAvatarUrl(decodeYouTubeEscapes(structuredMatch[1]));

  const directMatch = html.match(/https:\/\/(?:yt3\.googleusercontent\.com|yt3\.ggpht\.com)[^"'\s<>]+/);
  if (directMatch) return normalizeYouTubeAvatarUrl(directMatch[0]);

  const protocolRelativeMatch = html.match(/\/\/(?:yt3\.googleusercontent\.com|yt3\.ggpht\.com)[^"'\s<>]+/);
  if (protocolRelativeMatch) return normalizeYouTubeAvatarUrl(`https:${protocolRelativeMatch[0]}`);

  return undefined;
}

async function fetchNoembed(url: string): Promise<{ title?: string; author?: string; thumbnail?: string }> {
  try {
    const response = await fetch(`${META_URL}${encodeURIComponent(url)}`);
    if (!response.ok) return {};
    const data = await response.json();
    if (data && typeof data === "object") {
      return {
        title: typeof data.title === "string" ? data.title : undefined,
        author: typeof data.author_name === "string" ? data.author_name : undefined,
        thumbnail: typeof data.thumbnail_url === "string" ? data.thumbnail_url : undefined,
      };
    }
  } catch {
    // ignore network or parsing failures
  }
  return {};
}

async function resolveChannelThumbnail(url: string): Promise<string | undefined> {
  const candidates = [url];

  try {
    const parsed = new URL(url);
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (pathParts[0]?.startsWith("@")) {
      candidates.push(`https://www.youtube.com/results?search_query=${encodeURIComponent(pathParts[0])}`);
      candidates.push(`https://www.youtube.com/results?search_query=${encodeURIComponent(pathParts[0])}&sp=EgIQAg%253D%253D`);
    }
  } catch {
    // ignore malformed URLs
  }

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, {
        headers: {
          "user-agent": "Mozilla/5.0",
        },
      });
      if (!response.ok) continue;

      const html = await response.text();
      const avatar = extractYouTubeAvatarUrl(html);
      if (avatar) return avatar;

      const browseIdMatch = html.match(/"browseId":"(UC[^"]+)"/);
      if (browseIdMatch) {
        const channelResponse = await fetch(`https://www.youtube.com/channel/${browseIdMatch[1]}`, {
          headers: {
            "user-agent": "Mozilla/5.0",
          },
        });
        if (!channelResponse.ok) continue;

        const channelHtml = await channelResponse.text();
        const channelAvatar = extractYouTubeAvatarUrl(channelHtml);
        if (channelAvatar) return channelAvatar;
      }
    } catch {
      // ignore and try the next candidate
    }
  }

  return undefined;
}

export const getYouTubeMeta = createServerFn({ method: "POST" })
  .inputValidator(INPUT_SCHEMA)
  .handler(async ({ data }) => {
    const baseMeta = await fetchNoembed(data.url);

    if (data.category === "channel" || data.category === "posts") {
      const resolvedThumbnail = await resolveChannelThumbnail(data.url);
      const thumbnail = resolvedThumbnail ?? baseMeta.thumbnail;
      return {
        title: baseMeta.title ?? data.url,
        author: baseMeta.author ?? "YouTube",
        thumbnail,
      };
    }

    return {
      title: baseMeta.title ?? data.url,
      author: baseMeta.author ?? "YouTube",
      thumbnail: baseMeta.thumbnail,
    };
  });