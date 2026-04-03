import { useEffect, useState } from "react";
import { getPermissions, updatePermissions } from "../../api/permissionService";
import { getRoles, applyRoleDefaults } from "../../api/roleService";
import axios from "../../api/axios";
import { useToast } from "../../context/ToastContext";

/* ══════════════════════════════════════════
   ROLE CONFIG
══════════════════════════════════════════ */
const ROLE_CONFIG = {
  Owner: {
    color: "#c0392b",
    icon: "bi-shield-fill-check",
    chipBg: "bg-red-50 dark:bg-red-900/20",
    chipBorder: "border-red-200 dark:border-red-700/60",
    badgeCls:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60",
    iconActiveCls: "bg-red-50 dark:bg-red-900/30",
  },
  Manager: {
    color: "#2563eb",
    icon: "bi-briefcase-fill",
    chipBg: "bg-blue-50 dark:bg-blue-900/20",
    chipBorder: "border-blue-200 dark:border-blue-700/60",
    badgeCls:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
    iconActiveCls: "bg-blue-50 dark:bg-blue-900/30",
  },
  Supervisor: {
    color: "#16a34a",
    icon: "bi-person-badge-fill",
    chipBg: "bg-emerald-50 dark:bg-emerald-900/20",
    chipBorder: "border-emerald-200 dark:border-emerald-700/60",
    badgeCls:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
    iconActiveCls: "bg-emerald-50 dark:bg-emerald-900/30",
  },
  Employee: {
    color: "#ca8a04",
    icon: "bi-person-fill",
    chipBg: "bg-amber-50 dark:bg-amber-900/20",
    chipBorder: "border-amber-200 dark:border-amber-700/60",
    badgeCls:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60",
    iconActiveCls: "bg-amber-50 dark:bg-amber-900/30",
  },
};

const MODULE_META = {
  dashboard: { icon: "bi-speedometer2", group: "General" },
  parties: { icon: "bi-people-fill", group: "Master" },
  products: { icon: "bi-box-seam-fill", group: "Master" },
  categories: { icon: "bi-tags-fill", group: "Master" },
  units: { icon: "bi-rulers", group: "Master" },
  sales: { icon: "bi-receipt", group: "Transactions" },
  purchases: { icon: "bi-cart-fill", group: "Transactions" },
  payments: { icon: "bi-credit-card-fill", group: "Transactions" },
  damaged_stock: { icon: "bi-exclamation-triangle-fill", group: "Stock" },
  stock_adjustment: { icon: "bi-sliders", group: "Stock" },
  current_stock: { icon: "bi-clipboard-data-fill", group: "Reports" },
  low_stock: { icon: "bi-bar-chart-fill", group: "Reports" },
  sales_summary: { icon: "bi-graph-up-arrow", group: "Reports" },
  profit_loss: { icon: "bi-currency-rupee", group: "Reports" },
  customer_outstanding: { icon: "bi-wallet2", group: "Reports" },
  activity: { icon: "bi-activity", group: "System" },
  users: { icon: "bi-person-gear", group: "System" },
  create_user: { icon: "bi-person-plus-fill", group: "System" },
};

/* Inline colour tokens for action rows (dynamic, cannot use Tailwind) */
const ACTION_COLORS = {
  view: {
    color: "#2563eb",
    dot: "#3b82f6",
    bg: "#eff6ff",
    borderAlpha: "#2563eb28",
  },
  create: {
    color: "#16a34a",
    dot: "#22c55e",
    bg: "#f0fdf4",
    borderAlpha: "#16a34a28",
  },
  update: {
    color: "#ca8a04",
    dot: "#eab308",
    bg: "#fefce8",
    borderAlpha: "#ca8a0428",
  },
  delete: {
    color: "#e11d48",
    dot: "#f43f5e",
    bg: "#fff1f2",
    borderAlpha: "#e11d4828",
  },
};

