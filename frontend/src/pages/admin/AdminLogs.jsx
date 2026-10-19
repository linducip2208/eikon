import React, { useCallback, useEffect, useRef, useState } from "react";
import { request } from "../../utils/request";
import { API_ENDPOINTS } from "../../utils/endpoints";
import { Loader2, RefreshCw, Search, Download, Pause, Play, ScrollText } from "lucide-react";
import toast from "react-hot-toast";

const LEVEL_FILTERS = [
  { value: "all", label: "Semua" },
  { value: "info", label: "Info" },
  { value: "warn", label: "Peringatan" },
  { value: "error", label: "Error" },
];

const LEVEL_TEXT_STYLES = {
  info: "text-stone-300",
  warn: "text-amber-300",
  error: "text-red-400",
};

const formatLogTime = (isoTime) => {
  const date = new Date(isoTime);
  return Number.isNaN(date.getTime())
    ? isoTime
    : date.toLocaleTimeString("id-ID", { hour12: false });
};

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [levelFilter, setLevelFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const consoleRef = useRef(null);
  const wasAtBottomRef = useRef(true);

  const fetchLogs = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const res = await request.get(API_ENDPOINTS.ADMIN.LOGS, { limit: 100 });
      if (res.success) setLogs(res.data || []);
    } catch {
      // Pesan error sudah ditampilkan oleh request helper
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Load pertama
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Auto-refresh tiap 5 detik
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(() => fetchLogs({ silent: true }), 5000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  // Debounce pencarian (300ms)
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim().toLowerCase()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filteredLogs = logs.filter((entry) => {
    if (levelFilter !== "all" && entry.level !== levelFilter) return false;
    if (search && !entry.message.toLowerCase().includes(search)) return false;
    return true;
  });

  // Auto-scroll ke bawah — tapi hanya bila pengguna memang sedang di bawah
  useEffect(() => {
    const el = consoleRef.current;
    if (!el || !wasAtBottomRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, [filteredLogs]);

  const handleConsoleScroll = () => {
    const el = consoleRef.current;
    if (!el) return;
    wasAtBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const handleDownload = () => {
    if (filteredLogs.length === 0) {
      toast.error("Tidak ada log untuk diunduh.");
      return;
    }
    const text = filteredLogs
      .map((entry) => `[${entry.time}] [${entry.level.toUpperCase()}] ${entry.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `elkon-log-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-serif font-light text-stone-900 tracking-wide">LOG SERVER</h2>
          <p className="text-xs text-stone-400">
            100 baris log terakhir dari backend — bisa dilihat tanpa akses terminal, termasuk saat dipasang di hosting.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRefresh((prev) => !prev)}
            className={`inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border transition-all ${
              autoRefresh
                ? "border-stone-900 bg-stone-900 text-white"
                : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
            }`}
          >
            {autoRefresh ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {autoRefresh ? "Auto: Aktif" : "Auto: Mati"}
          </button>
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border border-stone-200 bg-white text-stone-500 hover:border-stone-400 disabled:opacity-50 transition-all"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Muat Ulang
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider border border-stone-200 bg-white text-stone-500 hover:border-stone-400 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Unduh .txt
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-1.5">
          {LEVEL_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setLevelFilter(filter.value)}
              className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                levelFilter === filter.value
                  ? "border-stone-900 bg-stone-900 text-white"
                  : "border-stone-200 bg-white text-stone-500 hover:border-stone-400"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Cari teks log..."
            className="w-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-xs text-stone-800 focus:border-stone-900 focus:outline-none transition-all"
          />
        </div>
      </div>

      {/* Console panel */}
      {loading && logs.length === 0 ? (
        <div className="flex items-center justify-center py-20 border border-stone-150 bg-white">
          <Loader2 className="h-8 w-8 animate-spin text-stone-400" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border border-stone-150 bg-white">
          <ScrollText className="h-10 w-10 text-stone-200" />
          <p className="mt-2 text-xs text-stone-400">
            {logs.length === 0 ? "Buffer log masih kosong." : "Tidak ada log yang cocok dengan filter."}
          </p>
        </div>
      ) : (
        <div
          ref={consoleRef}
          onScroll={handleConsoleScroll}
          className="h-96 overflow-y-auto bg-stone-900 px-4 py-3 font-mono text-[11px] leading-relaxed"
        >
          {filteredLogs.map((entry, index) => (
            <div key={`${entry.time}-${index}`} className="flex gap-3 border-b border-stone-800/60 py-1">
              <span className="shrink-0 text-stone-500" title={entry.time}>
                {formatLogTime(entry.time)}
              </span>
              <span
                className={`w-12 shrink-0 font-semibold uppercase ${
                  LEVEL_TEXT_STYLES[entry.level] || LEVEL_TEXT_STYLES.info
                }`}
              >
                {entry.level}
              </span>
              <span className="whitespace-pre-wrap break-all text-stone-100">{entry.message}</span>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] text-stone-400">
        Menampilkan {filteredLogs.length} dari {logs.length} baris (buffer maks 100 baris, terbaru di bawah).
        Log juga tersimpan di file <span className="font-mono">backend/logs/server.log</span> di server.
      </p>
    </div>
  );
}
