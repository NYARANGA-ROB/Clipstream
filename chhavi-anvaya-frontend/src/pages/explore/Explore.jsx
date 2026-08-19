import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import VideoCard from "../../components/VideoCard";
import { getCatalog, listVideos } from "../../services/videoService";
import styles from "./Explore.module.css";

function Explore() {
  const [catalog, setCatalog] = useState({ genres: [], age_ratings: [] });
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ q: "", genre: "", age_rating: "" });

  useEffect(() => {
    getCatalog()
      .then(setCatalog)
      .catch(() => toast.error("Could not load catalog filters."));
  }, []);

  useEffect(() => {
    const handle = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await listVideos(filters);
        setVideos(response.videos || []);
      } catch {
        toast.error("Search failed.");
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [filters]);

  return (
    <div>
      <header className={styles.header}>
        <h2>Search clips</h2>
        <div className={styles.filters}>
          <input
            type="search"
            placeholder="Title, publisher, producer, genre"
            value={filters.q}
            onChange={(e) => setFilters((prev) => ({ ...prev, q: e.target.value }))}
          />
          <select
            value={filters.genre}
            onChange={(e) => setFilters((prev) => ({ ...prev, genre: e.target.value }))}
          >
            <option value="">All genres</option>
            {catalog.genres.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <select
            value={filters.age_rating}
            onChange={(e) => setFilters((prev) => ({ ...prev, age_rating: e.target.value }))}
          >
            <option value="">All ratings</option>
            {catalog.age_ratings.map((rating) => (
              <option key={rating} value={rating}>
                {rating}
              </option>
            ))}
          </select>
        </div>
      </header>
      {isLoading ? (
        <Loader />
      ) : (
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
          {videos.length === 0 && <p className={styles.empty}>No matching videos.</p>}
        </div>
      )}
    </div>
  );
}

export default Explore;
