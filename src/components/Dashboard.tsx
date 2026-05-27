import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Settings,
  Download,
  Plus,
  Eye,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";

type EyeFilter = "all" | "viewed" | "left";

type PlayerSize = "small" | "full" | "fullscreen";
type Category = "videos" | "shorts" | "channel" | "posts";
type ViewMode = "gallery" | "list" | "compact";

type Video = {
  id: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
  category: Category;
  watched: boolean;
};

const STORAGE_KEY = "tubedeck.videos.v3";

const CATEGORIES: { value: Category; label: string; icon: React.ReactNode }[] = [
  { value: "videos", label: "Videos", icon: <Film className="h-4 w-4" /> },
  { value: "shorts", label: "Shorts", icon: <Clapperboard className="h-4 w-4" /> },
  { value: "channel", label: "Channels", icon: <Tv className="h-4 w-4" /> },
  { value: "posts", label: "Posts", icon: <FileText className="h-4 w-4" /> },
];

type Parsed = { category: Category; id: string; url: string };

function parseYouTube(input: string): Parsed | null {
  const s = input.trim();
  if (!s) return null;
  // bare 11-char video id
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) {
    return { category: "videos", id: s, url: `https://www.youtube.com/watch?v=${s}` };
  }
  let u: URL;
  try {
    u = new URL(s.startsWith("http") ? s : `https://${s}`);
  } catch {
    return null;
  }
  if (!/(^|\.)youtube\.com$/.test(u.hostname) && u.hostname !== "youtu.be") return null;
  const parts = u.pathname.split("/").filter(Boolean);

  if (u.hostname === "youtu.be") {
    const id = u.pathname.slice(1, 12);
    if (id) return { category: "videos", id, url: `https://www.youtube.com/watch?v=${id}` };
  }
  if (parts[0] === "shorts" && parts[1]) {
    const id = parts[1].slice(0, 11);
    return { category: "shorts", id, url: `https://www.youtube.com/shorts/${id}` };
  }
  if (parts[0] === "post" || parts[0] === "posts") {
    return { category: "posts", id: u.toString(), url: u.toString() };
  }
  if (parts[0]?.startsWith("@")) {
    // channel @handle, optionally with subpath
    const base = `https://www.youtube.com/${parts[0]}`;
    return { category: "channel", id: base, url: u.toString() };
  }
  if (parts[0] === "channel" || parts[0] === "c" || parts[0] === "user") {
    return { category: "channel", id: u.toString(), url: u.toString() };
  }
  const v = u.searchParams.get("v");
  if (v) return { category: "videos", id: v, url: `https://www.youtube.com/watch?v=${v}` };
  const ix = parts.findIndex((p) => ["embed", "v", "live"].includes(p));
  if (ix >= 0 && parts[ix + 1]) {
    const id = parts[ix + 1].slice(0, 11);
    return { category: "videos", id, url: `https://www.youtube.com/watch?v=${id}` };
  }
  return null;
}

async function fetchMeta(url: string): Promise<{ title: string; author: string }> {
  try {
    const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) return { title: data.title, author: data.author_name ?? "YouTube" };
    }
  } catch {
    // ignore
  }
  return { title: url, author: "YouTube" };
}

function thumbnailFor(p: Parsed): string {
  if (p.category === "videos" || p.category === "shorts") {
    return `https://i.ytimg.com/vi/${p.id}/hqdefault.jpg`;
  }
  return "";
}

