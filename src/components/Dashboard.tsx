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
import { Link } from "@tanstack/react-router";
import linkeeLogo from "@/assets/linkee-logo.png";
import {
  LayoutDashboard,
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
  Maximize2,
  Minimize2,
  Monitor,
  RectangleHorizontal,
  X,
  Settings,
  Download,
  Plus,
  Eye,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  User,
  Grid,
  Home,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { getYouTubeMeta } from "@/lib/api/youtube.functions";
import React from "react";

type EyeFilter = "all" | "viewed" | "left";

type PlayerSize = "default" | "theatre" | "fullscreen";
type Category = "videos" | "shorts" | "channel" | "posts";
type ViewMode = "gallery" | "list" | "compact" | "tile";

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

function thumbnailFor(p: Parsed, metaThumbnail?: string): string {
  if (p.category === "channel" || p.category === "posts") {
    return metaThumbnail ?? "";
  }
  if (p.category === "videos" || p.category === "shorts") {
    return `https://i.ytimg.com/vi/${p.id}/hqdefault.jpg`;
  }
  return "";
}

export function Dashboard() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [bulk, setBulk] = useState("");
  const [search, setSearch] = useState("");
  const [paste, setPaste] = useState("");
  const [view, setView] = useState<ViewMode>("gallery");
  const [loading, setLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [playerSize, setPlayerSize] = useState<PlayerSize>("default");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [category, setCategory] = useState<Category>("videos");
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [eyeFilter, setEyeFilter] = useState<EyeFilter>("all");
  const [sortByChannel, setSortByChannel] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackerSelection, setTrackerSelection] = useState<null | { title: string; items: Video[] }>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const pasteInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const alwaysShowControls = true;
  const playerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
 

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const k = e.key.toLowerCase();
      if (k === "+") {
        e.preventDefault();
        pasteInputRef.current?.focus();
        pasteInputRef.current?.select();
        return;
      }
      if (k === "1") return setCategory("videos");
      if (k === "2") return setCategory("shorts");
      if (k === "3") return setCategory("channel");
      if (k === "4") return setCategory("posts");
      if (k === "7") return setEyeFilter("all");
      if (k === "8") return setEyeFilter("viewed");
      if (k === "9") return setEyeFilter("left");
      if (k === "0") return setSortByChannel((s) => !s);
      if (k === "c") return void copyAllLinks();
      if (k === "p") return void downloadPdf();
      if (k === "t") return toggleDark();
      if (k === "s") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (k === "b") {
        const modes: ViewMode[] = ["gallery", "tile", "list", "compact"];
        setView((prev) => {
          const ix = modes.indexOf(prev);
          return modes[(ix + 1) % modes.length];
        });
        return;
      }
      if (k === "h") return void (window.location.href = "/");
      if (k === "?") return setShortcutsOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videos, dark]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const copyAllLinks = async () => {
    if (videos.length === 0) {
      toast.error("No links to copy");
      return;
    }
    const groups: Record<Category, string[]> = { videos: [], shorts: [], channel: [], posts: [] };
    videos.forEach((v) => groups[v.category].push(v.url));
    const sections: string[] = [];
    (Object.keys(groups) as Category[]).forEach((cat) => {
      if (groups[cat].length) {
        const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
        sections.push(`${label}:\n${groups[cat].join(", ")}`);
      }
    });
    const text = sections.join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`Copied ${videos.length} links`);
    } catch {
      toast.error("Copy failed");
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem("tubedeck.theme");
    const prefersDark =
      stored === "dark" ||
      !stored;
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
    let cancelled = false;

    const loadVideos = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const storedVideos = JSON.parse(raw) as Video[];
        if (cancelled) return;
        setVideos(storedVideos);

        const missingThumbnails = storedVideos.filter(
          (video) => (video.category === "channel" || video.category === "posts") && !video.thumbnail,
        );
        if (missingThumbnails.length === 0) return;

        const updates = await Promise.all(
          missingThumbnails.map(async (video) => {
            const meta = await getYouTubeMeta({ data: { url: video.url, category: video.category } });
            return {
              key: `${video.category}:${video.id}`,
              thumbnail: meta.thumbnail ?? "",
            };
          }),
        );

        if (cancelled) return;

        setVideos((current) =>
          current.map((video) => {
            const match = updates.find((entry) => entry.key === `${video.category}:${video.id}`);
            return match && !video.thumbnail ? { ...video, thumbnail: match.thumbnail } : video;
          }),
        );
      } catch {
        // ignore
      }
    };

    void loadVideos();

    return () => {
      cancelled = true;
    };
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
        const meta = await getYouTubeMeta({ data: { url: p.url, category: p.category } });
        return {
          id: p.id,
          title: meta.title,
          author: meta.author,
          thumbnail: thumbnailFor(p, meta.thumbnail),
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

  const trackerStats = useMemo(() => {
    const watched = videos.filter((v) => v.watched).length;
    const left = videos.length - watched;
    const watchedPct = videos.length ? Math.round((watched / videos.length) * 100) : 0;
    return {
      total: videos.length,
      watched,
      left,
      watchedPct,
      byCategory: [
        { key: "videos" as Category, label: "Videos", count: counts.videos },
        { key: "shorts" as Category, label: "Shorts", count: counts.shorts },
        { key: "channel" as Category, label: "Channels", count: counts.channel },
        { key: "posts" as Category, label: "Posts", count: counts.posts },
      ],
    };
  }, [videos, counts]);

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

  const openTracker = () => {
    setTrackerOpen(true);
    setTrackerSelection(null);
    setSidebarOpen(false);
  };

  const openCategory = (value: Category) => {
    setTrackerOpen(false);
    setTrackerSelection(null);
    setCategory(value);
    setSidebarOpen(false);
  };

  const openTrackerSelection = (title: string, items: Video[]) => {
    setTrackerOpen(true);
    setTrackerSelection({ title, items });
    setSidebarOpen(false);
  };

  const closeTrackerSelection = () => setTrackerSelection(null);

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
    const el = playerRef.current;
    if (el && el.requestFullscreen) {
      el.requestFullscreen().then(() => {
        setPlayerSize("fullscreen");
      }).catch(() => { });
    } else {
      setPlayerSize("fullscreen");
    }
  };

  // Sync playerSize when user exits OS fullscreen (Esc or browser button)
  useEffect(() => {
    const onFsChange = () => {
      if (!document.fullscreenElement && playerSize === "fullscreen") {
        setPlayerSize("default");
      }
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, [playerSize]);

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
        return `https://www.youtube.com/embed/${v.id}?autoplay=1&enablejsapi=1`;
      return `https://www.youtube.com/embed/${v.id}?autoplay=1&enablejsapi=1`;
    })()
    : "";

  const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 4];

  const applySpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: "setPlaybackRate", args: [speed] }),
        "*"
      );
    }
  };

  // Close player if active video's category is different from the currently selected category
  useEffect(() => {
    if (activeId) {
      const v = videos.find((x) => `${x.category}:${x.id}` === activeId);
      if (v && v.category !== category) {
        setActiveId(null);
      }
    }
  }, [category, activeId, videos]);

  const isSplit = false;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground">
      {/* ── Full-width Top Navbar ── */}
      <header className="z-40 w-full shrink-0 border-b border-sky-100 bg-gradient-to-r from-sky-50 via-white to-indigo-50 text-slate-900 shadow-[0_8px_20px_rgba(14,165,233,0.08)] dark:border-indigo-400/20 dark:bg-gradient-to-r dark:from-slate-950 dark:via-indigo-950/80 dark:to-purple-950/80 dark:text-slate-100 dark:shadow-sm">
        <div className="flex flex-col gap-2 px-3 py-2 md:flex-row md:flex-wrap md:items-center md:justify-between">

          {/* Left: Mobile Menu + Home + View Buttons */}
          <div className="flex w-full items-center gap-1.5 md:order-1 md:w-auto">
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all md:hidden dark:border-indigo-300/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 dark:hover:border-indigo-200/35"
              aria-label="Open menu"
            >
              <ListIcon className="h-4 w-4" />
            </button>
            <Link
              to="/"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm hover:bg-sky-50 border border-sky-200 hover:scale-105 transition-transform text-slate-700 hover:text-sky-700 dark:border-indigo-300/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 dark:hover:text-white"
              aria-label="Home"
            >
              <Home className="h-4 w-4" />
            </Link>
            <div className="flex min-w-0 flex-1 md:hidden">
              <div className="relative w-full group">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300/75" />
                <Input
                  ref={searchInputRef}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search titles..."
                  className="h-9 w-full rounded-full border border-sky-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:bg-white focus:border-sky-300 focus:ring-0 focus-visible:ring-0 outline-none transition-all dark:border-indigo-300/20 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-300/65 dark:focus:border-indigo-300 dark:focus:bg-white/15"
                />
              </div>
            </div>
            <div className="inline-flex shrink-0 items-center rounded-full border border-sky-200 bg-white/90 p-0.5 shadow-sm dark:border-indigo-300/20 dark:bg-white/10 md:ml-0">
              <ViewBtn icon={<LayoutDashboard className="h-3.5 w-3.5" />} label="Gallery" active={view === "gallery"} onClick={() => setView("gallery")} />
              <ViewBtn icon={<Grid className="h-3.5 w-3.5" />} label="Tile" active={view === "tile"} onClick={() => setView("tile")} />
              <ViewBtn icon={<ListIcon className="h-3.5 w-3.5" />} label="List" active={view === "list"} onClick={() => setView("list")} />
              <ViewBtn icon={<Rows3 className="h-3.5 w-3.5" />} label="Compact" active={view === "compact"} onClick={() => setView("compact")} />
            </div>
          </div>

          {/* Center: Search */}
          <div className="order-2 hidden w-full flex-1 max-w-none md:mx-2 md:flex md:max-w-md md:order-2">
            <div className="relative w-full group">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-300/75" />
              <Input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search titles, authors..."
                className="h-9 w-full rounded-full border border-sky-200 bg-white pl-10 pr-3 text-sm font-medium text-slate-800 placeholder:text-slate-400 shadow-sm focus:bg-white focus:border-sky-300 focus:ring-0 focus-visible:ring-0 outline-none transition-all dark:border-indigo-300/20 dark:bg-white/10 dark:text-slate-100 dark:placeholder:text-slate-300/65 dark:focus:border-indigo-300 dark:focus:bg-white/15"
              />
            </div>
          </div>

          {/* Right: Add control + Settings */}
          <div className="order-3 flex w-full items-center gap-1.5 md:w-auto md:order-3 md:justify-end">
            <div className="inline-flex flex-1 items-center rounded-full border border-sky-200 bg-white/90 px-1 py-0.5 shadow-sm gap-0.5 dark:border-indigo-300/20 dark:bg-white/10 md:flex-none">
              {/* Add single link — always-visible input, auto-submits on paste */}
              <Plus className="h-3.5 w-3.5 ml-1 shrink-0 text-slate-500 dark:text-slate-300/80" />
              <Input
                ref={pasteInputRef}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handlePaste(); }}
                onPaste={(e) => {
                  const text = e.clipboardData.getData("text").trim();
                  const parsed = parseYouTube(text);
                  if (parsed) {
                    e.preventDefault();
                    setPaste("");
                    addFromInputs([text]);
                    setCategory(parsed.category);
                  }
                }}
                placeholder="Paste YouTube link…"
                disabled={loading}
                className="h-7 min-w-0 flex-1 rounded-full border-0 bg-transparent px-2 text-xs text-slate-700 shadow-none focus-visible:ring-0 placeholder:text-slate-400 dark:text-slate-100 dark:placeholder:text-slate-300/65 md:w-44 md:flex-none"
              />
              {/* Bulk add */}
              <button
                onClick={() => setBulkOpen(true)}
                className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium text-slate-700 hover:bg-sky-100 hover:text-sky-800 transition-all dark:text-slate-100 dark:hover:bg-white/15 dark:hover:text-white shrink-0"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span className="ml-1">Bulk</span>
              </button>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button aria-label="Settings" className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm hover:shadow-md border border-sky-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 transition-all dark:border-indigo-300/20 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/15 dark:hover:border-indigo-200/35">
                  <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl">
                <DropdownMenuLabel className="text-xs">Settings</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShortcutsOpen(true)} className="cursor-pointer text-xs">
                  Keyboard shortcuts
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggleDark} className="cursor-pointer text-xs">
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {dark ? "Light theme" : "Dark theme"}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={copyAllLinks} className="cursor-pointer text-xs" disabled={videos.length === 0}>
                  <Copy className="h-4 w-4" /> Copy links
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadPdf} className="cursor-pointer text-xs" disabled={videos.length === 0}>
                  <Download className="h-4 w-4" /> Download PDF
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setProfileOpen(true)} className="cursor-pointer text-xs">
                  <User className="h-4 w-4" /> Profile
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

        </div>
      </header>

      {/* Mobile Drawer Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-background/80 backdrop-blur-sm">
          <div className="w-56 bg-gradient-to-b from-sky-50 via-white to-indigo-50 p-4 flex flex-col justify-between border-r border-sky-200 shadow-xl ring-1 ring-sky-200/70 animate-in slide-in-from-left duration-200 h-full dark:bg-gradient-to-b dark:from-slate-950 dark:via-indigo-950/80 dark:to-indigo-950/80 dark:border-indigo-300/20 dark:ring-indigo-300/20">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-base tracking-tight bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">Linkee</span>
                <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1 hover:bg-accent text-muted-foreground" aria-label="Close menu">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  onClick={openTracker}
                  className={`mb-1 flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${trackerOpen ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}
                >
                  <span className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" />Tracker</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${trackerOpen ? "bg-background/20 text-background" : "bg-foreground/5 text-muted-foreground"}`}>{videos.length}</span>
                </button>
                {CATEGORIES.map((c) => {
                  const isActive = category === c.value;
                  return (
                    <button key={c.value} onClick={() => openCategory(c.value)}
                      className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-xs font-semibold transition-all ${isActive ? "bg-foreground text-background" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                        }`}>
                      <span className="flex items-center gap-2">{c.icon}{c.label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive ? "bg-background/20 text-background" : "bg-foreground/5 text-muted-foreground"
                        }`}>{counts[c.value]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-black/10 dark:border-white/10 pt-3">
              <div className="grid grid-cols-3 gap-1 rounded-lg bg-foreground/5 p-1">
                {(["all", "viewed", "left"] as EyeFilter[]).map((filter) => (
                  <button key={filter} onClick={() => { setEyeFilter(filter); setSidebarOpen(false); }}
                    className={`rounded-md py-1.5 text-center text-xs font-semibold capitalize transition-all ${eyeFilter === filter ? "bg-foreground text-background" : "text-muted-foreground"
                      }`}>
                    {filter === "all" ? "All" : filter === "viewed" ? "Viewed" : "Left"}
                  </button>
                ))}
              </div>
              <button onClick={() => { setSortByChannel((s) => !s); setSidebarOpen(false); }}
                className={`flex items-center gap-2 w-full rounded-lg border px-3 py-2 text-xs font-semibold transition-all ${sortByChannel ? "border-foreground bg-foreground/5 text-foreground" : "border-black/10 dark:border-white/10 text-muted-foreground"
                  }`}>
                <ArrowUpDown className="h-3.5 w-3.5" />
                Group by Channel
                <span className={`ml-auto h-2 w-2 rounded-full ${sortByChannel ? "bg-emerald-500" : "bg-muted-foreground/30"}`} />
              </button>
            </div>
          </div>
          <div className="flex-1" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* ── Body: slim sidebar + main content ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Slim Icon Sidebar */}
        <aside className="hidden md:flex w-[64px] shrink-0 flex-col items-center justify-between border-r border-sky-200 bg-gradient-to-b from-sky-50 via-white to-indigo-50 py-2 h-full overflow-hidden shadow-lg ring-1 ring-sky-200/70 dark:border-indigo-300/20 dark:bg-gradient-to-b dark:from-slate-950 dark:via-indigo-950/80 dark:to-indigo-950/80 dark:ring-indigo-300/20">
          {/* Top: Category icons */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              onClick={openTracker}
              className={`group relative mb-1 flex flex-col items-center justify-center w-[52px] h-[48px] rounded-lg transition-colors duration-150 ${trackerOpen
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground dark:text-slate-200 hover:bg-accent/60 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-slate-100"
                }`}
              aria-label="Tracker"
            >
              {trackerOpen && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full bg-primary" />
              )}
              <div className="relative flex items-center justify-center">
                <LayoutDashboard className="h-4 w-4" />
                {videos.length > 0 && (
                  <span className={`absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[9px] font-semibold leading-none px-1 ${trackerOpen ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground dark:bg-transparent dark:text-slate-300"
                    }`}>{videos.length}</span>
                )}
              </div>
              <span className="text-[9px] mt-1 font-medium tracking-tight leading-none">Tracker</span>
            </button>
            {CATEGORIES.map((c) => {
              const isActive = category === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => openCategory(c.value)}
                  className={`group relative flex flex-col items-center justify-center w-[52px] h-[48px] rounded-lg transition-colors duration-150 ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground dark:text-slate-200 hover:bg-accent/60 dark:hover:bg-white/10 hover:text-foreground dark:hover:text-slate-100"
                    }`}
                  aria-label={c.label}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full bg-primary" />
                  )}
                  <div className="relative flex items-center justify-center">
                    {c.icon}
                    {counts[c.value] > 0 && (
                      <span className={`absolute -top-1 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full text-[9px] font-semibold leading-none px-1 ${isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground dark:bg-transparent dark:text-slate-300"
                        }`}>{counts[c.value]}</span>
                    )}
                  </div>
                  <span className="text-[9.5px] mt-1 font-medium tracking-tight leading-none">{c.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom: Filter & Sort icons */}
          <div className="flex flex-col items-center gap-0.5">
            {/* Filter group */}
            <div className="flex flex-col items-center gap-0.5 border-t border-border pt-1.5">
              {(["all", "viewed", "left"] as EyeFilter[]).map((filter) => {
                const icons: Record<EyeFilter, React.ReactNode> = {
                  all: <Eye className="h-4 w-4" />,
                  viewed: <Check className="h-4 w-4" />,
                  left: <Play className="h-4 w-4" />,
                };
                const labels: Record<EyeFilter, string> = { all: "All", viewed: "Viewed", left: "Left" };
                  const activeStyles: Record<EyeFilter, string> = {
                  all: "bg-gradient-to-br from-sky-100 to-cyan-100 text-sky-700 ring-1 ring-sky-300 shadow-sm dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-sky-500/10 dark:text-sky-400 dark:ring-0 dark:shadow-none",
                  viewed: "bg-gradient-to-br from-emerald-100 to-lime-100 text-emerald-700 ring-1 ring-emerald-300 shadow-sm dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-0 dark:shadow-none",
                  left: "bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700 ring-1 ring-amber-300 shadow-sm dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-amber-500/10 dark:text-amber-400 dark:ring-0 dark:shadow-none",
                };
                  const indicatorColors: Record<EyeFilter, string> = {
                    all: "bg-sky-500",
                    viewed: "bg-emerald-500",
                    left: "bg-amber-500",
                  };
                const hoverText: Record<EyeFilter, string> = {
                  all: "hover:text-sky-500",
                  viewed: "hover:text-emerald-500",
                  left: "hover:text-amber-500",
                };
                const isActive = eyeFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() => setEyeFilter(filter)}
                    className={`relative flex flex-col items-center justify-center w-[52px] h-[44px] rounded-lg transition-colors duration-150 ${isActive
                        ? activeStyles[filter]
                        : `text-muted-foreground dark:text-slate-100 hover:bg-accent/60 dark:hover:bg-white/10 dark:hover:text-slate-100 ${hoverText[filter]}`
                      }`}
                    aria-label={labels[filter]}
                  >
                    {isActive && (
                      <span className={`absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full ${indicatorColors[filter]}`} />
                    )}
                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full transition-all ${isActive ? "bg-white/80" : "bg-slate-100/80"} dark:bg-transparent`}>
                      {icons[filter]}
                    </span>
                    <span className="text-[9.5px] mt-0.5 font-medium tracking-tight leading-none">{labels[filter]}</span>
                  </button>
                );
              })}
            </div>

            {/* Separator above Sort */}
            <div className="my-1 h-px w-6 bg-border" />

            {/* Sort */}
            <button
              onClick={() => setSortByChannel((s) => !s)}
              className={`relative flex flex-col items-center justify-center w-[52px] h-[44px] rounded-lg transition-colors duration-150 ${sortByChannel
                  ? "bg-gradient-to-br from-violet-100 to-fuchsia-100 text-violet-700 ring-1 ring-violet-300 shadow-sm dark:from-transparent dark:via-transparent dark:to-transparent dark:bg-violet-500/10 dark:text-violet-400 dark:ring-0 dark:shadow-none"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-violet-500"
                }`}
              aria-label="Sort by channel"
            >
              {sortByChannel && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[2px] rounded-r-full bg-violet-500" />
                )}
              <div className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100/80 dark:bg-white/10">
                <ArrowUpDown className="h-4 w-4" />
                <span className={`absolute -top-1 -right-1.5 h-1.5 w-1.5 rounded-full transition-all ${sortByChannel ? "bg-violet-500 shadow-[0_0_6px_rgba(139,92,246,0.7)]" : "bg-violet-500/40"
                  }`} />
              </div>
              <span className="text-[9.5px] mt-0.5 font-medium tracking-tight leading-none">Group</span>
            </button>
          </div>
        </aside>



        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <main className={`mx-auto w-full ${activeId ? "max-w-none" : "max-w-7xl"} px-3 py-4 sm:px-4 ${isSplit ? "flex flex-col md:flex-row gap-4 items-start" : "space-y-4"}`}>
            {/* Player */}
            {activeId && playerEmbedSrc && (
              <div className={`w-full ${playerSize === "theatre" ? "-mx-3 sm:-mx-4" : ""} -mt-4 sm:-mt-4`}>
                <Card
                  className={`tubedeck-player relative overflow-hidden p-0 w-full bg-gradient-to-b from-card to-card/95 border border-border ring-1 ring-primary/10 shadow-[0_10px_40px_-12px_rgba(0,0,0,0.18)] ${playerSize === "theatre" ? "rounded-none" : "rounded-2xl mx-auto"}`}
                  ref={playerRef as React.Ref<HTMLDivElement>}
                >
                <div className="tubedeck-player-bar flex items-center justify-between gap-2 bg-gradient-to-r from-card via-card to-card/80 px-3 py-2 border-b border-border/60">
                  <div className="flex min-w-0 items-center gap-2">
                    <p className="truncate text-xs font-medium text-muted-foreground">Now playing</p>
                    <NowPlayingBars />
                  </div>
                  <div className="flex items-center gap-1">
                    {/* Speed control */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          aria-label="Playback speed"
                          className="flex h-7 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <span className="tabular-nums">{playbackSpeed === 1 ? "1x" : `${playbackSpeed}x`}</span>
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-28 rounded-xl">
                        <DropdownMenuLabel className="text-xs">Speed</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {SPEED_OPTIONS.map((s) => (
                          <DropdownMenuItem
                            key={s}
                            onClick={() => applySpeed(s)}
                            className={`cursor-pointer text-xs tabular-nums ${playbackSpeed === s ? "font-semibold text-primary" : ""
                              }`}
                          >
                            {s === 1 ? "1x (normal)" : `${s}x`}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <div className="inline-flex items-center rounded-full border border-border bg-background p-0.5 shadow-sm">
                      <PlayerSizeBtn icon={<Monitor className="h-3.5 w-3.5" />} label="Default" active={playerSize === "default"} onClick={() => setPlayerSize("default")} />
                      <PlayerSizeBtn icon={<RectangleHorizontal className="h-3.5 w-3.5" />} label="Theatre" active={playerSize === "theatre"} onClick={() => setPlayerSize("theatre")} />
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
                {activeId.startsWith("shorts:") && playerSize !== "fullscreen" ? (
                  <div className="flex w-full items-center justify-center bg-black py-4">
                    <div className="relative flex items-center gap-3">
                      <div
                        className="relative overflow-hidden rounded-xl bg-black"
                        style={{ aspectRatio: "9 / 16", height: "min(80vh, 720px)" }}
                      >
                        <iframe
                          key={activeId}
                          src={playerEmbedSrc}
                          title="YouTube short"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            const list = videos.filter((x) => x.category === "shorts");
                            const idx = list.findIndex((x) => `${x.category}:${x.id}` === activeId);
                            const prev = list[idx - 1];
                            if (prev) setActiveId(`${prev.category}:${prev.id}`);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow hover:bg-accent disabled:opacity-40"
                          aria-label="Previous short"
                        >
                          <ChevronUp className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => {
                            const list = videos.filter((x) => x.category === "shorts");
                            const idx = list.findIndex((x) => `${x.category}:${x.id}` === activeId);
                            const next = list[idx + 1];
                            if (next) setActiveId(`${next.category}:${next.id}`);
                          }}
                          className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow hover:bg-accent disabled:opacity-40"
                          aria-label="Next short"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full bg-black">
                    {playerSize === "fullscreen" ? (
                      <div className="relative w-full h-screen">
                        <iframe
                          key={activeId}
                          ref={iframeRef}
                          src={playerEmbedSrc}
                          title="YouTube player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    ) : playerSize === "theatre" ? (
                      <div className="relative w-full mx-auto" style={{ aspectRatio: "16 / 9", maxHeight: "calc(100vh - 180px)" }}>
                        <iframe
                          key={activeId}
                          ref={iframeRef}
                          src={playerEmbedSrc}
                          title="YouTube player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    ) : (
                      <div className="relative mx-auto w-full max-w-5xl" style={{ aspectRatio: "16 / 9" }}>
                        <iframe
                          key={activeId}
                          ref={iframeRef}
                          src={playerEmbedSrc}
                          title="YouTube player"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="absolute inset-0 h-full w-full"
                        />
                      </div>
                    )}
                  </div>
                )}
                </Card>
              </div>
            )}

            <div className={isSplit ? "flex-1 w-full min-w-0" : "w-full"}>
              {/* Results */}
            {trackerOpen ? (
              <TrackerPanel
                stats={trackerStats}
                videos={videos}
                onOpenCollection={openTrackerSelection}
                onClose={() => {
                  setTrackerOpen(false);
                  setTrackerSelection(null);
                }}
              />
            ) : filtered.length === 0 ? (
              <Card className="flex flex-col items-center justify-center gap-2 rounded-2xl p-12 text-center shadow-sm">
                <Youtube className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm font-medium">Nothing here yet</p>
                <p className="text-xs text-muted-foreground">
                  Paste a YouTube link above — videos, shorts, channels & posts are sorted automatically.
                </p>
              </Card>
            ) : view === "gallery" && category === "shorts" ? (
              <div className={isSplit ? "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 lg:grid-cols-4" : "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-5"}>
                {filtered.map((v) => (
                  <ShortsCard
                    key={`${v.category}:${v.id}`}
                    v={v}
                    onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                    onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                    onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
                    alwaysShowControls={alwaysShowControls}
                  />
                ))}
              </div>
            ) : view === "gallery" ? (
              <div className={isSplit ? "grid grid-cols-2 gap-x-4 gap-y-4 lg:grid-cols-3" : "grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3 md:grid-cols-4"}>
                {filtered.map((v) => (
                  <GalleryCard
                    key={`${v.category}:${v.id}`}
                    v={v}
                    onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                    onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                    onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
                    alwaysShowControls={alwaysShowControls}
                  />
                ))}
              </div>
            ) : view === "tile" && category === "shorts" ? (
              <div className={isSplit ? "grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 md:grid-cols-3"}>
                {filtered.map((v) => (
                  <ShortsCard
                    key={`${v.category}:${v.id}`}
                    v={v}
                    onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                    onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                    onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
                    alwaysShowControls={alwaysShowControls}
                  />
                ))}
              </div>
            ) : view === "tile" ? (
              <div className={isSplit ? "grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 lg:grid-cols-3" : "grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2 md:grid-cols-3"}>
                {filtered.map((v) => (
                  <GalleryCard
                    key={`${v.category}:${v.id}`}
                    v={v}
                    onPlay={() => setActiveId(`${v.category}:${v.id}`)}
                    onRemove={() => setConfirmId(`${v.category}:${v.id}`)}
                    onToggleWatched={() => toggleWatched(`${v.category}:${v.id}`)}
                    alwaysShowControls={alwaysShowControls}
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
            </div>
          </main>

          <Dialog open={!!trackerSelection} onOpenChange={(open) => !open && closeTrackerSelection()}>
            <DialogContent className="max-w-3xl overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50 to-indigo-50 p-0 shadow-2xl dark:border-indigo-300/20 dark:from-slate-950 dark:via-indigo-950/80 dark:to-indigo-950/90 sm:max-w-4xl">
                <div className="border-b border-sky-100 px-5 py-4 dark:border-white/10 sm:px-6">
                <div>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
                      <span>{trackerSelection?.title ?? "Videos"}</span>
                      <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700 dark:bg-white/10 dark:text-slate-100">
                        {trackerSelection?.items.length ?? 0}
                      </span>
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-sm text-slate-600 dark:text-slate-300/80">
                      Videos in this collection
                    </DialogDescription>
                </div>
              </div>

              <div className="max-h-[70vh] overflow-auto px-4 py-4 sm:px-6">
                {trackerSelection && trackerSelection.items.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {trackerSelection.items.map((video) => (
                      <button
                        key={`${video.category}:${video.id}`}
                        type="button"
                        onClick={() => {
                          setCategory(video.category);
                          setActiveId(`${video.category}:${video.id}`);
                          setTrackerSelection(null);
                        }}
                        className="group flex items-stretch gap-3 rounded-2xl border border-sky-100 bg-white/80 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                      >
                        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-200 dark:bg-white/10">
                          <ThumbOrFallback v={video} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:bg-white/10 dark:text-slate-100">
                              {video.category}
                            </span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${video.watched ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300"}`}>
                              {video.watched ? "Watched" : "Left"}
                            </span>
                          </div>
                          <p className="mt-2 truncate text-sm font-semibold text-slate-900 dark:text-white">{video.title}</p>
                          <p className="truncate text-xs text-slate-600 dark:text-slate-300/75">{video.author}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-sky-200/80 bg-white/70 px-6 py-10 text-center dark:border-white/10 dark:bg-white/5">
                    <Youtube className="h-10 w-10 text-slate-400 dark:text-slate-300/75" />
                    <p className="text-sm font-medium text-slate-900 dark:text-white">No videos in this collection yet</p>
                    <p className="text-xs text-slate-600 dark:text-slate-300/75">Add a few links and this tracker will populate automatically.</p>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

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

          <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Profile</DialogTitle>
                <DialogDescription>Built by Provansh</DialogDescription>
              </DialogHeader>
              <div className="flex items-center gap-4 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-2xl font-bold text-primary-foreground">
                  P
                </div>
                <div>
                  <div className="text-base font-semibold">Provansh</div>
                  <div className="text-xs text-muted-foreground">Creator of TubeDeck</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <a
                  href="https://x.com/provanshh"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  <span>𝕏 / Twitter</span>
                  <span className="text-xs text-muted-foreground">@provanshh</span>
                </a>
                <a
                  href="https://www.linkedin.com/in/provanshh/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                >
                  <span>LinkedIn</span>
                  <span className="text-xs text-muted-foreground">in/provanshh</span>
                </a>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={shortcutsOpen} onOpenChange={setShortcutsOpen}>
              <DialogContent className="sm:max-w-lg my-8 max-h-[calc(100vh-6rem)] overflow-auto">
              <DialogHeader>
                <DialogTitle>Keyboard shortcuts</DialogTitle>
                <DialogDescription>Quick keys for fast navigation and actions.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 py-4 max-h-[calc(100vh-6rem)] overflow-auto">
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">+</kbd><span>Focus add link bar</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">1</kbd><span>Videos</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">2</kbd><span>Shorts</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">3</kbd><span>Channels</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">4</kbd><span>Posts</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">7</kbd><span>All</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">8</kbd><span>Viewed</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">9</kbd><span>Left</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">0</kbd><span>Toggle Group by Channel</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">C</kbd><span>Copy all links</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">P</kbd><span>Download PDF</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">T</kbd><span>Toggle theme</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">S</kbd><span>Focus search</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">B</kbd><span>Cycle view modes</span></div>
                <div className="flex items-center gap-3"><kbd className="rounded-md bg-muted/30 px-2 py-1 text-xs font-semibold">H</kbd><span>Go home</span></div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}

