import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import Loader from "./Loader/Loader";

const CreatorRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== "creator") return <Navigate to="/homepage" replace />;
  return children;
};

export default CreatorRoute;
