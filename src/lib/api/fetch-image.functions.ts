import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const INPUT = z.object({ url: z.string().min(1) });

export const fetchImageProxy = createServerFn({ method: "POST" })
  .inputValidator(INPUT)
  .handler(async ({ data }) => {
    const url = data.url;
    try {
      const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
      if (!res.ok) throw new Error(`fetch failed ${res.status}`);
      const contentType = res.headers.get("content-type") || "application/octet-stream";
      const buffer = await res.arrayBuffer();
      // Buffer is available in Node runtimes
      const base64 = Buffer.from(buffer).toString("base64");
      return { base64, mime: contentType };
    } catch (err) {
      console.error("fetchImageProxy error:", err);
      throw new Error("Could not fetch image");
    }
  });
