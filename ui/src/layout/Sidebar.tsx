import { NavLink } from "react-router-dom";
import "./sidebar.css";

type Props = {
  mobileOpen: boolean;
  onNavigate: () => void;
};

export default function Sidebar({ mobileOpen, onNavigate }: Props) {
  return (
    <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="brand">Tagger</div>

      <nav className="nav">
        <NavLink
          to="/intake"
          onClick={onNavigate}
          className={({ isActive }) => `item ${isActive ? "active" : ""}`}
        >
          Bulk Intake
        </NavLink>
        <NavLink
          to="/review"
          onClick={onNavigate}
          className={({ isActive }) => `item ${isActive ? "active" : ""}`}
        >
          Review
        </NavLink>
        <NavLink
          to="/content"
          onClick={onNavigate}
          className={({ isActive }) => `item ${isActive ? "active" : ""}`}
        >
          Content
        </NavLink>

        <span className="item disabled">Search</span>
      </nav>
    </aside>
  );
}
