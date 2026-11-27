import Search from "./Search";
import JsonLd from "./JsonLd";
import { loadTrending, loadList, loadGenres, loadMovie, loadTv, loadDiscover, loadTopAnime } from "../lib/tmdb.js";
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

const safe = (p) => p.catch(() => []);

export default async function Home({ searchParams }) {
  const q = String((await searchParams)?.q || "").trim();
  const [
    trending, popMovies, popTv, topMovies, topTv, genres,
    nowPlaying, upcoming, airingTv, popAnime, topAnime,
    action, comedy, horror, scifi, drama, thriller, animation, romance,
  ] = await Promise.all([
    safe(loadTrending(20)),
    safe(loadList("movie", "popular", 20)),
    safe(loadList("tv", "popular", 20)),
    safe(loadList("movie", "top_rated", 20)),
    safe(loadList("tv", "top_rated", 20)),
    safe(loadGenres()),
    safe(loadList("movie", "now_playing", 20)),
    safe(loadList("movie", "upcoming", 20)),
    safe(loadList("tv", "airing_today", 20)),
    safe(loadTopAnime(20, "bypopularity")),
    safe(loadTopAnime(20)),
    safe(loadDiscover("movie", { with_genres: 28 }, 20)),
    safe(loadDiscover("movie", { with_genres: 35 }, 20)),
    safe(loadDiscover("movie", { with_genres: 27 }, 20)),
    safe(loadDiscover("movie", { with_genres: 878 }, 20)),
    safe(loadDiscover("movie", { with_genres: 18 }, 20)),
    safe(loadDiscover("movie", { with_genres: 53 }, 20)),
    safe(loadDiscover("movie", { with_genres: 16 }, 20)),
    safe(loadDiscover("movie", { with_genres: 10749 }, 20)),
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
          { title: "Now Playing in Theaters", items: nowPlaying },
          { title: "Upcoming Movies", items: upcoming },
          { title: "Airing Today on TV", items: airingTv },
          { title: "Popular Anime", items: popAnime },
          { title: "Top Rated Anime", items: topAnime },
          { title: "Action", items: action },
          { title: "Comedy", items: comedy },
          { title: "Horror", items: horror },
          { title: "Sci-Fi & Fantasy", items: scifi },
          { title: "Drama", items: drama },
          { title: "Thriller", items: thriller },
          { title: "Animation", items: animation },
          { title: "Romance", items: romance },
        ]}
        genres={genres}
      />
    </>
  );
}
