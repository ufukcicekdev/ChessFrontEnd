"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import api from "@/lib/api";
import type { Game } from "@/types";

function resultLabel(g: Game): string {
  if (g.result === "draw") return "½–½";
  if (g.result === "white") return "1–0";
  if (g.result === "black") return "0–1";
  return g.result;
}

function HistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const usernameParam = searchParams.get("username") ?? "";

  const [search, setSearch] = useState(usernameParam);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrev, setHasPrev] = useState(false);
  const [total, setTotal] = useState(0);

  const load = useCallback((pg: number, username: string) => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(pg) });
    if (username.trim()) params.set("username", username.trim());
    api.get(`/api/chess/games/recent/?${params}`)
      .then(({ data }) => {
        const list: Game[] = data.results ?? data;
        setGames(list);
        setHasNext(!!data.next);
        setHasPrev(!!data.previous);
        setTotal(data.count ?? list.length);
      })
      .catch(() => setError("Could not load games."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    setPage(1);
    load(1, usernameParam);
    setSearch(usernameParam);
  }, [usernameParam]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load(page, usernameParam);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const applySearch = () => {
    const params = new URLSearchParams();
    if (search.trim()) params.set("username", search.trim());
    router.push(`/history${params.toString() ? "?" + params : ""}`);
  };

  const pageSize = 20;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-1">Game History</h1>
        <p className="text-sm text-gray-500">
          {usernameParam
            ? <>Games by <span className="text-amber-400 font-medium">{usernameParam}</span> · <button onClick={() => router.push("/history")} className="text-gray-500 hover:text-gray-300 underline">clear filter</button></>
            : "All finished games on the platform."}
          {total > 0 && <span className="ml-1 text-gray-600">· {total} total</span>}
        </p>
      </div>

      {/* Search / filter bar */}
      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && applySearch()}
          placeholder="Filter by username…"
          className="input flex-1 text-sm py-2"
        />
        <button onClick={applySearch} className="btn-secondary text-sm px-4">Search</button>
        {usernameParam && (
          <button onClick={() => { setSearch(""); router.push("/history"); }} className="btn-ghost text-sm px-3">✕</button>
        )}
      </div>

      {error && <div className="text-red-400 text-sm mb-4">{error}</div>}

      {loading ? (
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="card h-16 animate-pulse bg-white/[0.02]" />
          ))}
        </ul>
      ) : games.length === 0 ? (
        <div className="card text-center text-gray-400 py-10">
          {usernameParam ? `No games found for "${usernameParam}".` : "No games yet."}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {games.map((g) => {
            const w  = g.white_player?.username ?? "White";
            const b  = g.black_player?.username ?? "Black";
            const tc = typeof g.time_control === "number"
              ? `${g.time_control / 60}+${g.increment ?? 0}`
              : null;
            return (
              <li key={g.id} className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium flex items-center gap-2 flex-wrap">
                    <Link href={`/profile/${w}`} className="text-gray-200 hover:text-amber-400 transition-colors truncate">{w}</Link>
                    <span className="text-amber-400/80 font-mono text-xs shrink-0">{resultLabel(g)}</span>
                    <Link href={`/profile/${b}`} className="text-gray-200 hover:text-amber-400 transition-colors truncate">{b}</Link>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                    {g.ended_at && <span>{new Date(g.ended_at).toLocaleString()}</span>}
                    {tc && <span>{tc} min</span>}
                    <span>{(g as unknown as { move_count?: number }).move_count ?? g.moves?.length ?? 0} moves</span>
                  </div>
                </div>
                <Link href={`/games/${g.id}/review`} className="btn-secondary text-sm text-center shrink-0">
                  Replay
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(hasNext || hasPrev) && (
        <div className="flex items-center justify-between mt-6">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={!hasPrev || loading}
            className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500 font-mono">
            Page {page}{totalPages > 1 ? ` / ${totalPages}` : ""}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasNext || loading}
            className="btn-secondary text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-32 text-gray-500">Loading…</div>}>
      <HistoryContent />
    </Suspense>
  );
}