class ErrorBoundary extends React.Component<{ children?: React.ReactNode }, { hasError: boolean; error?: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, info: any) {
    // Log to console for developer
    // eslint-disable-next-line no-console
    console.error("Dashboard render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Something went wrong rendering the dashboard</h2>
          <pre className="mt-3 max-h-[60vh] overflow-auto text-xs bg-muted p-3 rounded">{String(this.state.error)}</pre>
        </div>
      );
    }
    return this.props.children ?? null;
  }
}

export default function DashboardWithBoundary() {
  return (
    <ErrorBoundary>
      <Dashboard />
    </ErrorBoundary>
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

function CopyButton({
  url,
  className,
  asMenuItem,
}: {
  url: string;
  className?: string;
  asMenuItem?: boolean;
}) {
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
  if (asMenuItem) {
    return (
      <button
        onClick={onClick}
        className="flex w-full items-center gap-2 pl-1.5 text-xs"
      >
        {copied
          ? <Check className="h-3.5 w-3.5 text-emerald-600" />
          : <Copy className="h-3.5 w-3.5" />
        }
        {copied ? "Copied!" : "Copy link"}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      aria-label="Copy link"
      className={
        className ??
        `flex h-7 w-7 items-center justify-center rounded-full transition-colors ${copied ? "bg-emerald-500/15 text-emerald-600" : "text-muted-foreground hover:bg-accent"
        }`
      }
    >
      <span className="relative inline-flex h-3.5 w-3.5 items-center justify-center">
        <Copy
          className={`absolute h-3.5 w-3.5 transition-all duration-200 ${copied ? "scale-50 opacity-0" : "scale-100 opacity-100"
            }`}
        />
        <Check
          className={`absolute h-3.5 w-3.5 text-emerald-600 transition-all duration-200 ${copied ? "scale-100 opacity-100" : "scale-50 opacity-0"
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
        className={`view-btn inline-flex items-center rounded-full px-2 py-1 text-xs font-medium transition-all ${active
          ? "bg-slate-900 text-white shadow-md dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500 dark:shadow-[0_8px_20px_rgba(99,102,241,0.45)]"
          : "text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:text-slate-100 dark:hover:bg-white/15 dark:hover:text-white"
        }`}
      aria-pressed={active}
      title={label}
    >
      {icon}
      <span className="view-btn-label">{label}</span>
    </button>
  );
}

function TrackerPanel({
  stats,
  videos,
  onOpenCollection,
  onClose,
}: {
  stats: {
    total: number;
    watched: number;
    left: number;
    watchedPct: number;
    byCategory: { key: Category; label: string; count: number }[];
  };
  videos: Video[];
  onOpenCollection: (title: string, items: Video[]) => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-4">
      <Card className="rounded-2xl border border-sky-200/70 bg-gradient-to-br from-sky-50 via-white to-indigo-50 p-4 shadow-sm dark:border-indigo-300/20 dark:from-slate-950 dark:via-indigo-950/60 dark:to-indigo-950/80">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Your library at a glance</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300/80">A quick snapshot of saved, watched and what is still left to watch.</p>
          </div>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 transition-all"
            style={{ width: `${stats.watchedPct}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300/75">
          <span>{stats.watchedPct}% watched</span>
          <span>{stats.watched} watched of {stats.total} saved</span>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onOpenCollection("Saved videos", videos)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenCollection("Saved videos", videos)}
          className="cursor-pointer rounded-2xl border border-sky-300/90 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.12)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(15,23,42,0.16)] dark:border-border/80 dark:bg-card/95 dark:shadow-sm dark:hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Saved</p>
          <p className="mt-2 text-3xl font-bold text-foreground">{stats.total}</p>
          <p className="mt-1 text-sm text-muted-foreground">Tap to see every saved item</p>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onOpenCollection("Watched videos", videos.filter((video) => video.watched))}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenCollection("Watched videos", videos.filter((video) => video.watched))}
          className="cursor-pointer rounded-2xl border border-emerald-300/90 bg-emerald-50/80 p-4 shadow-[0_10px_28px_rgba(16,185,129,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(16,185,129,0.18)] dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:shadow-sm dark:hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">Watched</p>
          <p className="mt-2 text-3xl font-bold text-emerald-700 dark:text-emerald-300">{stats.watched}</p>
          <p className="mt-1 text-sm text-emerald-700/80 dark:text-emerald-200/75">Tap to review watched items</p>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onOpenCollection("Left to watch", videos.filter((video) => !video.watched))}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenCollection("Left to watch", videos.filter((video) => !video.watched))}
          className="cursor-pointer rounded-2xl border border-amber-300/90 bg-amber-50/80 p-4 shadow-[0_10px_28px_rgba(245,158,11,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(245,158,11,0.18)] dark:border-amber-500/20 dark:bg-amber-500/10 dark:shadow-sm dark:hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">Left</p>
          <p className="mt-2 text-3xl font-bold text-amber-700 dark:text-amber-300">{stats.left}</p>
          <p className="mt-1 text-sm text-amber-700/80 dark:text-amber-200/75">Tap to see the remaining queue</p>
        </Card>
        <Card
          role="button"
          tabIndex={0}
          onClick={() => onOpenCollection("Library efficiency", videos)}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onOpenCollection("Library efficiency", videos)}
          className="cursor-pointer rounded-2xl border border-sky-300/90 bg-sky-50/80 p-4 shadow-[0_10px_28px_rgba(14,165,233,0.14)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_34px_rgba(14,165,233,0.18)] dark:border-indigo-300/20 dark:bg-white/10 dark:shadow-sm dark:hover:shadow-md"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 dark:text-sky-300">Efficiency</p>
          <p className="mt-2 text-3xl font-bold text-sky-700 dark:text-sky-300">{stats.watchedPct}%</p>
          <p className="mt-1 text-sm text-sky-700/80 dark:text-sky-200/75">Tap for the full library view</p>
        </Card>
      </div>

      <Card className="rounded-2xl border border-border/80 bg-card/95 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold text-foreground">Category breakdown</h4>
            <p className="text-xs text-muted-foreground">How your saved items are distributed.</p>
          </div>
          <div className="text-xs text-muted-foreground">Saved items</div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.byCategory.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onOpenCollection(item.label, videos.filter((video) => video.category === item.key))}
              className="rounded-2xl border border-sky-300/80 bg-white p-3 text-left shadow-[0_8px_22px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.12)] dark:border-border/70 dark:bg-background/80 dark:shadow-none dark:hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <span className="text-lg font-bold text-foreground">{item.count}</span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-pink-500"
                  style={{ width: `${stats.total ? Math.max(8, Math.round((item.count / Math.max(stats.total, 1)) * 100)) : 0}%` }}
                />
              </div>
            </button>
          ))}
        </div>
      </Card>

    </div>
  );
}

