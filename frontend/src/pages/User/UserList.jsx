import { useEffect, useState, useMemo } from "react";
import {
  getUsers,
  toggleUserStatus,
  deleteUser,
} from "../../api/usereditService";
import {
  getRoles,
  createRole,
  updateRolePermissions,
  deleteRole,
} from "../../api/roleService";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import { usePermission } from "../../hooks/usePermission";

/* ══════════════════════════════════════════ CONSTANTS ══════════════════════════════════════════ */
const ROLE_CONFIG = {
  Owner: {
    icon: "bi-shield-fill-check",
    gradient: "from-red-500 to-rose-600",
    badge:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60",
    bar: "bg-red-500",
    accent: "#c0392b",
  },
  Manager: {
    icon: "bi-briefcase-fill",
    gradient: "from-blue-500 to-blue-700",
    badge:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
    bar: "bg-blue-500",
    accent: "#2563eb",
  },
  Supervisor: {
    icon: "bi-person-badge-fill",
    gradient: "from-emerald-500 to-emerald-700",
    badge:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
    bar: "bg-emerald-500",
    accent: "#16a34a",
  },
  Employee: {
    icon: "bi-person-fill",
    gradient: "from-amber-500 to-amber-600",
    badge:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60",
    bar: "bg-amber-500",
    accent: "#ca8a04",
  },
};
const CUSTOM_CFG = {
  icon: "bi-person-gear",
  gradient: "from-violet-500 to-violet-700",
  badge:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-400 dark:border-violet-700/60",
  bar: "bg-violet-500",
  accent: "#7c3aed",
};
const getRoleCfg = (r) => ROLE_CONFIG[r] || CUSTOM_CFG;

const ALL_MODULES = [
  {
    name: "dashboard",
    label: "Dashboard",
    group: "General",
    actions: ["view"],
  },
  {
    name: "parties",
    label: "Parties",
    group: "Master",
    actions: ["view", "create", "update", "delete"],
  },
  {
    name: "products",
    label: "Products",
    group: "Master",
    actions: ["view", "create", "update", "delete"],
  },
  {
    name: "categories",
    label: "Categories",
    group: "Master",
    actions: ["view", "create", "update", "delete"],
  },
  {
    name: "units",
    label: "Units",
    group: "Master",
    actions: ["view", "create", "update", "delete"],
  },
  {
    name: "sales",
    label: "Sales",
    group: "Transactions",
    actions: ["view", "create", "delete"],
  },
  {
    name: "purchases",
    label: "Purchases",
    group: "Transactions",
    actions: ["view", "create"],
  },
  {
    name: "payments",
    label: "Payments",
    group: "Transactions",
    actions: ["view"],
  },
  {
    name: "damaged_stock",
    label: "Damaged Stock",
    group: "Stock",
    actions: ["create"],
  },
  {
    name: "stock_adjustment",
    label: "Stock Adjustment",
    group: "Stock",
    actions: ["create"],
  },
  {
    name: "current_stock",
    label: "Current Stock",
    group: "Reports",
    actions: ["view"],
  },
  {
    name: "low_stock",
    label: "Low Stock",
    group: "Reports",
    actions: ["view"],
  },
  {
    name: "sales_summary",
    label: "Sales Summary",
    group: "Reports",
    actions: ["view"],
  },
  {
    name: "profit_loss",
    label: "Profit & Loss",
    group: "Reports",
    actions: ["view"],
  },
  {
    name: "customer_outstanding",
    label: "Customer Outstanding",
    group: "Reports",
    actions: ["view"],
  },
  {
    name: "activity",
    label: "Activity Log",
    group: "System",
    actions: ["view"],
  },
  {
    name: "users",
    label: "Users",
    group: "System",
    actions: ["view", "delete"],
  },
  {
    name: "create_user",
    label: "Create User",
    group: "System",
    actions: ["create"],
  },
];
const ACTIONS = ["view", "create", "update", "delete"]; // used for column headers only