/* ── Dashboard 7 fields ── */
const DASHBOARD_FIELDS = [
  { key: "product_list", label: "Product List", icon: "bi-box-seam" },
  { key: "sale_summary", label: "Sale Summary", icon: "bi-receipt" },
  { key: "purchase_summary", label: "Purchase Summary", icon: "bi-cart-fill" },
  { key: "profit_loss", label: "Profit & Loss", icon: "bi-currency-rupee" },
  {
    key: "customer_outstanding",
    label: "Customer Outstanding",
    icon: "bi-wallet2",
  },
  { key: "current_stock", label: "Current Stock", icon: "bi-bar-chart-line" },
  { key: "parties", label: "Parties", icon: "bi-people-fill" },
];

const modules = [
  { name: "dashboard", actions: ["view"] },
  { name: "parties", actions: ["view", "create", "update", "delete"] },
  { name: "products", actions: ["view", "create", "update", "delete"] },
  { name: "damaged_stock", actions: ["create"] },
  { name: "stock_adjustment", actions: ["create"] },
  { name: "categories", actions: ["view", "create", "update", "delete"] },
  { name: "units", actions: ["view", "create", "update", "delete"] },
  { name: "sales", actions: ["view", "create", "delete"] },
  { name: "purchases", actions: ["view", "create"] },
  { name: "payments", actions: ["view"] },
  { name: "activity", actions: ["view"] },
  { name: "current_stock", actions: ["view"] },
  { name: "low_stock", actions: ["view"] },
  { name: "sales_summary", actions: ["view"] },
  { name: "profit_loss", actions: ["view"] },
  { name: "customer_outstanding", actions: ["view"] },
  { name: "users", actions: ["view", "delete"] },
  { name: "create_user", actions: ["create"] },
];

const GROUPS = [
  "General",
  "Master",
  "Transactions",
  "Stock",
  "Reports",
  "System",
];

/* ── Skeleton loader card ── */
const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 animate-pulse overflow-hidden">
    <div className="p-4 space-y-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 shrink-0" />
        <div className="flex-1 h-4 rounded-lg bg-slate-200 dark:bg-slate-700" />
        <div className="w-14 h-6 rounded-lg bg-slate-100 dark:bg-slate-700/60" />
      </div>
      <div className="space-y-2.5 pt-1">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="w-20 h-3 rounded bg-slate-100 dark:bg-slate-700/60" />
            <div className="w-9 h-5 rounded-full bg-slate-100 dark:bg-slate-700/60" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ── Action label with correct inline colour ── */
const ActionLabel = ({ action, checked, acColor }) => (
  <span
    className="text-[12.5px] font-semibold capitalize"
    style={{ color: checked ? acColor : undefined }}
    {...(!checked
      ? {
          className:
            "text-[12.5px] font-semibold capitalize text-slate-500 dark:text-slate-400",
        }
      : {})}
  >
    {action}
  </span>
);

