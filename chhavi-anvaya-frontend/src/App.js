import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./context/AuthContext";
import SignUp from "./pages/signup/SignUp";
import SignIn from "./pages/signin/SignIn";
import Navigation from "./pages/navigation/Navigation";
import Homepage from "./pages/home/Home";
import Explore from "./pages/explore/Explore";
import Watch from "./pages/watch/Watch";
import Studio from "./pages/studio/Studio";
import ProtectedRoute from "./components/ProtectedRoute";
import CreatorRoute from "./components/CreatorRoute";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Main />
      </BrowserRouter>
    </AuthProvider>
  );
}

function Main() {
  const location = useLocation();
  const isAuthPage = location.pathname === "/signUp" || location.pathname === "/";

  return (
    <div className={`app-container ${isAuthPage ? "auth-page" : ""}`}>
      {!isAuthPage && <Navigation />}
      <div className={`content ${isAuthPage ? "full-width" : ""}`}>
        <Routes>
          <Route index element={<SignIn />} />
          <Route path="signUp" element={<SignUp />} />
          <Route
            path="homepage"
            element={
              <ProtectedRoute>
                <Homepage />
              </ProtectedRoute>
            }
          />
          <Route
            path="explore"
            element={
              <ProtectedRoute>
                <Explore />
              </ProtectedRoute>
            }
          />
          <Route
            path="watch/:id"
            element={
              <ProtectedRoute>
                <Watch />
              </ProtectedRoute>
            }
          />
          <Route
            path="studio"
            element={
              <CreatorRoute>
                <Studio />
              </CreatorRoute>
            }
          />
          <Route path="*" element={<Navigate to="/homepage" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
