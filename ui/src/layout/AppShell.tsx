import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import "./app-shell.css";

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      {/* Mobile top bar */}
      <header className="mobile-header">
        <button
          className="mobile-brand"
          onClick={() => setSidebarOpen(true)}
        >
          Tagger
        </button>
      </header>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile drawer (OUTSIDE grid) */}
      <Sidebar
        mobile
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main layout grid */}
      <div className="app-shell">
        <Sidebar /> {/* desktop only */}
        <main className="app-content">
          <Outlet />
        </main>
        <RightPanel />
      </div>
    </>
  );
}
