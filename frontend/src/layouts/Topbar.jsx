import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import ProfileModal from "../pages/UserProfile/ProfileModel";
import axios from "../api/axios";
import { useNavigate } from "react-router-dom";

const TOPBAR_STYLES = `
  .tb-search-input:focus { outline: none; }
  .tb-profile:hover .tb-profile-avatar { transform: scale(1.05); }
  .tb-icon-btn { transition: all 0.2s; }
  .tb-icon-btn:hover { transform: translateY(-1px); }
  .tb-search-expand {
    transition: width 0.25s ease, opacity 0.25s ease;
  }
`;

const Topbar = ({ onMenuClick, productSearchQuery, setProductSearchQuery }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [date] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);
  const [requestCount, setRequestCount] = useState(0);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true",
  );
  /* Mobile search expand toggle */
  const [searchExpanded, setSearchExpanded] = useState(false);
  const hideTopbarOnDashboard = location.pathname === "/dashboard";
  const username = user?.username || "Guest";
  const role = user?.role || "";
  const profileImage = user?.profile_image || null;

  /* ── Dark mode ── */
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("darkMode", "true");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode]);

  /* ── Password request notifications (Owner only) ── */
  useEffect(() => {
    if (role !== "Owner") return;
    let previousCount = 0;

    const fetchRequests = async () => {
      try {
        const res = await axios.get("/password-requests/");
        const currentCount = res.data.filter(
          (r) => r.status === "Pending",
        ).length;
        if (currentCount > previousCount)
          setRequestCount(currentCount - previousCount);
        previousCount = currentCount;
      } catch (err) {
        console.log("Notification error", err);
      }
    };

    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [role]);

  const formattedDate = date.toLocaleDateString("en-IN", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  /* Show search input: either always (md+) or when expanded on mobile */
  const showSearch =
    productSearchQuery !== undefined && setProductSearchQuery !== undefined;

  return (
    <>
      <style>{TOPBAR_STYLES}</style>

      <div
        className="
          flex items-center justify-between gap-2
          px-3 sm:px-5 py-3 mb-4 sm:mb-6 rounded-[16px] sm:rounded-[18px]
          bg-white dark:bg-slate-800
          border border-slate-100 dark:border-slate-700/60
          shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)]
          transition-all duration-300
        "
      >
        {/* ══ LEFT ══ */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* ── Hamburger (mobile + tablet only) ── */}
          {!hideTopbarOnDashboard && (<button
            onClick={onMenuClick}
            aria-label="Open menu"
            className="
              lg:hidden tb-icon-btn
              w-9 h-9 rounded-full flex items-center justify-center shrink-0
              bg-slate-50 border border-slate-200 text-slate-600
              hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600
              transition-all duration-200
              dark:bg-slate-700 dark:border-slate-600 dark:text-slate-300
              dark:hover:bg-slate-600 dark:hover:text-blue-400
            "
          >
            <i className="bi bi-list text-[18px]" />
          </button>)}

          {/* ── Title + Date ── */}
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-[14px] sm:text-[16px] text-blue-600 dark:text-blue-400 leading-none truncate">
              Inventory Management
            </span>
            <span className="hidden sm:block text-[11.5px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
              {formattedDate}
            </span>
          </div>
        </div>

        {/* ══ RIGHT ══ */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* ── Search: mobile icon + expandable / sm+ always visible ── */}
          {showSearch && (
            <>
              {/* Mobile: icon toggles expand */}
              <div className="relative sm:hidden">
                {searchExpanded ? (
                  <div className="flex items-center gap-1">
                    <div className="relative">
                      <i className="bi bi-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]" />
                      <input
                        type="text"
                        autoFocus
                        className="
                          w-[160px] pl-8 pr-3 py-1.5 rounded-full text-[12px] font-medium
                          bg-slate-50 border border-slate-200 text-slate-700
                          placeholder:text-slate-400
                          focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20
                          dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100
                        "
                        placeholder="Search…"
                        value={productSearchQuery}
                        onChange={(e) => setProductSearchQuery(e.target.value)}
                        onBlur={() => {
                          if (!productSearchQuery) setSearchExpanded(false);
                        }}
                      />
                    </div>
                    <button
                      onClick={() => {
                        setSearchExpanded(false);
                        setProductSearchQuery("");
                      }}
                      className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600"
                    >
                      <i className="bi bi-x text-[15px]" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setSearchExpanded(true)}
                    className="
                      tb-icon-btn w-9 h-9 rounded-full flex items-center justify-center
                      bg-slate-50 border border-slate-200 text-slate-500
                      hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600
                      transition-all duration-200
                      dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400
                    "
                  >
                    <i className="bi bi-search text-[13px]" />
                  </button>
                )}
              </div>

              {/* sm+: always visible search bar */}
              <div className="hidden sm:block relative">
                <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[13px]" />
                <input
                  type="text"
                  className="
                    tb-search-input w-[180px] md:w-[220px] lg:w-[240px]
                    pl-9 pr-4 py-2 rounded-full text-[13px] font-medium
                    bg-slate-50 border border-slate-200 text-slate-700
                    placeholder:text-slate-400
                    focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20
                    transition-all duration-200
                    dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100
                    dark:placeholder:text-slate-500 dark:focus:bg-slate-700 dark:focus:border-blue-500
                  "
                  placeholder="Search products…"
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                />
              </div>
            </>
          )}

          {/* ── Notification Bell (Owner only) ── */}
          {role === "Owner" && (
            <button
              onClick={() => navigate("/password-requests")}
              className="
                tb-icon-btn relative w-9 h-9 rounded-full flex items-center justify-center
                bg-slate-50 border border-slate-200 text-slate-500
                hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600
                transition-all duration-200
                dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400
                dark:hover:bg-slate-600 dark:hover:text-blue-400
              "
              title="Password Requests"
            >
              <i className="bi bi-bell text-[14px]" />
              {requestCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none shadow-sm">
                  {requestCount > 9 ? "9+" : requestCount}
                </span>
              )}
            </button>
          )}

          {/* ── Dark Mode Toggle ── */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Light Mode" : "Dark Mode"}
            className="
              tb-icon-btn w-9 h-9 rounded-full flex items-center justify-center
              bg-slate-50 border border-slate-200
              hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600
              transition-all duration-200
              dark:bg-slate-700 dark:border-slate-600 dark:text-amber-400
              dark:hover:bg-slate-600 dark:hover:border-amber-400
              text-slate-500
            "
          >
            <i
              className={`bi ${darkMode ? "bi-sun-fill text-amber-400" : "bi-moon-fill"} text-[13px]`}
            />
          </button>

          {/* ── Divider ── */}
          <div className="w-px h-7 bg-slate-200 dark:bg-slate-700 mx-0.5" />

          {/* ── User Profile ── */}
          <button
            onClick={() => setShowProfile(true)}
            className="
              tb-profile flex items-center gap-1.5 sm:gap-2.5
              px-1.5 sm:px-2.5 py-1.5
              rounded-xl cursor-pointer
              hover:bg-slate-50 dark:hover:bg-slate-700/60
              border border-transparent hover:border-slate-200 dark:hover:border-slate-600
              transition-all duration-200
            "
          >
            {/* Avatar */}
            <div className="tb-profile-avatar shrink-0 transition-transform duration-200">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={username}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-400/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-[13px] ring-2 ring-blue-400/20">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Name + Role (hidden on very small screens) */}
            <div className="hidden sm:flex flex-col items-start leading-tight">
              <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-100 max-w-[80px] truncate">
                {username}
              </span>
              <span className="text-[10.5px] text-slate-400 dark:text-slate-500 font-medium">
                {role}
              </span>
            </div>

            <i className="hidden sm:block bi bi-chevron-down text-[10px] text-slate-400 dark:text-slate-500 ml-0.5" />
          </button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          refreshUser={() => window.location.reload()}
        />
      )}
    </>
  );
};

export default Topbar;
