import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import youtubeLogo from "@/assets/youtube-logo.png";
import {
  LayoutGrid,
  List as ListIcon,
  Rows3,
  Search,
  Trash2,
  ExternalLink,
  Youtube,
  ClipboardPaste,
  Moon,
  Sun,
  Play,
  Film,
  Clapperboard,
  Tv,
  FileText,
  Copy,
  Check,
  Minimize2,
  Maximize2,
  Monitor,
  X,
} from "lucide-react";
import { toast } from "sonner";

type PlayerSize = "small" | "default" | "theatre";

async function copyLink(id: string) {
  const url = `https://www.youtube.com/watch?v=${id}`;
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  } catch {
    toast.error("Could not copy");
  }
}

type Category = "videos" | "shorts" | "channel" | "posts";

type Video = {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
  category: Category;
  watched: boolean;
};

type ViewMode = "gallery" | "list" | "compact";

const STORAGE_KEY = "tubedeck.videos.v2";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "videos", label: "Videos", icon: <Film className="h-4 w-4" /> },
  { value: "shorts", label: "Shorts", icon: <Clapperboard className="h-4 w-4" /> },
  { value: "channel", label: "Channel", icon: <Tv className="h-4 w-4" /> },
  { value: "posts", label: "Posts", icon: <FileText className="h-4 w-4" /> },
];

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
  const [bulk, setBulk] = useState("");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("gallery");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playerSize, setPlayerSize] = useState<PlayerSize>("default");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [category, setCategory] = useState<Category>("videos");
  const [confirmId, setConfirmId] = useState<string | null>(null);

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
    const existing = new Set(videos.filter((v) => v.category === category).map((v) => v.id));
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
          category,
          watched: false,
        } satisfies Video;
      }),
    );
    setVideos((prev) => [...metas, ...prev]);
    setLoading(false);
  }

  const handleAddBulk = async () => {
    if (!bulk.trim()) return;
    const parts = bulk.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    await addFromInputs(parts);
    setBulk("");
    setBulkOpen(false);
  };

  const confirmRemove = () => {
    if (!confirmId) return;
    setVideos((prev) => prev.filter((v) => v.id !== confirmId));
    setConfirmId(null);
  };

  const toggleWatched = (id: string) =>
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, watched: !v.watched } : v)),
    );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inCat = videos.filter((v) => v.category === category);
    if (!q) return inCat;
    return inCat.filter(
      (v) =>
        v.title.toLowerCase().includes(q) ||
        v.author.toLowerCase().includes(q),
    );
  }, [videos, search, category]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <div className="flex items-center gap-1.5">
            <img src={youtubeLogo} alt="TubeDeck" className="h-6 w-auto" />
            <span className="text-base font-semibold tracking-tight">TubeDeck</span>
          </div>

          {/* Category dropdown */}
          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full border-border bg-card px-3 text-xs font-medium shadow-sm hover:shadow-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="rounded-md text-xs">
                  <span className="flex items-center gap-2">{c.icon}{c.label}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Center: search */}
          <div className="order-last flex w-full items-stretch sm:order-none sm:mx-auto sm:w-auto sm:max-w-xl sm:flex-1">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && search.trim() && extractVideoId(search)) {
                    addFromInputs([search]);
                    setSearch("");
                  }
                }}
                placeholder="Search or paste a YouTube URL…"
                className="h-8 rounded-full border-border bg-card pl-8 pr-3 text-xs shadow-sm focus-visible:shadow-md"
              />
            </div>
          </div>

          <button
            onClick={() => setBulkOpen(true)}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3 text-xs font-medium text-background shadow-md transition-shadow hover:shadow-lg"
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Bulk add</span>
          </button>

          <button
            onClick={toggleDark}
            aria-label="Toggle theme"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm hover:shadow-md"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-5 px-3 py-5 sm:px-4">
        {/* View toggle */}
        <section className="flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {filtered.length} {CATEGORIES.find((c) => c.value === category)?.label.toLowerCase()}
          </p>
          <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 shadow-sm">
            <ViewBtn icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Gallery" active={view === "gallery"} onClick={() => setView("gallery")} />
            <ViewBtn icon={<ListIcon className="h-3.5 w-3.5" />} label="List" active={view === "list"} onClick={() => setView("list")} />
            <ViewBtn icon={<Rows3 className="h-3.5 w-3.5" />} label="Compact" active={view === "compact"} onClick={() => setView("compact")} />
          </div>
        </section>

        {/* Player */}
        {activeId && (
          <Card className="overflow-hidden rounded-2xl p-0 shadow-lg">
            <div className="flex items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-2">
              <p className="truncate text-xs font-medium text-muted-foreground">
                Now playing
              </p>
              <div className="flex items-center gap-1">
                <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5">
                  <PlayerSizeBtn icon={<Minimize2 className="h-3.5 w-3.5" />} label="Small" active={playerSize === "small"} onClick={() => setPlayerSize("small")} />
                  <PlayerSizeBtn icon={<Monitor className="h-3.5 w-3.5" />} label="Default" active={playerSize === "default"} onClick={() => setPlayerSize("default")} />
                  <PlayerSizeBtn icon={<Maximize2 className="h-3.5 w-3.5" />} label="Theatre" active={playerSize === "theatre"} onClick={() => setPlayerSize("theatre")} />
                </div>
                <button
                  onClick={() => copyLink(activeId)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                  aria-label="Copy link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <a
                  href={`https://www.youtube.com/watch?v=${activeId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent"
                  aria-label="Open on YouTube"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => setActiveId(null)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Close player"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div
              className={
                playerSize === "small"
                  ? "mx-auto w-full max-w-md"
                  : playerSize === "theatre"
                    ? "mx-[calc(50%-50vw)] w-screen"
                    : "w-full"
              }
            >
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
            </div>
          </Card>
        )}

        {/* Results */}
        {filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl p-12 text-center shadow-sm">
            <Youtube className="h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing here yet</p>
            <p className="text-xs text-muted-foreground">
              Paste a YouTube link in the search bar or use Bulk add.
            </p>
          </Card>
        ) : view === "gallery" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((v) => (
              <GalleryCard key={v.id} v={v} onPlay={() => setActiveId(v.id)} onRemove={() => setConfirmId(v.id)} onToggleWatched={() => toggleWatched(v.id)} />
            ))}
          </div>
        ) : view === "list" ? (
          <div className="flex flex-col gap-2">
            {filtered.map((v) => (
              <ListRow key={v.id} v={v} onPlay={() => setActiveId(v.id)} onRemove={() => setConfirmId(v.id)} onToggleWatched={() => toggleWatched(v.id)} />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {filtered.map((v, i) => (
              <CompactRow
                key={v.id}
                v={v}
                index={i}
                onPlay={() => setActiveId(v.id)}
                onRemove={() => setConfirmId(v.id)}
                onToggleWatched={() => toggleWatched(v.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Bulk paste modal */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="rounded-2xl shadow-2xl sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-5 w-5" /> Bulk add videos
            </DialogTitle>
            <DialogDescription>
              Adding to <span className="font-medium text-foreground">{CATEGORIES.find((c) => c.value === category)?.label}</span>. Paste multiple links separated by commas, spaces or new lines.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="https://youtu.be/…, https://youtube.com/watch?v=…"
            value={bulk}
            onChange={(e) => setBulk(e.target.value)}
            rows={6}
            className="resize-none rounded-xl"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setBulkOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" className="rounded-full shadow-md" onClick={handleAddBulk} disabled={loading || !bulk.trim()}>
              Import all
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmId} onOpenChange={(o) => !o && setConfirmId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove it from your saved list. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-md"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function watchedBorder(watched: boolean) {
  return watched
    ? "border-2 border-emerald-500/70 shadow-[0_0_0_3px_rgba(16,185,129,0.15)]"
    : "border-2 border-rose-500/60 shadow-[0_0_0_3px_rgba(244,63,94,0.12)]";
}

function GalleryCard({
  v,
  onPlay,
  onRemove,
  onToggleWatched,
}: {
  v: Video;
  onPlay: () => void;
  onRemove: () => void;
  onToggleWatched: () => void;
}) {
  return (
    <Card className={`group overflow-hidden rounded-2xl p-0 transition-all hover:-translate-y-0.5 hover:shadow-lg ${watchedBorder(v.watched)}`}>
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
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
      </button>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-medium leading-snug">
          {v.title}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
          <label className="flex min-w-0 flex-1 items-center gap-1.5 cursor-pointer">
            <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} className="h-3.5 w-3.5" />
            <span className="truncate">{v.author}</span>
          </label>
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
  onToggleWatched,
}: {
  v: Video;
  onPlay: () => void;
  onRemove: () => void;
  onToggleWatched: () => void;
}) {
  return (
    <Card className={`flex items-center gap-3 rounded-xl p-2 transition-shadow hover:shadow-md ${watchedBorder(v.watched)}`}>
      <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} />
      <button
        onClick={onPlay}
        className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg"
      >
        <img src={v.thumbnail} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.author}</p>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={onPlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:shadow-md">
          <Play className="h-3.5 w-3.5 fill-current" />
        </button>
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
  onToggleWatched,
}: {
  v: Video;
  index: number;
  onPlay: () => void;
  onRemove: () => void;
  onToggleWatched: () => void;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 border-l-4 px-3 py-1.5 text-sm ${
        v.watched ? "border-l-emerald-500" : "border-l-rose-500"
      } ${index % 2 === 0 ? "bg-card" : "bg-muted/40"}`}
    >
      <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} />
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