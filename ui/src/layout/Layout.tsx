import { Outlet } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import RightPanel from "./RightPanel";
import "./layout.css";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rightPanel, setRightPanel] = useState<React.ReactNode>(null);

  return (
    <>
      {/* Mobile header */}
      <header className="mobile-header">
        <button
          className="mobile-menu"
          onClick={() => setMobileOpen(true)}
        >
          ☰
        </button>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="layout">
        <Sidebar
          mobileOpen={mobileOpen}
          onNavigate={() => setMobileOpen(false)}
        />

        <main className="content">
          <Outlet context={{ setRightPanel }} />
        </main>

        {/* Desktop right-hand panel */}
        {rightPanel && <RightPanel>{rightPanel}</RightPanel>}
        
      </div>
    </>
  );
}
