import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Outlet, useLocation } from "react-router-dom";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const hideTopbarOnDashboard = location.pathname === "/dashboard";

  /* Close sidebar on route change */
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  /* Close sidebar when viewport becomes desktop-sized */
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      {/* ── Sidebar ── */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div
        className="
        flex-1 min-h-screen w-full
        ml-0 lg:ml-[250px]
        transition-all duration-300
        px-3 sm:px-5 pt-4 pb-8
      "
      >
        {/* Topbar (hidden on dashboard) */}
        {!hideTopbarOnDashboard && (
          <Topbar onMenuClick={() => setSidebarOpen(true)} />
        )}

        {/* Dashboard page: show hamburger button floating top-left on mobile/tablet */}
        {hideTopbarOnDashboard && (
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="
                w-10 h-10 rounded-xl
                bg-white dark:bg-slate-800
                border border-slate-200 dark:border-slate-700
                flex items-center justify-center
                text-slate-600 dark:text-slate-300
                shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700
                transition-all duration-200
              "
            >
              <i className="bi bi-list text-xl" />
            </button>
          </div>
        )}

        {/* Page content */}
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
