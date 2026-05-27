import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import youtubeLogo from "@/assets/youtube-logo.png";
import {
  LayoutGrid,
  List as ListIcon,
  Rows3,
  Plus,
  Search,
  Trash2,
  ExternalLink,
  Youtube,
  ClipboardPaste,
  Moon,
  Sun,
} from "lucide-react";

type Video = {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
};

type ViewMode = "gallery" | "list" | "compact";

const STORAGE_KEY = "tubedeck.videos.v1";

function extractVideoId(input: string): string | null {
  const s = input.trim();
  if (!s) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === "youtu.be") return u.pathname.slice(1, 12) || null;
    if (u.hostname.includes("youtube.com")) {
      if (u.searchParams.get("v")) return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      const ix = parts.findIndex((p) => ["embed", "shorts", "v", "live"].includes(p));
      if (ix >= 0 && parts[ix + 1]) return parts[ix + 1].slice(0, 11);
    }
  } catch {
    const m = s.match(/([a-zA-Z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

async function fetchMeta(id: string): Promise<{ title: string; author: string }> {
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    const res = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(url)}`,
    );
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        return { title: data.title, author: data.author_name ?? "YouTube" };
      }
    }
  } catch {
    // ignore
  }
  return { title: `YouTube video ${id}`, author: "YouTube" };
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [single, setSingle] = useState("");
  const [bulk, setBulk] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("gallery");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("tubedeck.theme");
    const prefersDark =
      stored === "dark" ||
      (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("tubedeck.theme", next ? "dark" : "light");
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setVideos(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos));
    } catch {
      // ignore
    }
  }, [videos]);

  async function addFromInputs(inputs: string[]) {
    const ids = Array.from(
      new Set(
        inputs
          .map((s) => extractVideoId(s))
          .filter((x): x is string => !!x),
      ),
    );
    const existing = new Set(videos.map((v) => v.id));
    const fresh = ids.filter((id) => !existing.has(id));
    if (fresh.length === 0) return;
    setLoading(true);
    const metas = await Promise.all(
      fresh.map(async (id) => {
        const meta = await fetchMeta(id);
        return {
          id,
          title: meta.title,
          author: meta.author,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        } satisfies Video;
      }),
    );
    setVideos((prev) => [...metas, ...prev]);
    setLoading(false);
  }

  const handleAddSingle = async () => {
    if (!single.trim()) return;
    await addFromInputs([single]);
    setSingle("");
  };

  const handleAddBulk = async () => {
    if (!bulk.trim()) return;
    const parts = bulk.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    await addFromInputs(parts);
    setBulk("");
    setBulkOpen(false);
  };

  const remove = (id: string) =>
    setVideos((prev) => prev.filter((v) => v.id !== id));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return videos;
    return videos.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.author.toLowerCase().includes(q),
    );
  }, [videos, search]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <img src={youtubeLogo} alt="TubeDeck" className="h-6 w-auto" />
            <span className="text-lg font-semibold tracking-tight">TubeDeck</span>
          </div>

          {/* Center: search + add + bulk */}
          <div className="mx-auto flex flex-1 max-w-2xl items-center justify-center gap-2 px-2">
            <div className="flex flex-1 items-stretch">
              <div className="relative flex-1">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                  className="h-10 rounded-l-full rounded-r-none border-r-0 pl-4 pr-10"
                />
              </div>
              <button
                aria-label="Search"
                className="flex h-10 w-14 items-center justify-center rounded-r-full border border-border bg-muted/60 hover:bg-muted"
              >
                <Search className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <button
              onClick={handleAddSingle}
              aria-label="Add video"
              title="Add video from URL in search"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/60 hover:bg-muted"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={() => setBulkOpen(true)}
              className="hidden sm:inline-flex h-10 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-sm font-medium text-background hover:opacity-90"
            >
              <ClipboardPaste className="h-4 w-4" />
              Bulk add
            </button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="hidden md:inline-flex">
              {videos.length} saved
            </Badge>
            <button
              onClick={toggleDark}
              aria-label="Toggle theme"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        {/* Single-URL paste row */}
        <section className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-2">
            <Input
              placeholder="Paste a YouTube URL and press Enter or +"
              value={single}
              onChange={(e) => setSingle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddSingle();
              }}
            />
            <Button onClick={handleAddSingle} disabled={loading}>
              <Plus className="h-4 w-4" /> Add
            </Button>
            <Button
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="sm:hidden"
            >
              <ClipboardPaste className="h-4 w-4" />
            </Button>
          </div>
          <div className="inline-flex items-center self-end rounded-md border border-border bg-card p-1 sm:self-auto">
            <ViewBtn icon={<LayoutGrid className="h-4 w-4" />} label="Gallery" active={view === "gallery"} onClick={() => setView("gallery")} />
            <ViewBtn icon={<ListIcon className="h-4 w-4" />} label="List" active={view === "list"} onClick={() => setView("list")} />
            <ViewBtn icon={<Rows3 className="h-4 w-4" />} label="Compact" active={view === "compact"} onClick={() => setView("compact")} />
          </div>
        </section>

        {/* Player */}
        {activeId && (
          <Card className="overflow-hidden p-0">
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                key={activeId}
                src={`https://www.youtube.com/embed/${activeId}?autoplay=1`}
                title="YouTube player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
            <div className="flex items-center justify-between p-3">
              <p className="truncate text-sm text-muted-foreground">
                Now playing
              </p>
              <Button variant="ghost" size="sm" onClick={() => setActiveId(null)}>
                Close
              </Button>
            </div>
          </Card>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <Youtube className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No videos yet</p>
            <p className="text-xs text-muted-foreground">
              Paste a link above to get started.
            </p>
          </Card>
        ) : view === "gallery" ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((v) => (
              <GalleryCard key={v.id} v={v} onPlay={() => setActiveId(v.id)} onRemove={() => remove(v.id)} />
            ))}
          </div>
        ) : view === "list" ? (
          <div className="flex flex-col gap-2">
            {filtered.map((v) => (
              <ListRow key={v.id} v={v} onPlay={() => setActiveId(v.id)} onRemove={() => remove(v.id)} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border">
            {filtered.map((v, i) => (
              <CompactRow
                key={v.id}
                v={v}
                index={i}
                onPlay={() => setActiveId(v.id)}
                onRemove={() => remove(v.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bulk paste modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-xl backdrop-blur">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5" /> Bulk add videos
            </DialogTitle>
            <DialogDescription>
              Paste multiple YouTube links separated by commas, spaces or new lines.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="https://youtu.be/…, https://youtube.com/watch?v=…"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddBulk} disabled={loading || !bulk.trim()}>
              Import all
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ViewBtn({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function GalleryCard({
  v,
  onPlay,
  onRemove,
}: {
  v: Video;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <Card className="group overflow-hidden p-0 transition-shadow hover:shadow-md">
      <button
        onClick={onPlay}
        className="relative block w-full overflow-hidden"
        style={{ aspectRatio: "16 / 9" }}
      >
        <img
          src={v.thumbnail}
          alt={v.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground opacity-0 transition-opacity group-hover:opacity-100">
            ▶ Play
          </span>
        </span>
      </button>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">
          {v.title}
        </p>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span className="truncate">{v.author}</span>
          <div className="flex items-center gap-0.5">
            <a
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="rounded p-1 hover:bg-accent"
              aria-label="Open on YouTube"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={onRemove}
              className="rounded p-1 hover:bg-destructive/10 hover:text-destructive"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ListRow({
  v,
  onPlay,
  onRemove,
}: {
  v: Video;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <Card className="flex items-center gap-3 p-2">
      <button
        onClick={onPlay}
        className="relative h-20 w-36 flex-shrink-0 overflow-hidden rounded-md"
      >
        <img src={v.thumbnail} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.author}</p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onPlay}>
          Play
        </Button>
        <a
          href={v.url}
          target="_blank"
          rel="noreferrer"
          className="rounded p-2 text-muted-foreground hover:bg-accent"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
        <button
          onClick={onRemove}
          className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </Card>
  );
}

function CompactRow({
  v,
  index,
  onPlay,
  onRemove,
}: {
  v: Video;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-3 py-1.5 text-sm ${
        index % 2 === 0 ? "bg-card" : "bg-muted/40"
      }`}
    >
      <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <button onClick={onPlay} className="h-8 w-14 flex-shrink-0 overflow-hidden rounded">
        <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
      </button>
      <button onClick={onPlay} className="min-w-0 flex-1 truncate text-left hover:underline">
        {v.title}
      </button>
      <span className="hidden truncate text-xs text-muted-foreground sm:block sm:w-40">
        {v.author}
      </span>
      <a
        href={v.url}
        target="_blank"
        rel="noreferrer"
        className="rounded p-1 text-muted-foreground hover:bg-accent"
      >
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <button
        onClick={onRemove}
        className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}