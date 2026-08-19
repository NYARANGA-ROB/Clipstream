import { createContext, useState, useEffect } from "react";
import axiosInstance from "../services/axiosInstance";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("auth/verify_token")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const setAuthUser = (nextUser) => setUser(nextUser);

  const signOut = async () => {
    try {
      await axiosInstance.post("auth/signout");
    } catch {
      // cookie may already be gone
    }
    localStorage.removeItem("clipstream_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, setAuthUser, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
