import Search from "./Search";
import JsonLd from "./JsonLd";
import { loadTrending, loadList, loadGenres, loadMovie, loadTv } from "../lib/tmdb.js";
import { HOME_TITLE, itemListJsonLd, socialMeta, SITE_DESC } from "../lib/seo.js";

export const revalidate = 3600;

export async function generateMetadata({ searchParams }) {
  const q = String((await searchParams)?.q || "").trim();
  const meta = socialMeta({
    title: { absolute: HOME_TITLE },
    description: SITE_DESC,
    path: "/",
  });
  if (q) return { ...meta, robots: { index: false, follow: true } };
  return meta;
}

export default async function Home({ searchParams }) {
  const q = String((await searchParams)?.q || "").trim();
  const [trending, popMovies, popTv, topMovies, topTv, genres] = await Promise.all([
    loadTrending(20).catch(() => []),
    loadList("movie", "popular", 20).catch(() => []),
    loadList("tv", "popular", 20).catch(() => []),
    loadList("movie", "top_rated", 20).catch(() => []),
    loadList("tv", "top_rated", 20).catch(() => []),
    loadGenres().catch(() => []),
  ]);
  let hero = null;
  const first = trending[0];
  if (first) {
    try {
      const detail = first.media_type === "movie" ? await loadMovie(first.id) : await loadTv(first.id);
      hero = { ...detail, media_type: first.media_type };
    } catch {
      hero = null;
    }
  }
  return (
    <>
      {trending.length ? <JsonLd data={itemListJsonLd(trending)} /> : null}
      <Search
        trending={trending}
        q={q}
        hero={hero}
        rows={[
          { title: "Trending Now", items: trending },
          { title: "Popular Movies", items: popMovies },
          { title: "Popular TV Shows", items: popTv },
          { title: "Top Rated Movies", items: topMovies },
          { title: "Top Rated TV Shows", items: topTv },
        ]}
        genres={genres}
      />
    </>
  );
}
