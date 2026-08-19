import axiosInstance from "./axiosInstance";

const ORIGIN = (process.env.REACT_APP_API_URL_IMAGES || "http://localhost:8000/").replace(
  /\/$/,
  ""
);

export const mediaUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
};

export const getCatalog = async () => {
  const { data } = await axiosInstance.get("videos/catalog");
  return data;
};

export const listVideos = async (params = {}) => {
  const { data } = await axiosInstance.get("videos", { params });
  return data;
};

export const getVideo = async (id) => {
  const { data } = await axiosInstance.get(`videos/${id}`);
  return data;
};

export const getMyVideos = async () => {
  const { data } = await axiosInstance.get("videos/mine");
  return data;
};

export const uploadVideo = async (formData) => {
  const { data } = await axiosInstance.post("videos", formData, {
    timeout: 180000,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const commentOnVideo = async (id, comment) => {
  const { data } = await axiosInstance.post(`videos/${id}/comments`, { comment });
  return data;
};

export const rateVideo = async (id, score) => {
  const { data } = await axiosInstance.put(`videos/${id}/rating`, { score });
  return data;
};
