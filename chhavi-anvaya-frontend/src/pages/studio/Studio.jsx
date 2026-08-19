import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Loader from "../../components/Loader/Loader";
import VideoCard from "../../components/VideoCard";
import { getCatalog, getMyVideos, uploadVideo } from "../../services/videoService";
import styles from "./Studio.module.css";

function Studio() {
  const [catalog, setCatalog] = useState({ genres: [], age_ratings: [] });
  const [videos, setVideos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    publisher: "",
    producer: "",
    genre: "Music",
    age_rating: "PG",
    description: "",
    video: null,
    thumbnail: null,
  });

  const refresh = async () => {
    const response = await getMyVideos();
    setVideos(response.videos || []);
  };

  useEffect(() => {
    Promise.all([getCatalog(), refresh()])
      .then(([catalogData]) => setCatalog(catalogData))
      .catch(() => toast.error("Could not load studio."))
      .finally(() => setIsLoading(false));
  }, []);

  const update = (field) => (event) => {
    const value =
      field === "video" || field === "thumbnail"
        ? event.target.files[0]
        : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.video) {
      toast.error("Choose a video file.");
      return;
    }
    const payload = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      if (value) payload.append(key, value);
    });
    setSubmitting(true);
    try {
      await uploadVideo(payload);
      toast.success("Clip published");
      setForm((prev) => ({
        ...prev,
        title: "",
        description: "",
        video: null,
        thumbnail: null,
      }));
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Upload failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <Loader />;

  return (
    <div className={styles.studio}>
      <section className={styles.panel}>
        <h2>Creator studio</h2>
        <p>Only creator accounts can publish. Consumers never see this screen.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Title
            <input value={form.title} onChange={update("title")} required />
          </label>
          <div className={styles.row}>
            <label>
              Publisher
              <input value={form.publisher} onChange={update("publisher")} required />
            </label>
            <label>
              Producer
              <input value={form.producer} onChange={update("producer")} required />
            </label>
          </div>
          <div className={styles.row}>
            <label>
              Genre
              <select value={form.genre} onChange={update("genre")}>
                {catalog.genres.map((genre) => (
                  <option key={genre} value={genre}>
                    {genre}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Age rating
              <select value={form.age_rating} onChange={update("age_rating")}>
                {catalog.age_ratings.map((rating) => (
                  <option key={rating} value={rating}>
                    {rating}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Description
            <textarea rows="3" value={form.description} onChange={update("description")} />
          </label>
          <label>
            Video file
            <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={update("video")} />
          </label>
          <label>
            Thumbnail (optional)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={update("thumbnail")} />
          </label>
          <button type="submit" disabled={submitting}>
            {submitting ? "Uploading..." : "Publish clip"}
          </button>
        </form>
      </section>
      <section>
        <h3>Your library</h3>
        <div className={styles.grid}>
          {videos.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  );
}

export default Studio;
