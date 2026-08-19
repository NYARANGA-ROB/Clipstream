import { Link } from "react-router-dom";
import { mediaUrl } from "../services/videoService";
import styles from "./VideoCard.module.css";

function VideoCard({ video }) {
  return (
    <Link to={`/watch/${video.id}`} className={styles.card}>
      <div className={styles.thumb}>
        {video.thumbnail_playback_url ? (
          <img src={mediaUrl(video.thumbnail_playback_url)} alt={video.title} />
        ) : (
          <video src={mediaUrl(video.playback_url)} muted preload="metadata" />
        )}
        <span className={styles.rating}>{video.age_rating}</span>
      </div>
      <div className={styles.meta}>
        <h3>{video.title}</h3>
        <p>
          {video.creator?.username} · {video.genre}
        </p>
        <small>
          {video.average_rating ? `${video.average_rating}★` : "No ratings"} ·{" "}
          {video.view_count || 0} views
        </small>
      </div>
    </Link>
  );
}

export default VideoCard;
