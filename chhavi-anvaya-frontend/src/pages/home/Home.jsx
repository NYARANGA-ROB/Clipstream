import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import VideoCard from "../../components/VideoCard";
import { listVideos } from "../../services/videoService";
import styles from "./Home.module.css";

function Home() {
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await listVideos({ limit: 24 });
        setVideos(response.videos || []);
      } catch (error) {
        toast.error("Could not load the latest videos.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  if (isLoading) return <Loader />;

  return (
    <div className={styles.home}>
      <header className={styles.hero}>
        <p>Latest drops</p>
        <h2>For You</h2>
      </header>
      {videos.length === 0 ? (
        <div className={styles.empty}>
          No videos yet. Creators can publish from Studio.
        </div>
      ) : (
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