function watchedBorder(watched: boolean) {
  return watched
    ? "border border-emerald-500/90 ring-1 ring-black/25 dark:ring-white/20 bg-emerald-50/45 dark:bg-emerald-500/10 shadow-[0_0_0_2px_rgba(16,185,129,0.18),0_12px_24px_rgba(16,185,129,0.14)] watched-card-border"
    : "border border-rose-500/90 ring-1 ring-black/25 dark:ring-white/20 bg-rose-50/45 dark:bg-rose-500/10 shadow-[0_0_0_2px_rgba(244,63,94,0.18),0_12px_24px_rgba(244,63,94,0.14)]";
}

/** Derive a stable pastel hue from any string */
function stringToHsl(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffffff;
  return `hsl(${h % 360},55%,55%)`;
}

/** Circular avatar with first letter for channels/posts */
function ChannelAvatar({ author, size = 32 }: { author: string; size?: number }) {
  const bg = stringToHsl(author || "?");
  const letter = (author || "?")[0].toUpperCase();
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white select-none"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}
      aria-label={author}
    >
      {letter}
    </span>
  );
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
  // For channels/posts show a large branded avatar
  if (v.category === "channel" || v.category === "posts") {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent/60">
        <ChannelAvatar author={v.author} size={64} />
      </div>
    );
  }
  return (
    <div
      className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-accent"
      style={{ aspectRatio: aspect }}
    >
      <Youtube className="h-8 w-8 text-muted-foreground" />
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
  alwaysShowControls: boolean;
}) {
  const playable = v.category === "videos" || v.category === "shorts";
  const isChannelOrPost = v.category === "channel" || v.category === "posts";
  return (
    <div className={`gallery-card group flex flex-col rounded-2xl bg-card/80 p-2 backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white/70 hover:shadow-[0_16px_34px_rgba(2,6,23,0.1)] dark:hover:border-indigo-300/35 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_34px_rgba(99,102,241,0.2)] ${watchedBorder(v.watched)}`}>
      {/* Thumbnail */}
      <button
        onClick={playable ? onPlay : () => window.open(v.url, "_blank")}
        className="relative block w-full overflow-hidden rounded-xl bg-muted transition-all duration-200 hover:brightness-95"
        style={{ aspectRatio: isChannelOrPost ? "16 / 9" : "16 / 9" }}
      >
        <ThumbOrFallback v={v} />
        {playable && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black/70 text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              <Play className="h-4 w-4 fill-current translate-x-0.5" />
            </span>
          </span>
        )}
      </button>

      {/* Metadata row — no avatar, title only, status inline with channel */}
      <div className="mt-2 flex items-start gap-1.5 px-0.5">
        {/* Title + channel + status */}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">{v.title}</p>
          <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="truncate text-[11px] text-muted-foreground max-w-[120px]">{v.author}</span>
            {v.watched ? (
              <span className="shrink-0 rounded-full bg-emerald-500/15 px-1.5 py-px text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
                Watched
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-rose-500/15 px-1.5 py-px text-[9px] font-semibold text-rose-600 dark:text-rose-400 leading-tight">
                Unwatched
              </span>
            )}
          </div>
        </div>

        {/* 3-dot menu — always visible */}
        <div className="shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent transition-all"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem
                onClick={onToggleWatched}
                className="cursor-pointer text-xs gap-2"
              >
                <Checkbox
                  checked={v.watched}
                  className="h-3.5 w-3.5 border-2 border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black pointer-events-none"
                />
                {v.watched ? "Mark unwatched" : "Mark watched"}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer text-xs gap-2">
                <CopyButton url={v.url} asMenuItem />
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="cursor-pointer text-xs gap-2">
                <a href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                  <ExternalLink className="h-3.5 w-3.5" /> Open in YouTube
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onRemove}
                className="cursor-pointer text-xs gap-2 text-destructive focus:text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}

