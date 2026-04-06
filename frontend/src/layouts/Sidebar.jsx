import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";

/* ─── Scrollbar + hover styles ─── */
const SIDEBAR_STYLES = `
  .sb-scroll::-webkit-scrollbar       { width: 4px }
  .sb-scroll::-webkit-scrollbar-track { background: transparent }
  .sb-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius:10px }
  .sb-submenu-link:hover { transform: translateX(5px) }
  .sb-nav-link:hover .sb-nav-icon { transform: scale(1.15) }
`;

/* ── Nav link ── */
const NavLink = ({ to, icon, label, active }) => (
  <Link
    to={to}
    className={`
      flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium
      transition-all duration-200 no-underline mb-0.5 group sb-nav-link
      ${active ? "bg-white/15 text-white shadow-sm" : "text-slate-300 hover:text-white"}
    `}
    style={{ background: active ? undefined : undefined }}
  >
    <i
      className={`bi ${icon} text-[15px] sb-nav-icon transition-transform duration-200
        ${active ? "text-blue-300" : "text-slate-400 group-hover:text-blue-300"}`}
    />
    <span className={active ? "text-white font-semibold" : ""}>{label}</span>
    {active && (
      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
    )}
  </Link>
);

/* ── Section divider ── */
const Divider = ({ label }) => (
  <div className="flex items-center gap-2 px-1 mt-4 mb-1">
    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
      {label}
    </span>
    <div className="flex-1 h-px bg-white/5" />
  </div>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  const [openReports, setOpenReports] = useState(false);
  const [openProducts, setOpenProducts] = useState(false);

  /* Close drawer on route change (mobile/tablet) */
  useEffect(() => {
    if (onClose) onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem("auth_user");
    navigate("/", { replace: true });
    window.location.reload();
  };

  if (!user) return null;

  const can = (module, action) => {
    if (user.role === "Owner") return true;
    return !!user?.permissions?.[module]?.[action];
  };

  const isActive = (route) => path === route || path.startsWith(route + "/");

  return (
    <>
      <style>{SIDEBAR_STYLES}</style>

      {/* ── Backdrop overlay (mobile / tablet only) ── */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* ── Sidebar panel ── */}
      <aside
        className={`
          sb-scroll
          fixed top-0 left-0 h-screen w-[250px]
          flex flex-col overflow-y-auto z-50
          transition-transform duration-300 ease-in-out
          /* Mobile/Tablet: slide in/out */
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          /* Desktop: always visible */
          lg:translate-x-0
        `}
        style={{
          background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        {/* ── Brand header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5 flex items-center justify-between gap-3">
          <Link
            to={can("dashboard", "view") ? "/dashboard" : "#"}
            className="flex items-center gap-3 no-underline min-w-0"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <i className="bi bi-box-seam text-blue-400 text-lg" />
            </div>
            <div className="min-w-0">
              <div className="text-white font-bold text-[15px] tracking-wide leading-none truncate">
                Inventory
              </div>
              <div className="text-slate-500 text-[10px] mt-0.5 font-medium uppercase tracking-widest">
                Management
              </div>
            </div>
          </Link>

          {/* Close button — only on mobile/tablet */}
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="
              lg:hidden shrink-0
              w-8 h-8 rounded-lg bg-white/10
              flex items-center justify-center
              text-slate-400 hover:text-white hover:bg-white/20
              transition-all duration-200
            "
          >
            <i className="bi bi-x-lg text-[13px]" />
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {/* Dashboard */}
          {can("dashboard", "view") && (
            <>
              <Divider label="Main" />
              <NavLink
                to="/dashboard"
                icon="bi-speedometer2"
                label="Dashboard"
                active={isActive("/dashboard")}
              />
            </>
          )}

          {/* Parties */}
          {can("parties", "view") && (
            <NavLink
              to="/parties"
              icon="bi-people"
              label="Parties"
              active={isActive("/parties")}
            />
          )}

          {/* Products group */}
          {(can("products", "view") ||
            can("damaged_stock", "create") ||
            can("stock_adjustment", "create") ||
            can("categories", "view") ||
            can("units", "view")) && (
            <>
              <Divider label="Inventory" />

              {/* Dropdown toggle */}
              <button
                onClick={() => setOpenProducts((p) => !p)}
                className={`
                  w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl
                  text-[13.5px] font-medium transition-all duration-200
                  mb-0.5 border-none cursor-pointer
                  ${openProducts ? "text-white" : "text-slate-300 hover:text-white"}
                `}
                style={{
                  background: openProducts
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
              >
                <i className="bi bi-box text-[15px] text-slate-400" />
                <span className="flex-1 text-left">Products</span>
                <i
                  className={`bi ${openProducts ? "bi-chevron-up" : "bi-chevron-down"}
                    text-[11px] text-slate-500 transition-transform duration-200`}
                />
              </button>

              {/* Submenu */}
              {openProducts && (
                <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-1 mb-1">
                  {can("products", "view") && (
                    <Link
                      to="/products"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/products") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-list text-[13px]" /> Product List
                    </Link>
                  )}
                  {can("damaged_stock", "create") && (
                    <Link
                      to="/damaged-stock"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/damaged-stock") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-exclamation-triangle text-[13px]" />{" "}
                      Damaged Stock
                    </Link>
                  )}
                  {can("stock_adjustment", "create") && (
                    <Link
                      to="/stock-adjustment"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/stock-adjustment") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-arrow-repeat text-[13px]" /> Stock
                      Adjustment
                    </Link>
                  )}
                  {can("categories", "view") && (
                    <Link
                      to="/categories"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/categories") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-tags text-[13px]" /> Categories
                    </Link>
                  )}
                  {can("units", "view") && (
                    <Link
                      to="/units"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/units") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-calculator text-[13px]" /> Units
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Transactions */}
          <Divider label="Transactions" />
          {can("sales", "view") && (
            <NavLink
              to="/sales"
              icon="bi-receipt"
              label="Sales"
              active={isActive("/sales")}
            />
          )}
          {can("purchases", "view") && (
            <NavLink
              to="/purchases"
              icon="bi-cart"
              label="Purchases"
              active={isActive("/purchases")}
            />
          )}
          {can("payments", "view") && (
            <NavLink
              to="/payments"
              icon="bi-cash"
              label="Payments"
              active={isActive("/payments")}
            />
          )}
          {can("activity", "view") && (
            <NavLink
              to="/activity"
              icon="bi-clock-history"
              label="Activity"
              active={isActive("/activity")}
            />
          )}

          {/* Reports group */}
          {(can("current_stock", "view") ||
            can("low_stock", "view") ||
            can("sales_summary", "view") ||
            can("profit_loss", "view") ||
            can("customer_outstanding", "view")) && (
            <>
              <Divider label="Reports" />

              <button
                onClick={() => setOpenReports((p) => !p)}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-200 mb-0.5 border-none cursor-pointer text-slate-300 hover:text-white"
                style={{
                  background: openReports
                    ? "rgba(255,255,255,0.1)"
                    : "transparent",
                }}
              >
                <i className="bi bi-bar-chart text-[15px] text-slate-400" />
                <span className="flex-1 text-left">Reports</span>
                <i
                  className={`bi ${openReports ? "bi-chevron-up" : "bi-chevron-down"}
                    text-[11px] text-slate-500 transition-transform duration-200`}
                />
              </button>

              {openReports && (
                <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-1 mb-1">
                  {can("current_stock", "view") && (
                    <Link
                      to="/reports/current-stock"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/reports/current-stock") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-box-seam text-[13px]" /> Current Stock
                    </Link>
                  )}
                  {can("low_stock", "view") && (
                    <Link
                      to="/reports/low-stock"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/reports/low-stock") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-exclamation-circle text-[13px]" /> Low
                      Stock
                    </Link>
                  )}
                  {can("sales_summary", "view") && (
                    <Link
                      to="/reports/sales-summary"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/reports/sales-summary") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-graph-up text-[13px]" /> Sales Summary
                    </Link>
                  )}
                  {can("profit_loss", "view") && (
                    <Link
                      to="/reports/profit-loss"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/reports/profit-loss") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-currency-rupee text-[13px]" /> Profit
                      & Loss
                    </Link>
                  )}
                  {can("customer_outstanding", "view") && (
                    <Link
                      to="/reports/customer-outstanding"
                      className={`sb-submenu-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-200 no-underline
                        ${isActive("/reports/customer-outstanding") ? "text-blue-300 bg-blue-500/10 font-semibold" : "text-slate-400 hover:text-white"}`}
                    >
                      <i className="bi bi-people-fill text-[13px]" /> Customer
                      Outstanding
                    </Link>
                  )}
                </div>
              )}
            </>
          )}

          {/* Admin */}
          {(can("users", "view") ||
            can("create_user", "create") ||
            can("permission", "create")) && <Divider label="Admin" />}
          {can("users", "view") && (
            <NavLink
              to="/users"
              icon="bi-people-fill"
              label="Users"
              active={isActive("/users")}
            />
          )}
          {can("create_user", "create") && (
            <NavLink
              to="/create-user"
              icon="bi-person-plus"
              label="Create User"
              active={isActive("/create-user")}
            />
          )}
          {can("permission", "create") && (
            <NavLink
              to="/permissions"
              icon="bi-shield-lock-fill"
              label="Permissions"
              active={isActive("/permissions")}
            />
          )}
        </nav>

        {/* ── Footer / Logout ── */}
        <div className="px-3 pb-5 pt-2 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-3 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[12.5px] font-semibold truncate">
                {user?.username || "User"}
              </div>
              <div className="text-slate-500 text-[10.5px] truncate">
                {user?.role || ""}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="
              w-full flex items-center justify-center gap-2
              px-4 py-2.5 rounded-xl
              bg-red-500/10 border border-red-500/20 text-red-400
              text-[13px] font-semibold
              hover:bg-red-500 hover:text-white hover:border-red-500
              transition-all duration-200 cursor-pointer
            "
          >
            <i className="bi bi-box-arrow-right text-[14px]" /> Logout
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
