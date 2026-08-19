import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api/";

const signUp = async (userData) => {
  const response = await axios.post(`${API_URL}auth/signup`, userData);
  return response.data;
};

const signIn = async (userData) => {
  const response = await axios.post(`${API_URL}auth/signin`, userData, {
    withCredentials: true,
  });
  if (response.data?.token) {
    localStorage.setItem("clipstream_token", response.data.token);
  }
  return response.data;
};

export { signUp, signIn };
