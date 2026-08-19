import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faMagnifyingGlass,
  faClapperboard,
  faRightFromBracket,
} from "@fortawesome/free-solid-svg-icons";
import { AuthContext } from "../../context/AuthContext";
import styles from "./Navigation.module.css";

function Navigation() {
  const { user, signOut } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <aside className={styles.sideNavBar}>
      <div className={styles.brand}>
        <span className={styles.mark} />
        <div>
          <h1>Clipstream</h1>
          <p>Watch. Rate. Create.</p>
        </div>
      </div>
      <nav>
        <NavLink to="/homepage" className={({ isActive }) => (isActive ? styles.active : "")}>
          <FontAwesomeIcon icon={faHouse} />
          For You
        </NavLink>
        <NavLink to="/explore" className={({ isActive }) => (isActive ? styles.active : "")}>
          <FontAwesomeIcon icon={faMagnifyingGlass} />
          Search
        </NavLink>
        {user?.role === "creator" && (
          <NavLink to="/studio" className={({ isActive }) => (isActive ? styles.active : "")}>
            <FontAwesomeIcon icon={faClapperboard} />
            Studio
          </NavLink>
        )}
      </nav>
      <div className={styles.account}>
        <div>
          <strong>{user?.username}</strong>
          <span>{user?.role === "creator" ? "Creator" : "Viewer"}</span>
        </div>
        <button type="button" onClick={handleSignOut} aria-label="Sign out">
          <FontAwesomeIcon icon={faRightFromBracket} />
        </button>
      </div>
    </aside>
  );
}

export default Navigation;