export default function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [bulk, setBulk] = useState("");
  const [search, setSearch] = useState("");
  const [paste, setPaste] = useState("");
  const [view, setView] = useState<ViewMode>("gallery");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playerSize, setPlayerSize] = useState<PlayerSize>("full");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [category, setCategory] = useState<Category>("videos");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [eyeFilter, setEyeFilter] = useState<EyeFilter>("all");
  const [sortByChannel, setSortByChannel] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

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
    const parsed = inputs
      .map(parseYouTube)
      .filter((x): x is Parsed => !!x);
    const seen = new Set(videos.map((v) => `${v.category}:${v.id}`));
    const fresh = parsed.filter((p) => {
      const k = `${p.category}:${p.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    if (fresh.length === 0) {
      if (parsed.length > 0) toast.info("Already in your library");
      return;
    }
    setLoading(true);
    const metas = await Promise.all(
      fresh.map(async (p) => {
        const meta = await fetchMeta(p.url);
        return {
          id: p.id,
          title: meta.title,
          author: meta.author,
          thumbnail: thumbnailFor(p),
          url: p.url,
          category: p.category,
          watched: false,
        } satisfies Video;
      }),
    );
    setVideos((prev) => [...metas, ...prev]);
    setLoading(false);
    const byCat: Record<Category, number> = { videos: 0, shorts: 0, channel: 0, posts: 0 };
    fresh.forEach((p) => byCat[p.category]++);
    const parts = (Object.entries(byCat) as [Category, number][])
      .filter(([, n]) => n > 0)
      .map(([c, n]) => `${n} ${c}`);
    toast.success(`Added ${parts.join(", ")}`);
  }

  const handleAddBulk = async () => {
    if (!bulk.trim()) return;
    const parts = bulk.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    await addFromInputs(parts);
    setBulk("");
    setBulkOpen(false);
  };

  const handlePaste = async () => {
    if (!paste.trim()) return;
    const p = parseYouTube(paste);
    await addFromInputs([paste]);
    setPaste("");
    if (p) setCategory(p.category);
  };

  const confirmRemove = () => {
    if (!confirmId) return;
    setVideos((prev) => prev.filter((v) => `${v.category}:${v.id}` !== confirmId));
    setConfirmId(null);
  };

  const toggleWatched = (key: string) =>
    setVideos((prev) =>
      prev.map((v) =>
        `${v.category}:${v.id}` === key ? { ...v, watched: !v.watched } : v,
      ),
    );

  const counts = useMemo(() => {
    const c: Record<Category, number> = { videos: 0, shorts: 0, channel: 0, posts: 0 };
    videos.forEach((v) => c[v.category]++);
    return c;
  }, [videos]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let inCat = videos.filter((v) => v.category === category);
    if (eyeFilter === "viewed") inCat = inCat.filter((v) => v.watched);
    else if (eyeFilter === "left") inCat = inCat.filter((v) => !v.watched);
    const parsed = parseYouTube(search);
    let result = !q
      ? inCat
      : inCat.filter((v) => {
          if (parsed && v.id === parsed.id) return true;
          return (
            v.title.toLowerCase().includes(q) ||
            v.author.toLowerCase().includes(q) ||
            v.url.toLowerCase().includes(q) ||
            v.id.toLowerCase().includes(q)
          );
        });
    if (sortByChannel) {
      result = [...result].sort((a, b) =>
        a.author.localeCompare(b.author) || a.title.localeCompare(b.title),
      );
    }
    return result;
  }, [videos, search, category, eyeFilter, sortByChannel]);

  // If user pastes URL into search of different category, auto-switch
  useEffect(() => {
    const p = parseYouTube(search);
    if (p && p.category !== category) {
      const exists = videos.some((v) => v.category === p.category && v.id === p.id);
      if (exists) setCategory(p.category);
    }
  }, [search, videos, category]);

  // Global paste — paste a YouTube URL anywhere and it gets added
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable) return;
      }
      const text = e.clipboardData?.getData("text") ?? "";
      if (!text) return;
      const parts = text.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
      const anyValid = parts.some((p) => parseYouTube(p));
      if (!anyValid) return;
      e.preventDefault();
      addFromInputs(parts);
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  // Scroll to player whenever a new video is played
  useEffect(() => {
    if (!activeId) return;
    requestAnimationFrame(() => {
      playerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [activeId]);

  const enterFullscreen = () => {
    setPlayerSize("fullscreen");
    requestAnimationFrame(() => {
      const el = playerRef.current;
      if (el && el.requestFullscreen) el.requestFullscreen().catch(() => {});
    });
  };

  const downloadPdf = () => {
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Popup blocked");
      return;
    }
    const rows = videos
      .map(
        (v) => `
        <tr>
          <td>${escapeHtml(CATEGORIES.find((c) => c.value === v.category)?.label ?? "")}</td>
          <td>${escapeHtml(v.title)}</td>
          <td>${escapeHtml(v.author)}</td>
          <td>${v.watched ? "✓" : ""}</td>
          <td><a href="${escapeHtml(v.url)}">${escapeHtml(v.url)}</a></td>
        </tr>`,
      )
      .join("");
    win.document.write(`<!doctype html><html><head><title>TubeDeck export</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111;}
        h1{font-size:20px;margin:0 0 4px;}
        p{color:#666;margin:0 0 16px;font-size:12px;}
        table{width:100%;border-collapse:collapse;font-size:11px;}
        th,td{border-bottom:1px solid #ddd;padding:6px 8px;text-align:left;vertical-align:top;}
        th{background:#f4f4f5;}
        a{color:#2563eb;word-break:break-all;}
      </style></head><body>
      <h1>TubeDeck export</h1>
      <p>${videos.length} items · generated ${new Date().toLocaleString()}</p>
      <table>
        <thead><tr><th>Category</th><th>Title</th><th>Author</th><th>Watched</th><th>URL</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <script>window.onload=()=>{setTimeout(()=>window.print(),200);}</script>
      </body></html>`);
    win.document.close();
  };

  const playerEmbedSrc = activeId
    ? (() => {
        const v = videos.find((x) => `${x.category}:${x.id}` === activeId);
        if (!v) return "";
        if (v.category === "shorts")
          return `https://www.youtube.com/embed/${v.id}?autoplay=1`;
        return `https://www.youtube.com/embed/${v.id}?autoplay=1`;
      })()
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <div className="flex items-center gap-1.5">
            <img src={youtubeLogo} alt="TubeDeck" className="h-6 w-auto" />
            <span className="text-base font-semibold tracking-tight">TubeDeck</span>
          </div>

          <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
            <SelectTrigger className="h-8 w-auto gap-1.5 rounded-full border-border bg-card px-3 text-xs font-medium shadow-sm hover:shadow-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value} className="rounded-md text-xs">
                  <span className="flex items-center gap-2">
                    {c.icon}
                    {c.label}
                    <span className="ml-1 text-muted-foreground">{counts[c.value]}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* count chip */}
          <span className="inline-flex h-7 items-center rounded-full bg-card px-2.5 text-[11px] font-medium text-muted-foreground shadow-sm">
            {counts[category]} {CATEGORIES.find((c) => c.value === category)?.label}
          </span>

          {/* Search */}
          <div className="order-last flex w-full items-stretch sm:order-none sm:mx-auto sm:w-auto sm:max-w-xl sm:flex-1">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, author or paste a YouTube URL…"
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Settings"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-card shadow-sm hover:shadow-md"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl">
              <DropdownMenuLabel className="text-xs">Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={toggleDark} className="cursor-pointer text-xs">
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {dark ? "Light theme" : "Dark theme"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={downloadPdf}
                className="cursor-pointer text-xs"
                disabled={videos.length === 0}
              >
                <Download className="h-4 w-4" /> Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Paste bar below nav */}
        <div className="border-t border-border/60 bg-card/30">
          <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-1.5 sm:px-4">
            <Plus className="h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handlePaste();
              }}
              placeholder="Paste a YouTube link and hit Enter — auto-sorted into the right category"
              className="h-7 flex-1 rounded-full border-transparent bg-background/60 px-3 text-xs shadow-none focus-visible:border-border"
            />
            <Button
              size="sm"
              variant="secondary"
              className="h-7 rounded-full px-3 text-xs"
              onClick={handlePaste}
              disabled={!paste.trim() || loading}
            >
              Add
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:px-4">
        {/* View toggle */}
        <section className="flex items-center justify-end gap-2">
          <div className="inline-flex items-center rounded-full border border-border bg-card p-0.5 shadow-sm">
            <ViewBtn icon={<LayoutGrid className="h-3.5 w-3.5" />} label="Gallery" active={view === "gallery"} onClick={() => setView("gallery")} />
            <ViewBtn icon={<ListIcon className="h-3.5 w-3.5" />} label="List" active={view === "list"} onClick={() => setView("list")} />
            <ViewBtn icon={<Rows3 className="h-3.5 w-3.5" />} label="Compact" active={view === "compact"} onClick={() => setView("compact")} />
          </div>
        </section>

        {/* Player */}
        {activeId && playerEmbedSrc && (
          <Card className="overflow-hidden rounded-2xl p-0 shadow-lg" ref={playerRef as React.Ref<HTMLDivElement>}>
            <div className="flex items-center justify-between gap-2 border-b border-border bg-card/60 px-3 py-2">
              <p className="truncate text-xs font-medium text-muted-foreground">Now playing</p>
              <div className="flex items-center gap-1">
                <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5">
                  <PlayerSizeBtn icon={<Minimize2 className="h-3.5 w-3.5" />} label="Small" active={playerSize === "small"} onClick={() => setPlayerSize("small")} />
                  <PlayerSizeBtn icon={<Monitor className="h-3.5 w-3.5" />} label="Full width" active={playerSize === "full"} onClick={() => setPlayerSize("full")} />
                  <PlayerSizeBtn icon={<Maximize2 className="h-3.5 w-3.5" />} label="Full screen" active={playerSize === "fullscreen"} onClick={enterFullscreen} />
                </div>
                <CopyButton url={videos.find((v) => `${v.category}:${v.id}` === activeId)?.url ?? ""} />
                <a
                  href={videos.find((v) => `${v.category}:${v.id}` === activeId)?.url}
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
                  : "w-full"
              }
            >
              <div className="relative w-full bg-black" style={{ aspectRatio: "16 / 9" }}>
                <iframe
                  key={activeId}
                  src={playerEmbedSrc}
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
              Paste a YouTube link above — videos, shorts, channels & posts are sorted automatically.
            </p>
          </Card>
        ) : view === "gallery" && category === "shorts" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {filtered.map((v) => (
              <ShortsCard
                key={`${v.category}:${v.id}`}
                v={v}
                onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
              />
            ))}
          </div>
        ) : view === "gallery" ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {filtered.map((v) => (
              <GalleryCard
                key={`${v.category}:${v.id}`}
                v={v}
                onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
              />
            ))}
          </div>
        ) : view === "list" ? (
          <div className="flex flex-col gap-2">
            {filtered.map((v) => (
              <ListRow
                key={`${v.category}:${v.id}`}
                v={v}
                onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {filtered.map((v, i) => (
              <CompactRow
                key={`${v.category}:${v.id}`}
                v={v}
                index={i}
                onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
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
              <ClipboardPaste className="h-5 w-5" /> Bulk add
            </DialogTitle>
            <DialogDescription>
              Paste multiple YouTube links separated by commas, spaces or new lines.
              They'll be sorted into videos, shorts, channels or posts automatically.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="https://youtu.be/…, https://youtube.com/shorts/…, https://youtube.com/@handle, https://youtube.com/post/…"
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

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function CopyButton({ url, className }: { url: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button
      onClick={onClick}
      aria-label="Copy link"
      className={
        className ??
        `flex h-7 w-7 items-center justify-center rounded-full transition-colors ${
          copied ? "bg-emerald-500/15 text-emerald-600" : "text-muted-foreground hover:bg-accent"
        }`
      }
    >
      <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
        <Copy
          className={`absolute h-3.5 w-3.5 transition-all duration-200 ${
            copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
          }`}
        />
        <Check
          className={`absolute h-3.5 w-3.5 text-emerald-600 transition-all duration-200 ${
            copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
      </span>
    </button>
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

function ThumbOrFallback({ v, aspect = "16 / 9" }: { v: Video; aspect?: string }) {
  if (v.thumbnail) {
    return (
      <img
        src={v.thumbnail}
        alt={v.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
    );
  }
  const Icon = v.category === "channel" ? Tv : FileText;
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent"
      style={{ aspectRatio: aspect }}
    >
      <Icon className="h-8 w-8 text-muted-foreground" />
    </div>
  );
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
  const playable = v.category === "videos" || v.category === "shorts";
  return (
    <Card className={`group overflow-hidden rounded-2xl p-0 transition-all hover:-translate-y-0.5 hover:shadow-lg ${watchedBorder(v.watched)}`}>
      <button
        onClick={playable ? onPlay : () => window.open(v.url, "_blank")}
        className="relative block w-full overflow-hidden"
        style={{ aspectRatio: "16 / 9" }}
      >
        <ThumbOrFallback v={v} />
        {playable && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <Play className="h-4 w-4 fill-current" />
            </span>
          </span>
        )}
      </button>
      <div className="p-2.5">
        <p className="line-clamp-2 text-xs font-medium leading-snug">{v.title}</p>
        <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
          <label className="flex min-w-0 flex-1 items-center gap-1.5 cursor-pointer">
            <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} className="h-3.5 w-3.5" />
            <span className="truncate">{v.author}</span>
          </label>
          <div className="flex items-center gap-0.5">
            <CopyButton url={v.url} className="rounded p-1 hover:bg-accent" />
            <a href={v.url} target="_blank" rel="noreferrer" className="rounded p-1 hover:bg-accent" aria-label="Open">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button onClick={onRemove} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </Card>
  );
}

function ShortsCard({
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
        style={{ aspectRatio: "9 / 16" }}
      >
        <img
          src={v.thumbnail}
          alt={v.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            <Play className="h-4 w-4 fill-current" />
          </span>
        </span>
        <div className="absolute right-1.5 top-1.5">
          <Checkbox
            checked={v.watched}
            onCheckedChange={onToggleWatched}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 border-white/80 bg-black/30 backdrop-blur"
          />
        </div>
      </button>
      <div className="p-2">
        <p className="line-clamp-2 text-xs font-medium leading-snug">{v.title}</p>
        <div className="mt-1 flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
          <span className="truncate">{v.author}</span>
          <div className="flex items-center gap-0.5">
            <CopyButton url={v.url} className="rounded p-1 hover:bg-accent" />
            <button onClick={onRemove} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
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
  const playable = v.category === "videos" || v.category === "shorts";
  return (
    <Card className={`flex items-center gap-3 rounded-xl p-2 transition-shadow hover:shadow-md ${watchedBorder(v.watched)}`}>
      <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} />
      <button
        onClick={playable ? onPlay : () => window.open(v.url, "_blank")}
        className="relative h-16 w-28 flex-shrink-0 overflow-hidden rounded-lg"
      >
        {v.thumbnail ? (
          <img src={v.thumbnail} alt={v.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {v.category === "channel" ? <Tv className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
          </div>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{v.title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{v.author}</p>
      </div>
      <div className="flex items-center gap-1">
        {playable && (
          <button onClick={onPlay} className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm hover:shadow-md">
            <Play className="h-3.5 w-3.5 fill-current" />
          </button>
        )}
        <CopyButton url={v.url} className="rounded p-2 text-muted-foreground hover:bg-accent" />
        <a href={v.url} target="_blank" rel="noreferrer" className="rounded p-2 text-muted-foreground hover:bg-accent">
          <ExternalLink className="h-4 w-4" />
        </a>
        <button onClick={onRemove} className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
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
  const playable = v.category === "videos" || v.category === "shorts";
  return (
    <div
      className={`flex items-center gap-2.5 border-l-4 px-3 py-1.5 text-sm ${
        v.watched ? "border-l-emerald-500" : "border-l-rose-500"
      } ${index % 2 === 0 ? "bg-card" : "bg-muted/40"}`}
    >
      <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} />
      <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
      <button onClick={playable ? onPlay : () => window.open(v.url, "_blank")} className="h-8 w-14 flex-shrink-0 overflow-hidden rounded">
        {v.thumbnail ? (
          <img src={v.thumbnail} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted">
            {v.category === "channel" ? <Tv className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
          </div>
        )}
      </button>
      <button onClick={playable ? onPlay : () => window.open(v.url, "_blank")} className="min-w-0 flex-1 truncate text-left hover:underline">
        {v.title}
      </button>
      <span className="hidden truncate text-xs text-muted-foreground sm:block sm:w-40">{v.author}</span>
      <CopyButton url={v.url} className="rounded p-1 text-muted-foreground hover:bg-accent" />
      <a href={v.url} target="_blank" rel="noreferrer" className="rounded p-1 text-muted-foreground hover:bg-accent">
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
      <button onClick={onRemove} className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function PlayerSizeBtn({
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      }`}
      aria-pressed={active}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