/* ── Dashboard 7 fields ── */
const DASHBOARD_FIELDS = [
  { key: "product_list",         label: "Product List",         icon: "bi-box-seam" },
  { key: "sale_summary",         label: "Sale Summary",         icon: "bi-receipt" },
  { key: "purchase_summary",     label: "Purchase Summary",     icon: "bi-cart-fill" },
  { key: "profit_loss",          label: "Profit & Loss",        icon: "bi-currency-rupee" },
  { key: "customer_outstanding", label: "Customer Outstanding", icon: "bi-wallet2" },
  { key: "current_stock",        label: "Current Stock",        icon: "bi-bar-chart-line" },
  { key: "parties",              label: "Parties",              icon: "bi-people-fill" },
];

/* ── Helpers ── */
const StatCard = ({ icon, label, value, gradient, textColor }) => (
  <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
    <div
      className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shrink-0 shadow-sm`}
    >
      <i className={`bi ${icon} text-white text-lg`} />
    </div>
    <div>
      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">
        {label}
      </p>
      <p className={`text-[26px] font-extrabold leading-none ${textColor}`}>
        {value}
      </p>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-100 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden animate-pulse h-[220px]">
    <div className="h-1 bg-slate-200 dark:bg-slate-700" />
    <div className="p-5 space-y-3">
      <div className="flex justify-between">
        <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-700" />
        <div className="w-16 h-5 rounded-full bg-slate-200 dark:bg-slate-700" />
      </div>
      <div className="w-32 h-4 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="w-24 h-3 rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
);

/* ══════════════════════════════════════════
   ROLE PERMISSION MODAL
══════════════════════════════════════════ */
function RoleModal({ role, onClose, onSave }) {
  const initPerms = () => {
    const map = {};
    ALL_MODULES.forEach((m) => {
      map[m.name] = {};
      m.actions.forEach((a) => {
        map[m.name][a] = false;
      });
      if (m.name === "dashboard") map[m.name].fields = [];
    });
    if (role && role.default_permissions) {
      role.default_permissions.forEach((p) => {
        const mod = ALL_MODULES.find((mm) => mm.name === p.module);
        if (mod) {
          mod.actions.forEach((a) => {
            if (a === "view") map[p.module][a] = p.can_view;
            if (a === "create") map[p.module][a] = p.can_create;
            if (a === "update") map[p.module][a] = p.can_update;
            if (a === "delete") map[p.module][a] = p.can_delete;
          });
          if (p.module === "dashboard") {
            map[p.module].fields = p.dashboard_fields_list || [];
          }
        }
      });
    }
    return map;
  };

  const [name, setName] = useState(role?.name || "");
  const [permissions, setPermissions] = useState(initPerms);
  const [saving, setSaving] = useState(false);
  const isNew = !role;

  const togglePerm = (module, action) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: { ...prev[module], [action]: !prev[module][action] },
    }));
  };

  const toggleRow = (moduleName, moduleActions) => {
    const allOn = moduleActions.every((a) => permissions[moduleName]?.[a]);
    const next = {};
    moduleActions.forEach((a) => {
      next[a] = !allOn;
    });
    setPermissions((prev) => ({ ...prev, [moduleName]: next }));
  };

  const toggleDashboardField = (fieldKey) => {
    setPermissions((prev) => {
      const current = prev.dashboard?.fields || [];
      const next = current.includes(fieldKey)
        ? current.filter((f) => f !== fieldKey)
        : [...current, fieldKey];
      return {
        ...prev,
        dashboard: { ...prev.dashboard, fields: next },
      };
    });
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ name: name.trim(), permissions });
    } finally {
      setSaving(false);
    }
  };

  const groups = [...new Set(ALL_MODULES.map((m) => m.group))];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center">
              <i className="bi bi-person-gear text-violet-600 dark:text-violet-400 text-lg" />
            </div>
            <div>
              <h5 className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100 m-0 leading-tight">
                {isNew ? "Create New Role" : `Edit: ${role.name}`}
              </h5>
              <p className="text-[12px] text-slate-500 dark:text-slate-400 m-0 mt-0.5">
                Set default permissions for this role
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <i className="bi bi-x-lg text-sm" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Role name */}
          {isNew && (
            <div>
              <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
                Role Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-[44px] rounded-xl border-[1.5px] px-3.5 text-sm font-medium bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                placeholder="e.g. Cashier, Warehouse..."
              />
            </div>
          )}

          {/* Info: changes apply to ALL existing users with this role */}
          {!isNew && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/60 rounded-xl px-4 py-3">
              <i className="bi bi-info-circle-fill text-blue-500 shrink-0" />
              <span className="text-[12.5px] text-blue-700 dark:text-blue-400 font-medium">
                Changes will be applied to <strong>all existing users</strong>{" "}
                with the <strong>{role.name}</strong> role immediately.
              </span>
            </div>
          )}

          {/* Permission grid per group */}
          {groups.map((group) => (
            <div key={group}>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                {group}
              </p>
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_repeat(4,44px)] bg-slate-50 dark:bg-slate-700/40 px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Module
                  </span>
                  {ACTIONS.map((a) => (
                    <span
                      key={a}
                      className="text-[10px] font-bold text-slate-400 uppercase text-center"
                    >
                      {a[0].toUpperCase()}
                    </span>
                  ))}
                </div>
                {ALL_MODULES.filter((m) => m.group === group).map(
                  (m, idx, arr) => {
                    const allOn = m.actions.every(
                      (a) => permissions[m.name]?.[a],
                    );
                    const isDashboardViewOn =
                      m.name === "dashboard" && permissions.dashboard?.view;
                    return (
                      <div key={m.name}>
                        <div
                          className={`grid grid-cols-[1fr_repeat(4,44px)] items-center px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors ${!isDashboardViewOn && idx < arr.length - 1 ? "border-b border-slate-50 dark:border-slate-700/50" : ""}`}
                        >
                          <button
                            onClick={() => toggleRow(m.name, m.actions)}
                            className="flex items-center gap-2 text-left"
                          >
                            <span
                              className={`text-[13px] font-semibold ${allOn ? "text-slate-800 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"}`}
                            >
                              {m.label}
                            </span>
                            {allOn && (
                              <i className="bi bi-check-all text-emerald-500 text-xs" />
                            )}
                          </button>
                          {ACTIONS.map((a) => {
                            const supported = m.actions.includes(a);
                            const checked =
                              supported && (permissions[m.name]?.[a] || false);
                            return (
                              <div
                                key={a}
                                className="flex items-center justify-center"
                              >
                                {supported ? (
                                  <button
                                    onClick={() => togglePerm(m.name, a)}
                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 ${checked ? "bg-violet-500 border-violet-500 shadow-sm" : "border-slate-300 dark:border-slate-600 hover:border-violet-300"}`}
                                  >
                                    {checked && (
                                      <i className="bi bi-check text-white text-[10px]" />
                                    )}
                                  </button>
                                ) : (
                                  <span className="text-slate-200 dark:text-slate-700 text-[12px] font-bold select-none">
                                    —
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* ── Dashboard fields (shown when view is ON) ── */}
                        {isDashboardViewOn && (
                          <div
                            className={`px-4 pb-3 pt-1 bg-blue-50/50 dark:bg-blue-900/10 border-b border-slate-50 dark:border-slate-700/50 ${idx < arr.length - 1 ? "border-b border-slate-50 dark:border-slate-700/50" : ""}`}
                          >
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-1.5 flex items-center gap-1.5">
                              <i className="bi bi-layout-text-window-reverse" />
                              Visible Dashboard Sections
                            </p>
                            <div className="grid grid-cols-2 gap-1">
                              {DASHBOARD_FIELDS.map((field) => {
                                const active = (
                                  permissions.dashboard?.fields || []
                                ).includes(field.key);
                                return (
                                  <button
                                    key={field.key}
                                    onClick={() =>
                                      toggleDashboardField(field.key)
                                    }
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-left transition-all duration-150 border ${active ? "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-blue-200"}`}
                                  >
                                    <i
                                      className={`bi ${field.icon} text-[10px] shrink-0`}
                                    />
                                    <span className="text-[11px] font-semibold truncate">
                                      {field.label}
                                    </span>
                                    {active && (
                                      <i className="bi bi-check-circle-fill text-blue-500 text-[9px] ml-auto shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1.5">
                              {(permissions.dashboard?.fields || []).length} of 7 sections enabled
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  },
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/80">
          <button
            onClick={onClose}
            className="h-10 px-5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[13px] font-bold hover:bg-slate-50 dark:hover:bg-slate-600 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || (!isNew ? false : !name.trim())}
            className="h-10 px-6 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <i className="bi bi-shield-check" />
                {isNew ? "Create Role" : "Save Changes"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function UserList() {
  const [activeTab, setActiveTab] = useState("users"); // "users" | "roles"
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteRoleId, setDeleteRoleId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [modalRole, setModalRole] = useState(undefined); // undefined=closed, null=new, object=edit
  const navigate = useNavigate();
  const { can } = usePermission();
  const showActionCol = can("users", "update") || can("users", "delete");
  const { showToast } = useToast();

  /* ── Fetches ── */
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      showToast("Failed to fetch users", "error");
    } finally {
      setLoading(false);
    }
  };
  const fetchRoles = async () => {
    setRolesLoading(true);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch {
      showToast("Failed to fetch roles", "error");
    } finally {
      setRolesLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  /* ── User actions ── */
  const handleToggle = async (id) => {
    try {
      await toggleUserStatus(id);
      showToast("User status updated", "success");
      fetchUsers();
    } catch {
      showToast("Failed to update status", "error");
    }
  };
  const confirmDelete = async () => {
    try {
      await deleteUser(deleteId);
      showToast("User deleted successfully", "success");
      fetchUsers();
    } catch {
      showToast("Delete failed", "error");
    }
    setDeleteId(null);
  };

  /* ── Role actions ── */
  const handleRoleSave = async ({ name, permissions }) => {
    try {
      if (modalRole === null) {
        // Create new role
        await createRole({ name, permissions });
        showToast(`Role "${name}" created`, "success");
      } else {
        // Update existing role AND push to all users with that role
        const res = await updateRolePermissions(modalRole.id, { permissions });
        const updatedUsers = res?.updated_users ?? 0;
        showToast(
          updatedUsers > 0
            ? `Role "${modalRole.name}" updated — applied to ${updatedUsers} user(s)`
            : `Role "${modalRole.name}" updated`,
          "success",
        );
      }
      setModalRole(undefined);
      fetchRoles();
    } catch (err) {
      showToast(err?.error || "Failed to save role", "error");
    }
  };
  const confirmDeleteRole = async () => {
    const role = roles.find((r) => r.id === deleteRoleId);
    try {
      await deleteRole(deleteRoleId);
      showToast(`Role "${role?.name}" deleted`, "success");
      fetchRoles();
    } catch (err) {
      showToast(err?.error || "Cannot delete role", "error");
    }
    setDeleteRoleId(null);
  };

  /* ── Filter ── */
  const filtered = useMemo(
    () =>
      users.filter(
        (u) =>
          u.username?.toLowerCase().includes(search.toLowerCase()) ||
          u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.role?.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search],
  );

  const totalActive = users.filter((u) => u.is_active).length;
  const totalInactive = users.filter((u) => !u.is_active).length;

  return (
    <>
      <div className="space-y-6">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-[20px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0 flex items-center gap-2">
              <i className="bi bi-people-fill text-blue-500" /> User Management
            </h4>
            <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0 font-medium">
              Manage team members, roles &amp; access
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1 w-fit">
          {[
            { key: "users", icon: "bi-people", label: "Users" },
            { key: "roles", icon: "bi-person-gear", label: "Roles" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={[
                "flex items-center gap-2 h-9 px-5 rounded-[10px] text-[13px] font-bold transition-all duration-200",
                activeTab === tab.key
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200",
              ].join(" ")}
            >
              <i className={`bi ${tab.icon} text-sm`} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══════════ USERS TAB ══════════ */}
        {activeTab === "users" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon="bi-people-fill"
                label="Total Users"
                value={users.length}
                gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                textColor="text-slate-800 dark:text-slate-100"
              />
              <StatCard
                icon="bi-person-check-fill"
                label="Active"
                value={totalActive}
                gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                textColor="text-emerald-600 dark:text-emerald-400"
              />
              <StatCard
                icon="bi-person-x-fill"
                label="Inactive"
                value={totalInactive}
                gradient="bg-gradient-to-br from-rose-500 to-rose-700"
                textColor="text-rose-600 dark:text-rose-400"
              />
            </div>

            <div className="max-w-sm">
              <div className="relative">
                <i className="bi bi-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm pointer-events-none" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 h-[42px]"
                  placeholder="Search by name, email, role…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
                  <i className="bi bi-people text-4xl opacity-40" />
                </div>
                <div className="text-center">
                  <p className="text-base font-bold text-slate-500 dark:text-slate-400 m-0">
                    No users found
                  </p>
                  <p className="text-sm mt-1 m-0 opacity-70">
                    Try adjusting your search filter
                  </p>
                </div>
              </div>
            )}

            {!loading && filtered.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((user) => {
                  const cfg = getRoleCfg(user.role);
                  return (
                    <div
                      key={user.id}
                      className="group relative rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.10)] dark:hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] hover:border-slate-300 dark:hover:border-slate-600 flex flex-col"
                    >
                      <div className={`h-1 w-full ${cfg.bar}`} />
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <img
                            className="w-[66px] h-[66px] rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-[0_2px_10px_rgba(0,0,0,0.12)]"
                            src={
                              user.profile_image ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(user.first_name || user.username)}&background=${cfg.accent.replace("#", "")}&color=fff&bold=true`
                            }
                            alt={user.first_name}
                          />
                          {user.is_active ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60 text-[11px] font-bold px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60 text-[11px] font-bold px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="mb-3">
                          <p className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100 mb-1 leading-tight">
                            {user.first_name || user.username}
                          </p>
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="text-slate-400 dark:text-slate-500 text-[12.5px] font-medium">
                              @{user.username}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${cfg.badge}`}
                            >
                              <i className={`bi ${cfg.icon} text-[10px]`} />
                              {user.role}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-auto">
                          {user.email && (
                            <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
                              <i className="bi bi-envelope-fill text-[11px] text-slate-400 shrink-0" />
                              <span className="truncate">{user.email}</span>
                            </div>
                          )}
                          {user.phone && (
                            <div className="flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
                              <i className="bi bi-telephone-fill text-[11px] text-slate-400 shrink-0" />
                              <span>{user.phone}</span>
                            </div>
                          )}
                        </div>
                        {showActionCol && (
                          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                            {can("users", "update") && (
                              <button
                                onClick={() =>
                                  navigate(`/users/edit/${user.id}`)
                                }
                                className="flex-1 h-9 rounded-xl bg-blue-50 hover:bg-blue-500 text-blue-600 hover:text-white border border-blue-200 hover:border-blue-500 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700/60 dark:hover:bg-blue-500 dark:hover:text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-px"
                              >
                                <i className="bi bi-pencil-fill text-[11px]" />
                                Edit
                              </button>
                            )}
                            {can("users", "update") && (
                              <button
                                onClick={() => handleToggle(user.id)}
                                className={`flex-1 h-9 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition-all duration-200 hover:-translate-y-px border ${user.is_active ? "bg-amber-50 hover:bg-amber-500 text-amber-600 hover:text-white border-amber-200 hover:border-amber-500 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700/60 dark:hover:bg-amber-500 dark:hover:text-white" : "bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border-emerald-200 hover:border-emerald-500 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/60 dark:hover:bg-emerald-500 dark:hover:text-white"}`}
                              >
                                <i
                                  className={`bi ${user.is_active ? "bi-pause-fill" : "bi-play-fill"} text-[11px]`}
                                />
                                {user.is_active ? "Pause" : "Resume"}
                              </button>
                            )}
                            {can("users", "delete") && (
                              <button
                                onClick={() => setDeleteId(user.id)}
                                className="w-9 h-9 shrink-0 rounded-xl bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 hover:border-red-500 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/60 dark:hover:bg-red-500 dark:hover:text-white flex items-center justify-center transition-all duration-200 hover:-translate-y-px"
                              >
                                <i className="bi bi-trash3-fill text-[12px]" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ══════════ ROLES TAB ══════════ */}
        {activeTab === "roles" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[14px] font-semibold text-slate-600 dark:text-slate-400 m-0">
                  {roles.length} role{roles.length !== 1 ? "s" : ""} configured
                  &mdash; default permissions auto-apply on user creation
                </p>
              </div>
              {can("users", "create") && (
                <button
                  onClick={() => setModalRole(null)}
                  className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[13px] font-bold flex items-center gap-2 transition-all duration-200 hover:-translate-y-px shadow-sm"
                >
                  <i className="bi bi-plus-lg" /> New Role
                </button>
              )}
            </div>

            {rolesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[200px] rounded-2xl bg-slate-100 dark:bg-slate-700/50 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => {
                  const cfg = getRoleCfg(role.name);
                  const permCount = role.default_permissions?.length || 0;
                  const grantedActions =
                    role.default_permissions?.reduce((acc, p) => {
                      if (p.can_view) acc++;
                      if (p.can_create) acc++;
                      if (p.can_update) acc++;
                      if (p.can_delete) acc++;
                      return acc;
                    }, 0) || 0;
                  return (
                    <div
                      key={role.id}
                      className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_2px_12px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_12px_rgba(0,0,0,0.3)] overflow-hidden transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.09)]"
                    >
                      <div className={`h-1 w-full ${cfg.bar}`} />
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow-sm`}
                            >
                              <i
                                className={`bi ${cfg.icon} text-white text-[17px]`}
                              />
                            </div>
                            <div>
                              <p className="text-[16px] font-extrabold text-slate-900 dark:text-slate-100 m-0 leading-tight">
                                {role.name}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                {role.is_system ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                    <i className="bi bi-lock-fill text-[9px]" />
                                    System
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-700/60">
                                    Custom
                                  </span>
                                )}
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                                  {role.user_count} user
                                  {role.user_count !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {can("users", "update") &&
                              role.name !== "Owner" && (
                                <button
                                  onClick={() => setModalRole(role)}
                                  className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all text-sm border border-transparent hover:border-blue-200 dark:hover:border-blue-700/60"
                                >
                                  <i className="bi bi-pencil-fill text-[11px]" />
                                </button>
                              )}
                            {can("users", "delete") && !role.is_system && (
                              <button
                                onClick={() => setDeleteRoleId(role.id)}
                                className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-500 hover:text-red-500 dark:hover:text-red-400 flex items-center justify-center transition-all text-sm border border-transparent hover:border-red-200 dark:hover:border-red-700/60"
                              >
                                <i className="bi bi-trash3-fill text-[11px]" />
                              </button>
                            )}
                          </div>
                        </div>

                        {role.name === "Owner" ? (
                          <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/15 border border-red-100 dark:border-red-800/40 rounded-xl px-3 py-2.5">
                            <i className="bi bi-shield-fill-check text-red-500 text-sm" />
                            <span className="text-[12px] text-red-700 dark:text-red-400 font-semibold">
                              Full access to all modules and functions
                            </span>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${cfg.bar} transition-all duration-500`}
                                  style={{
                                    width: `${Math.min((grantedActions / (ALL_MODULES.length * 4)) * 100, 100)}%`,
                                  }}
                                />
                              </div>
                              <span className="text-[12px] font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                {permCount} module{permCount !== 1 ? "s" : ""}
                              </span>
                            </div>
                            {permCount === 0 ? (
                              <p className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
                                No default permissions set yet
                              </p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {role.default_permissions
                                  .slice(0, 6)
                                  .map((p) => (
                                    <span
                                      key={p.module}
                                      className={`inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}
                                    >
                                      {p.module.replace(/_/g, " ")}
                                    </span>
                                  ))}
                                {role.default_permissions.length > 6 && (
                                  <span className="inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                                    +{role.default_permissions.length - 6} more
                                  </span>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {modalRole !== undefined && (
        <RoleModal
          role={modalRole}
          onClose={() => setModalRole(undefined)}
          onSave={handleRoleSave}
        />
      )}

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />

      <ConfirmModal
        open={Boolean(deleteRoleId)}
        title="Delete Role"
        message={`Delete this role? Users already assigned to this role will keep their existing permissions.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDeleteRole}
        onCancel={() => setDeleteRoleId(null)}
      />
    </>
  );
}
