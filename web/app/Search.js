"use client";

import { useEffect, useRef, useState } from "react";
import { isBlocked } from "../lib/blocked.js";
import { searchTitles, discoverByGenre } from "../lib/tmdb-client.js";
import QueueMark from "./QueueMark.js";

function ResultList({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="results">
      {items.map((r) => {
        const route = r.media_type === "movie" ? "m" : r.media_type === "anime" ? "a" : "s";
        const blocked = isBlocked(route, r.id);
        const kind = r.media_type === "anime" ? "anime" : r.media_type === "movie" ? "movie" : "tv";
        const inner = (
          <>
            {r.poster ? (
              <img src={r.poster} alt={`Free download ${r.name}${r.year ? ` (${r.year})` : ""}`} width={56} height={84} loading="lazy" />
            ) : null}
            <span className="result-info">
              <span className="name">
                {r.name} ({r.year || "?"})
              </span>
              <span className="meta">{kind}</span>
            </span>
          </>
        );
        return (
          <li key={`${r.media_type}-${r.id}`}>
            {blocked ? (
              <div className="result-card blocked">{inner}</div>
            ) : (
              <a href={`/${route}/${r.id}`} className="result-card">
                {inner}
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function Row({ title, items }) {
  const trackRef = useRef(null);
  if (!items?.length) return null;
  const scroll = (dir) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };
  return (
    <section className="nf-row" aria-label={title}>
      <div className="nf-row-head">
        <h2 className="nf-row-title">{title}</h2>
        <div className="nf-row-arrows">
          <button type="button" className="nf-arrow" aria-label={`Scroll ${title} left`} onClick={() => scroll(-1)}>‹</button>
          <button type="button" className="nf-arrow" aria-label={`Scroll ${title} right`} onClick={() => scroll(1)}>›</button>
        </div>
      </div>
      <div className="nf-row-track" ref={trackRef}>
        {items.map((r) => {
          const route = r.media_type === "movie" ? "m" : r.media_type === "anime" ? "a" : "s";
          const blocked = isBlocked(route, r.id);
          const card = (
            <>
              {r.poster ? (
                <img src={r.poster} alt={`${r.name}${r.year ? ` (${r.year})` : ""}`} loading="lazy" />
              ) : (
                <span className="nf-no-poster">{r.name}</span>
              )}
              <span className="nf-card-info">
                <span className="nf-card-name">{r.name}</span>
                <span className="nf-card-meta">
                  {r.year || ""}
                  {r.rating ? ` · ★ ${Number(r.rating).toFixed(1)}` : ""}
                </span>
              </span>
            </>
          );
          return blocked ? (
            <div key={`${r.media_type}-${r.id}`} className="result-card nf-card blocked">
              {card}
            </div>
          ) : (
            <a key={`${r.media_type}-${r.id}`} href={`/${route}/${r.id}`} className="result-card nf-card">
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default function Search({ trending = [], q = "", hero = null, rows = [], genres = [] }) {
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(!!q);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(!!q);
  const primed = useRef(false);
  const [genre, setGenre] = useState(null);
  const [genreItems, setGenreItems] = useState([]);
  const [genreBusy, setGenreBusy] = useState(false);
  const [genreKind, setGenreKind] = useState("movie");

  useEffect(() => {
    const t = query.trim();
    if (!t) {
      setResults([]);
      setSearched(false);
      setErr(null);
      setBusy(false);
      if (typeof location !== "undefined" && location.search) history.replaceState(null, "", "/");
      return;
    }
    let gone = false;
    const delay = !primed.current && t === String(q).trim() ? 0 : 200;
    primed.current = true;
    const id = setTimeout(() => {
      history.replaceState(null, "", `/?q=${encodeURIComponent(t)}`);
      setSearched(true);
      setBusy(true);
      setErr(null);
      searchTitles(t)
        .then((r) => {
          if (!gone) setResults(r);
        })
        .catch((ex) => {
          if (gone) return;
          setResults([]);
          setErr(String(ex.message || ex));
        })
        .finally(() => {
          if (!gone) setBusy(false);
        });
    }, delay);
    return () => {
      gone = true;
      clearTimeout(id);
    };
  }, [query]);

  function pickGenre(g, kind) {
    if (genre && genre.id === g.id && genreKind === kind) {
      setGenre(null);
      setGenreItems([]);
      return;
    }
    setGenre(g);
    setGenreKind(kind);
    setGenreBusy(true);
    setGenreItems([]);
    discoverByGenre(kind, g.id)
      .then(setGenreItems)
      .catch(() => setGenreItems([]))
      .finally(() => setGenreBusy(false));
  }

  const heroRoute = hero ? (hero.media_type === "movie" ? `/m/${hero.id}` : `/s/${hero.id}`) : "/";

  return (
    <div id="wrap" className="nf-wrap">
      <header id="header" className="nf-header">
        <h1>
          <a href="/">downloadeverything<span className="nf-accent">free</span></a>
        </h1>
        <nav className="nf-nav" aria-label="Site">
          <a href="/">Home</a>
          <a href="/suggest">Suggest</a>
          <a href="/guide" className="site-guide-link">
            Guide
          </a>
        </nav>
        <QueueMark />
      </header>

      <form className="search nf-search" role="search" action="/" method="get" onSubmit={(e) => e.preventDefault()}>
        <div className="nf-search-box">
          <span className="nf-search-icon" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.5" y2="16.5" /></svg>
          </span>
          <input
            type="text"
            name="q"
            placeholder="Search movies, TV, anime…"
            aria-label="Search movies, TV shows, and anime"
            autoComplete="off"
            autoFocus
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="nf-search-btn">Search</button>
        </div>
      </form>

      {searched ? (
        <>
          {err && <p className="status">{err}</p>}
          {!err && busy && <p className="status">searching...</p>}
          {!err && !busy && !results.length && <p className="status">no matches.</p>}
          {!err && !busy && <ResultList items={results} />}
        </>
      ) : (
        <>
          {hero ? (
            <section className="nf-hero" aria-label={`Featured: ${hero.name}`}>
              {hero.backdrop ? <img className="nf-hero-bg" src={hero.backdrop} alt="" aria-hidden="true" /> : null}
              <div className="nf-hero-shade" aria-hidden="true" />
              <div className="nf-hero-content">
                <p className="nf-hero-kicker">Trending now</p>
                <h2 className="nf-hero-title">{hero.name}</h2>
                {hero.tagline ? <p className="nf-hero-tagline">{hero.tagline}</p> : null}
                {hero.overview ? <p className="nf-hero-overview">{hero.overview}</p> : null}
                {(hero.year || hero.rating || hero.tags?.length) ? (
                  <div className="nf-hero-pills">
                    {hero.year ? <span className="nf-hero-pill">{hero.year}</span> : null}
                    {hero.rating ? <span className="nf-hero-pill">★ {Number(hero.rating).toFixed(1)}</span> : null}
                    {(hero.tags || []).slice(0, 4).map((t) => (
                      <span key={t} className="nf-hero-pill">{t}</span>
                    ))}
                  </div>
                ) : null}
                <a className="nf-hero-btn" href={heroRoute}>
                  Find Downloads
                </a>
              </div>
            </section>
          ) : null}

          {genres.length ? (
            <section className="nf-genres" aria-label="Browse by genre">
              <h2 className="nf-row-title">Browse by Genre</h2>
              <div className="nf-genre-kind">
                <button type="button" className={genreKind === "movie" ? "nf-chip on" : "nf-chip"} onClick={() => genre && pickGenre(genre, "movie")}>
                  Movies
                </button>
                <button type="button" className={genreKind === "tv" ? "nf-chip on" : "nf-chip"} onClick={() => genre && pickGenre(genre, "tv")}>
                  TV Shows
                </button>
              </div>
              <div className="nf-chips">
                {genres.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    className={genre && genre.id === g.id ? "nf-chip on" : "nf-chip"}
                    onClick={() => pickGenre(g, genreKind)}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
              {genre ? (
                <>
                  {genreBusy && <p className="status">loading {genre.name}…</p>}
                  {!genreBusy && !genreItems.length && <p className="status">no matches for {genre.name}.</p>}
                  {!genreBusy && <ResultList items={genreItems} />}
                </>
              ) : null}
            </section>
          ) : null}

          {rows.map((row) => (
            <Row key={row.title} title={row.title} items={row.items} />
          ))}
        </>
      )}
    </div>
  );
}
