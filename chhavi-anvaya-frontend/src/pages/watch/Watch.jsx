import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { AuthContext } from "../../context/AuthContext";
import Loader from "../../components/Loader/Loader";
import {
  commentOnVideo,
  getVideo,
  mediaUrl,
  rateVideo,
} from "../../services/videoService";
import styles from "./Watch.module.css";

function Watch() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [video, setVideo] = useState(null);
  const [comment, setComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    const response = await getVideo(id);
    setVideo(response.video);
  };

  useEffect(() => {
    setIsLoading(true);
    load()
      .catch(() => toast.error("Video could not be loaded."))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleRate = async (score) => {
    try {
      const response = await rateVideo(id, score);
      setVideo((prev) => ({
        ...prev,
        user_rating: score,
        average_rating: response.average_rating,
        rating_count: response.rating_count,
      }));
    } catch {
      toast.error("Could not save your rating.");
    }
  };

  const handleComment = async (event) => {
    event.preventDefault();
    if (!comment.trim()) return;
    try {
      await commentOnVideo(id, comment);
      setComment("");
      await load();
      toast.success("Comment posted");
    } catch {
      toast.error("Could not post comment.");
    }
  };

  if (isLoading || !video) return <Loader />;

  return (
    <div className={styles.watch}>
      <section className={styles.player}>
        <video src={mediaUrl(video.playback_url)} controls autoPlay playsInline />
        <div className={styles.details}>
          <div className={styles.titleRow}>
            <h1>{video.title}</h1>
            <span>{video.age_rating}</span>
          </div>
          <p>
            {video.creator?.name} · {video.genre} · {video.view_count} views
          </p>
          <dl>
            <div>
              <dt>Publisher</dt>
              <dd>{video.publisher}</dd>
            </div>
            <div>
              <dt>Producer</dt>
              <dd>{video.producer}</dd>
            </div>
          </dl>
          {video.description && <p className={styles.description}>{video.description}</p>}
        </div>
      </section>
      <aside className={styles.sidebar}>
        <div className={styles.rateBox}>
          <h3>Rate this clip</h3>
          <p>
            Average {video.average_rating || 0}★ from {video.rating_count || 0} ratings
          </p>
          <div className={styles.stars}>
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                className={score <= (video.user_rating || 0) ? styles.on : ""}
                onClick={() => handleRate(score)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
        <form onSubmit={handleComment} className={styles.commentForm}>
          <h3>Comments</h3>
          <textarea
            rows="3"
            placeholder={`Comment as ${user?.username}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button type="submit">Post</button>
        </form>
        <ul className={styles.comments}>
          {(video.comments || []).map((item) => (
            <li key={item.id}>
              <strong>{item.user?.username}</strong>
              <p>{item.comment}</p>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}

export default Watch;