/* ══════════════════════════════════════════
   PERMISSION PAGE
══════════════════════════════════════════ */
export default function PermissionPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [selectedInfo, setSelectedInfo] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [roleDefaultPerms, setRoleDefaultPerms] = useState({}); // module → {view,create,update,delete}
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [applyingDefaults, setApplyingDefaults] = useState(false);
  const [activeGroup, setActiveGroup] = useState("All");

  const roleData = selectedInfo
    ? ROLE_CONFIG[selectedInfo.role] || ROLE_CONFIG.Manager
    : null;
  const accent = roleData?.color || "#3b82f6";

  // Fetch users + roles on mount
  useEffect(() => {
    axios
      .get("/users/")
      .then((res) => setUsers(res.data))
      .catch(() => showToast("Failed to load users", "error"));
    getRoles()
      .then((roles) => {
        // Build a quick lookup: roleName → { module: {view,create,update,delete, fields} }
        const map = {};
        roles.forEach((role) => {
          map[role.name] = {};
          (role.default_permissions || []).forEach((p) => {
            const entry = {
              view: p.can_view,
              create: p.can_create,
              update: p.can_update,
              delete: p.can_delete,
            };
            if (p.module === "dashboard") {
              entry.fields = p.dashboard_fields_list || [];
            }
            map[role.name][p.module] = entry;
          });
        });
        setRoleDefaultPerms(map);
      })
      .catch(() => {});
  }, []);

  const generateDefaultPermissions = () => {
    const d = {};
    modules.forEach((m) => {
      d[m.name] = {};
      m.actions.forEach((a) => {
        d[m.name][a] = false;
      });
      if (m.name === "dashboard") d[m.name].fields = [];
    });
    return d;
  };

  const loadPermissions = async (userId) => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getPermissions(userId);
      setPermissions({ ...generateDefaultPermissions(), ...res.permissions });
    } catch {
      showToast("Failed to load permissions", "error");
    }
    setLoading(false);
  };

  const handleUserChange = (e) => {
    const uid = e.target.value;
    setSelectedUser(uid);
    const info = users.find((u) => u.id == uid);
    setSelectedInfo(info || null);
    setPermissions({});
    if (uid) loadPermissions(uid);
  };

  const handleChange = (mod, action) =>
    setPermissions((prev) => ({
      ...prev,
      [mod]: { ...prev[mod], [action]: !prev[mod]?.[action] },
    }));

  const handleSelectAll = (mod, actions) => {
    const allOn = actions.every((a) => permissions[mod]?.[a]);
    setPermissions((prev) => ({
      ...prev,
      [mod]: actions.reduce((acc, a) => ({ ...acc, [a]: !allOn }), {}),
    }));
  };

  const handleDashboardFieldToggle = (fieldKey) => {
    setPermissions((prev) => {
      const current = prev.dashboard?.fields || [];
      const next = current.includes(fieldKey)
        ? current.filter((f) => f !== fieldKey)
        : [...current, fieldKey];
      return { ...prev, dashboard: { ...prev.dashboard, fields: next } };
    });
  };

  const handleGlobalToggle = (val) => {
    const next = {};
    modules.forEach((m) => {
      next[m.name] = m.actions.reduce((acc, a) => ({ ...acc, [a]: val }), {});
    });
    setPermissions(next);
  };

  const handleSave = async () => {
    if (!selectedUser) {
      showToast("Please select a user", "warning");
      return;
    }
    setSaving(true);
    try {
      await updatePermissions(selectedUser, { permissions });
      showToast("Permissions saved successfully", "success");
      setTimeout(() => window.location.reload(), 800);
    } catch {
      showToast("Save failed", "error");
    }
    setSaving(false);
  };

  const handleApplyDefaults = async () => {
    if (!selectedUser || !selectedInfo) return;
    setApplyingDefaults(true);
    try {
      await applyRoleDefaults(selectedUser);
      showToast(
        `Permissions reset to ${selectedInfo.role} defaults`,
        "success",
      );

      // ✅ Directly set state from roleDefaultPerms (avoids stale fetch issues)
      // Start with everything OFF
      const freshPerms = generateDefaultPermissions();
      // Apply only the role defaults (everything else stays OFF)
      const roleDefaults = roleDefaultPerms[selectedInfo.role] || {};
      Object.keys(roleDefaults).forEach((module) => {
        if (freshPerms[module] !== undefined) {
          freshPerms[module] = {
            ...freshPerms[module],
            ...roleDefaults[module],
          };
        } else {
          freshPerms[module] = { ...roleDefaults[module] };
        }
      });
      setPermissions(freshPerms);
    } catch (err) {
      showToast(err?.error || "Failed to reset permissions", "error");
    }
    setApplyingDefaults(false);
  };

  const totalGranted = Object.values(permissions).reduce(
    (sum, mod) =>
      sum +
      Object.entries(mod).filter(([k, v]) => k !== "fields" && v === true)
        .length,
    0,
  );
  const totalPossible = modules.reduce((sum, m) => sum + m.actions.length, 0);
  const pct = totalPossible
    ? Math.round((totalGranted / totalPossible) * 100)
    : 0;

  const filteredModules =
    activeGroup === "All"
      ? modules
      : modules.filter((m) => MODULE_META[m.name]?.group === activeGroup);

  return (
    <div className="space-y-5">
      {/* ════ PAGE HEADER ════ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h4 className="text-[20px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0 flex items-center gap-2.5">
            <i className="bi bi-shield-lock-fill" style={{ color: accent }} />
            Permission Management
          </h4>
          <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0 font-medium">
            Control module-level access for each team member
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleGlobalToggle(true)}
            disabled={!selectedUser}
            className="h-9 px-4 rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12.5px] font-bold flex items-center gap-2 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400 dark:hover:border-emerald-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="bi bi-check2-all" /> Grant All
          </button>
          <button
            onClick={() => handleGlobalToggle(false)}
            disabled={!selectedUser}
            className="h-9 px-4 rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[12.5px] font-bold flex items-center gap-2 hover:border-red-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <i className="bi bi-x-circle" /> Revoke All
          </button>
          {selectedUser && selectedInfo && selectedInfo.role !== "Owner" && (
            <button
              onClick={handleApplyDefaults}
              disabled={applyingDefaults}
              className="h-9 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[12.5px] font-bold flex items-center gap-2 shadow-sm transition-all duration-200 hover:-translate-y-px hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {applyingDefaults ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <i className="bi bi-arrow-counterclockwise" />
              )}
              Reset to Default
            </button>
          )}
        </div>
      </div>

      {/* ════ USER SELECTOR CARD ════ */}
      <div className="relative rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] overflow-hidden transition-colors duration-300">
        <div
          className="h-1 w-full transition-all duration-400"
          style={{ background: accent }}
        />

        <div className="px-7 py-6">
          <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2.5">
            Select User
          </label>
          <div className="relative w-full max-w-[420px]">
            <i className="bi bi-person-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[15px] pointer-events-none z-10" />
            <select
              value={selectedUser}
              onChange={handleUserChange}
              className="w-full h-[46px] rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 pl-10 pr-9 text-sm font-medium appearance-none outline-none cursor-pointer focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200"
            >
              <option value="">Choose a team member…</option>
              {users
                .filter((u) => u.role !== "Owner")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.first_name || u.username} · {u.role}
                  </option>
                ))}
            </select>
            <i className="bi bi-chevron-down absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[12px] pointer-events-none" />
          </div>

          {selectedInfo &&
            (() => {
              const rs = ROLE_CONFIG[selectedInfo.role] || ROLE_CONFIG.Manager;
              return (
                <div
                  className={`inline-flex items-center gap-3 mt-4 px-4 py-3 rounded-[14px] border-[1.5px] ${rs.chipBg} ${rs.chipBorder} transition-all duration-300`}
                >
                  <img
                    className="w-9 h-9 rounded-full object-cover border-2 border-white dark:border-slate-600 shadow-sm shrink-0"
                    src={
                      selectedInfo.profile_image ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedInfo.first_name || selectedInfo.username)}&background=${rs.color.replace("#", "")}&color=fff&bold=true`
                    }
                    alt=""
                  />
                  <div>
                    <p className="text-[13.5px] font-extrabold text-slate-900 dark:text-slate-100 m-0 leading-tight">
                      {selectedInfo.first_name || selectedInfo.username}
                    </p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                      @{selectedInfo.username}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border ${rs.badgeCls}`}
                  >
                    <i className={`bi ${rs.icon} text-[10px]`} />
                    {selectedInfo.role}
                  </span>
                </div>
              );
            })()}
        </div>
      </div>

      {/* ════ STAT BAR ════ */}
      {selectedUser && !loading && (
        <div className="flex items-center gap-4 flex-wrap px-6 py-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-sm dark:shadow-[0_2px_10px_rgba(0,0,0,0.25)] transition-colors duration-300">
          <div className="flex items-center gap-2 shrink-0">
            <i
              className="bi bi-shield-check text-[18px]"
              style={{ color: accent }}
            />
            <span className="text-[14px] font-extrabold text-slate-800 dark:text-slate-100">
              {totalGranted}
            </span>
            <span className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
              / {totalPossible} permissions granted
            </span>
          </div>
          <div className="flex-1 min-w-[140px] h-[6px] rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: `${pct}%`, background: accent }}
            />
          </div>
          <span
            className="text-[13px] font-extrabold shrink-0 tabular-nums"
            style={{ color: accent }}
          >
            {pct}%
          </span>
        </div>
      )}

      {/* ════ GROUP FILTER TABS ════ */}
      {selectedUser && !loading && (
        <div className="flex items-center gap-2 flex-wrap">
          {["All", ...GROUPS].map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={[
                "h-8 px-4 rounded-full border-[1.5px] text-[12px] font-bold transition-all duration-200",
                activeGroup === g
                  ? "text-white border-transparent shadow-sm"
                  : "border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/60",
              ].join(" ")}
              style={activeGroup === g ? { background: accent } : {}}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      {/* ════ EMPTY STATE ════ */}
      {!selectedUser && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 transition-colors duration-300">
          <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
            <i className="bi bi-person-lock text-4xl text-slate-300 dark:text-slate-600" />
          </div>
          <div className="text-center">
            <p className="text-[15px] font-bold text-slate-600 dark:text-slate-400 m-0">
              Select a team member
            </p>
            <p className="text-[13px] text-slate-400 dark:text-slate-500 mt-1.5 m-0">
              Choose a user above to manage their module permissions
            </p>
          </div>
        </div>
      )}

      {/* ════ LOADING SKELETONS ════ */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(9)].map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* ════ MODULE GRID ════ */}
      {!loading && selectedUser && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredModules.map((module) => {
            const meta = MODULE_META[module.name] || {
              icon: "bi-grid",
              group: "Other",
            };
            const allOn = module.actions.every(
              (a) => permissions[module.name]?.[a],
            );
            const anyOn = module.actions.some(
              (a) => permissions[module.name]?.[a],
            );
            const roleColor = roleData?.color || "#3b82f6";
            const iconActiveCls =
              roleData?.iconActiveCls || "bg-blue-50 dark:bg-blue-900/30";

            // Check if this module has role defaults
            const userRole = selectedInfo?.role;
            const defaultsForModule =
              userRole && roleDefaultPerms[userRole]?.[module.name];
            const hasDefaultPerms =
              !!defaultsForModule &&
              ["view", "create", "update", "delete"].some(
                (k) => defaultsForModule[k] === true,
              );

            return (
              <div
                key={module.name}
                className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.25)] overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] dark:hover:shadow-[0_6px_24px_rgba(0,0,0,0.35)] hover:border-slate-300 dark:hover:border-slate-500 flex flex-col"
              >
                {/* Module Header */}
                <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-slate-50 dark:border-slate-700/60">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-[16px] shrink-0 transition-all duration-200 ${anyOn ? iconActiveCls : "bg-slate-100 dark:bg-slate-700"}`}
                  >
                    <i
                      className={`bi ${meta.icon} ${anyOn ? "" : "text-slate-400 dark:text-slate-500"}`}
                      style={anyOn ? { color: roleColor } : {}}
                    />
                  </div>
                  <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100 capitalize flex-1 leading-tight">
                    {module.name.replace(/_/g, " ")}
                  </span>
                  {hasDefaultPerms && (
                    <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700/50 shrink-0">
                      <i className="bi bi-shield-fill-check text-[8px]" />
                      Default
                    </span>
                  )}
                  <button
                    onClick={() => handleSelectAll(module.name, module.actions)}
                    className={[
                      "h-7 px-3 rounded-lg text-[11px] font-bold border transition-all duration-200",
                      allOn
                        ? "text-white border-transparent shadow-sm"
                        : "bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600",
                    ].join(" ")}
                    style={
                      allOn
                        ? { background: roleColor, borderColor: roleColor }
                        : {}
                    }
                  >
                    {allOn ? "All On" : anyOn ? "Partial" : "All Off"}
                  </button>
                </div>

                {/* Action Rows */}
                <div className="p-3.5 flex flex-col gap-2 flex-1">
                  {module.actions.map((action) => {
                    const ac = ACTION_COLORS[action] || ACTION_COLORS.view;
                    const checked = permissions[module.name]?.[action] || false;
                    const isDefault = !!(
                      defaultsForModule && defaultsForModule[action]
                    );

                    return (
                      <div
                        key={action}
                        onClick={() => handleChange(module.name, action)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer border-[1.5px] transition-all duration-150 select-none hover:bg-slate-50 dark:hover:bg-slate-700/40"
                        style={{
                          borderColor: checked ? ac.borderAlpha : "transparent",
                          background: checked ? ac.bg : "transparent",
                        }}
                      >
                        {/* Left: dot + label */}
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-2 h-2 rounded-full shrink-0 transition-all duration-200"
                            style={{ background: checked ? ac.dot : "#cbd5e1" }}
                          />
                          <span
                            className={`text-[12.5px] font-semibold capitalize ${checked ? "" : "text-slate-500 dark:text-slate-400"}`}
                            style={checked ? { color: ac.color } : {}}
                          >
                            {action}
                          </span>
                          {isDefault && (
                            <span className="text-[9px] font-bold text-violet-500 dark:text-violet-400 leading-none">
                              •default
                            </span>
                          )}
                        </div>

                        {/* Toggle switch */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChange(module.name, action);
                          }}
                          className={`relative w-9 h-5 rounded-full border-none shrink-0 transition-colors duration-200 ${checked ? "" : "bg-slate-200 dark:bg-slate-600"}`}
                          style={checked ? { background: ac.dot } : {}}
                        >
                          <span
                            className={`absolute top-[3px] w-[14px] h-[14px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-all duration-200 ${checked ? "left-[19px]" : "left-[3px]"}`}
                          />
                        </button>
                      </div>
                    );
                  })}

                  {/* ── Dashboard fields selector (shown when view is ON) ── */}
                  {module.name === "dashboard" &&
                    permissions.dashboard?.view && (
                      <div className="mt-1 rounded-xl border border-blue-100 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-900/10 p-3">
                        <p className="text-[10.5px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                          <i className="bi bi-layout-text-window-reverse" />
                          Visible Dashboard Sections
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {DASHBOARD_FIELDS.map((field) => {
                            const active = (
                              permissions.dashboard?.fields || []
                            ).includes(field.key);
                            const defActive = (
                              defaultsForModule?.fields || []
                            ).includes(field.key);
                            return (
                              <div
                                key={field.key}
                                onClick={() =>
                                  handleDashboardFieldToggle(field.key)
                                }
                                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer select-none transition-all duration-150 hover:bg-blue-100/60 dark:hover:bg-blue-800/20"
                                style={{
                                  background: active
                                    ? "rgba(37,99,235,0.07)"
                                    : "transparent",
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <i
                                    className={`bi ${field.icon} text-[11px]`}
                                    style={{
                                      color: active ? "#2563eb" : "#94a3b8",
                                    }}
                                  />
                                  <span
                                    className="text-[12px] font-semibold"
                                    style={{
                                      color: active ? "#2563eb" : "#64748b",
                                    }}
                                  >
                                    {field.label}
                                  </span>
                                  {defActive && (
                                    <span className="text-[9px] font-bold text-violet-500 dark:text-violet-400 leading-none">
                                      •default
                                    </span>
                                  )}
                                </div>
                                <div
                                  className={`w-4 h-4 rounded flex items-center justify-center border-[1.5px] transition-all duration-150 ${active ? "border-blue-500 bg-blue-500" : "border-slate-300 dark:border-slate-600"}`}
                                >
                                  {active && (
                                    <i className="bi bi-check text-white text-[9px]" />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 flex items-center gap-1">
                          <i className="bi bi-info-circle" />
                          {(permissions.dashboard?.fields || []).length} of 7
                          sections enabled
                        </p>
                      </div>
                    )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ════ STICKY SAVE BAR ════ */}
      {selectedUser && !loading && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700/70 px-1 py-4 mt-2 transition-colors duration-300">
          <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 m-0">
            <i className="bi bi-info-circle text-slate-400 dark:text-slate-500" />
            Changes take effect on next login for the user.
          </p>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-[46px] px-8 rounded-[14px] text-white text-[15px] font-bold flex items-center gap-2.5 shadow-lg transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
            }}
          >
            {saving ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <i className="bi bi-shield-check" />
                Save Permissions
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