function ShortsCard({
  v,
  onPlay,
  onRemove,
  onToggleWatched,
  alwaysShowControls,
}: {
  v: Video;
  onPlay: () => void;
  onRemove: () => void;
  onToggleWatched: () => void;
  alwaysShowControls: boolean;
}) {
  return (
    <Card className={`gallery-card group overflow-hidden rounded-2xl bg-card/80 p-0 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white/70 hover:shadow-[0_16px_34px_rgba(2,6,23,0.12)] dark:hover:border-indigo-300/35 dark:hover:bg-white/10 dark:hover:shadow-[0_18px_38px_rgba(99,102,241,0.22)] ${watchedBorder(v.watched)}`}>
      <button
        onClick={onPlay}
        className="relative block w-full overflow-hidden"
        style={{ aspectRatio: "3 / 5" }}
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
        <div className={`absolute right-1.5 top-1.5 transition-all duration-300 ease-in-out ${alwaysShowControls ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
          <Checkbox
            checked={v.watched}
            onCheckedChange={onToggleWatched}
            onClick={(e) => e.stopPropagation()}
            className="h-4 w-4 border-2 border-black dark:border-white bg-black/30 backdrop-blur data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black"
          />
        </div>
      </button>
      <div className="p-2">
        <p className="line-clamp-2 h-8 text-xs font-medium leading-4">{v.title}</p>
        <div className={`transition-all duration-300 ease-in-out ${alwaysShowControls
            ? "opacity-100 max-h-[100px] mt-2"
            : "opacity-0 max-h-0 overflow-hidden group-hover:opacity-100 group-hover:max-h-[100px] group-hover:mt-2"
          }`}>
          <div className="border-t border-border/40" />
          <div className="mt-1.5 flex items-center justify-between gap-1 text-[11px] text-muted-foreground">
            <span className="truncate">{v.author}</span>
            <div className="flex items-center gap-0.5">
              <CopyButton url={v.url} className="rounded p-1 hover:bg-accent" />
              <button onClick={onRemove} className="rounded p-1 hover:bg-destructive/10 hover:text-destructive" aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
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
    <Card className={`flex items-center gap-3 rounded-xl bg-card/80 p-2.5 backdrop-blur-sm transition-all hover:-translate-y-[1px] hover:border-slate-300 hover:bg-white/70 hover:shadow-[0_14px_32px_rgba(2,6,23,0.1)] dark:hover:border-indigo-300/35 dark:hover:bg-white/10 dark:hover:shadow-[0_16px_34px_rgba(99,102,241,0.2)] ${watchedBorder(v.watched)}`}>
      <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} className="border-2 border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black" />
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
      className={`flex items-center gap-2.5 rounded-lg border border-black/25 dark:border-white/15 border-l-4 px-3 py-1.5 text-sm shadow-[0_8px_18px_rgba(2,6,23,0.08)] transition-all hover:border-slate-300 hover:bg-white/70 hover:shadow-[0_12px_24px_rgba(2,6,23,0.1)] dark:hover:border-indigo-300/35 dark:hover:bg-white/10 dark:hover:shadow-[0_14px_28px_rgba(99,102,241,0.18)] ${v.watched ? "border-l-emerald-500 dark:border-l-emerald-400/90" : "border-l-slate-500/60"
        } ${index % 2 === 0 ? "bg-card" : "bg-muted/40"}`}
    >
      <Checkbox checked={v.watched} onCheckedChange={onToggleWatched} className="border-2 border-black dark:border-white data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=checked]:text-white dark:data-[state=checked]:text-black" />
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
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-all ${active
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

function NowPlayingBars() {
  return (
    <span
      aria-hidden
      className="inline-flex h-3.5 items-end gap-[2px]"
      title="Playing"
    >
      <span className="block w-[2px] rounded-sm bg-primary tubedeck-bar tubedeck-bar-1" />
      <span className="block w-[2px] rounded-sm bg-primary tubedeck-bar tubedeck-bar-2" />
      <span className="block w-[2px] rounded-sm bg-primary tubedeck-bar tubedeck-bar-3" />
      <span className="block w-[2px] rounded-sm bg-primary tubedeck-bar tubedeck-bar-4" />
    </span>
  );
}
