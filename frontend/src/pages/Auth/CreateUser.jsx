import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "../../api/userService";
import { getRoles } from "../../api/roleService";
import { useToast } from "../../context/ToastContext";

const ROLE_CONFIG = {
  Owner: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-600",
    iconBg: "bg-red-500",
    headerBg: "bg-red-50 dark:bg-red-900/30",
    icon: "bi-shield-fill-check",
    accent: "#c0392b",
  },
  Manager: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-600",
    iconBg: "bg-blue-500",
    headerBg: "bg-blue-50 dark:bg-blue-900/30",
    icon: "bi-briefcase-fill",
    accent: "#2563eb",
  },
  Supervisor: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-600",
    iconBg: "bg-emerald-500",
    headerBg: "bg-emerald-50 dark:bg-emerald-900/30",
    icon: "bi-person-badge-fill",
    accent: "#16a34a",
  },
  Employee: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-600",
    iconBg: "bg-amber-500",
    headerBg: "bg-amber-50 dark:bg-amber-900/30",
    icon: "bi-person-fill",
    accent: "#ca8a04",
  },
};
const CUSTOM_CFG = {
  bg: "bg-violet-50 dark:bg-violet-900/20",
  text: "text-violet-700 dark:text-violet-400",
  border: "border-violet-300 dark:border-violet-600",
  iconBg: "bg-violet-500",
  headerBg: "bg-violet-50 dark:bg-violet-900/30",
  icon: "bi-person-gear",
  accent: "#7c3aed",
};
const getRoleCfg = (n) => ROLE_CONFIG[n] || CUSTOM_CFG;

const inputBase =
  "w-full h-[44px] rounded-xl border-[1.5px] px-3.5 text-sm font-medium bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-600 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-700 focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200";
const inputError =
  "!border-red-400 dark:!border-red-500 !ring-2 !ring-red-400/15";
const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}
  </label>
);
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-[12px] text-red-500 dark:text-red-400 mt-1.5 font-semibold">
      <i className="bi bi-exclamation-circle-fill text-[10px]" />
      {Array.isArray(msg) ? msg[0] : msg}
    </p>
  ) : null;
const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
    <span className="text-[10.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
  </div>
);

export default function CreateUser() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    email: "",
    phone: "",
    role: "",
    password1: "",
    password2: "",
    profile_image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPass1, setShowPass1] = useState(false);
  const [showPass2, setShowPass2] = useState(false);

  useEffect(() => {
    getRoles()
      .then(setRoles)
      .catch(() => showToast("Failed to load roles", "error"))
      .finally(() => setRolesLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_image") {
      const f = files[0];
      setFormData({ ...formData, profile_image: f });
      setImagePreview(URL.createObjectURL(f));
    } else setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (formData.password1 !== formData.password2) {
      setErrors({ password2: "Passwords do not match" });
      return;
    }
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => {
        if (formData[k] !== null && formData[k] !== "")
          data.append(k, formData[k]);
      });
      await createUser(data);
      showToast("User created successfully", "success");
      navigate("/users");
    } catch (err) {
      if (err.response?.data) setErrors(err.response.data);
      else showToast("Failed to create user", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedRoleCfg = formData.role ? getRoleCfg(formData.role) : null;
  const accentColor = selectedRoleCfg?.accent || "#3b82f6";
  const selectedRoleObj = roles.find((r) => r.name === formData.role);
  const defaultPermCount = selectedRoleObj?.default_permissions?.length || 0;
  const avatarName = formData.first_name || formData.username || "U";
  const avatarUrl =
    imagePreview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=${accentColor.replace("#", "")}&color=fff&bold=true&size=128`;
  const hasErrors = Object.values(errors).some(Boolean);

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-300">
        <div
          className="h-1 w-full transition-colors duration-300"
          style={{ background: accentColor }}
        />
        <div className="px-8 pt-7 pb-6 border-b border-slate-100 dark:border-slate-700/70">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-[14px] flex items-center justify-center text-xl shrink-0 transition-all duration-300 ${selectedRoleCfg ? selectedRoleCfg.headerBg : "bg-blue-50 dark:bg-blue-900/30"}`}
              style={{ color: accentColor }}
            >
              <i
                className={`bi ${selectedRoleCfg?.icon || "bi-person-plus-fill"}`}
              />
            </div>
            <div>
              <h5 className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100 m-0 leading-tight tracking-tight">
                Create New User
              </h5>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 m-0 font-medium">
                Fill in the details to add a team member
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-7">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3 pb-6">
            <label
              htmlFor="profile_image_input"
              className="relative w-[100px] h-[100px] cursor-pointer group"
            >
              <img
                className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-[0_2px_16px_rgba(0,0,0,0.13)] transition-opacity duration-200 group-hover:opacity-75"
                src={avatarUrl}
                alt="avatar"
              />
              <div className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <i className="bi bi-camera-fill text-white text-xl" />
              </div>
            </label>
            <input
              id="profile_image_input"
              type="file"
              name="profile_image"
              accept="image/*"
              className="hidden"
              onChange={handleChange}
            />
            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">
              Click avatar to upload photo
            </span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <FieldLabel>Username</FieldLabel>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  className={`${inputBase} ${errors.username ? inputError : ""}`}
                  placeholder="e.g. john_doe"
                  onChange={handleChange}
                  required
                />
                <FieldError msg={errors.username} />
              </div>
              <div>
                <FieldLabel>Full Name</FieldLabel>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  className={`${inputBase} ${errors.first_name ? inputError : ""}`}
                  placeholder="e.g. John Doe"
                  onChange={handleChange}
                  required
                />
                <FieldError msg={errors.first_name} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <FieldLabel>Email</FieldLabel>
                <div className="relative">
                  <i className="bi bi-envelope-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    className={`${inputBase} pl-9 ${errors.email ? inputError : ""}`}
                    placeholder="email@example.com"
                    onChange={handleChange}
                    required
                  />
                </div>
                <FieldError msg={errors.email} />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <div className="relative">
                  <i className="bi bi-telephone-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[13px] pointer-events-none" />
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    className={`${inputBase} pl-9`}
                    placeholder="+91 99999 99999"
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <Divider label="Select Role" />
            {rolesLoading ? (
              <div className="grid grid-cols-2 gap-3 mb-1">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-[60px] rounded-xl bg-slate-100 dark:bg-slate-700/50 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 mb-1">
                {roles.map((role) => {
                  const cfg = getRoleCfg(role.name);
                  const isSel = formData.role === role.name;
                  return (
                    <label
                      key={role.id}
                      className={[
                        "flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border-2 transition-all duration-200 select-none",
                        isSel
                          ? `${cfg.bg} ${cfg.border} shadow-sm`
                          : "bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60",
                      ].join(" ")}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={role.name}
                        className="hidden"
                        checked={isSel}
                        onChange={handleChange}
                      />
                      <div
                        className={[
                          "w-9 h-9 rounded-xl flex items-center justify-center text-[15px] shrink-0 transition-all duration-200",
                          isSel
                            ? `${cfg.iconBg} text-white shadow-sm`
                            : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400",
                        ].join(" ")}
                      >
                        <i className={`bi ${cfg.icon}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className={`text-[13.5px] font-bold block ${isSel ? cfg.text : "text-slate-600 dark:text-slate-300"}`}
                        >
                          {role.name}
                        </span>
                        {!role.is_system && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            Custom Role
                          </span>
                        )}
                      </div>
                      {isSel && (
                        <i
                          className={`bi bi-check-circle-fill ml-auto text-sm ${cfg.text} shrink-0`}
                        />
                      )}
                    </label>
                  );
                })}
              </div>
            )}

            {formData.role && formData.role !== "Owner" && (
              <div className="flex items-center gap-2 mt-3 mb-1 px-1">
                <i className="bi bi-shield-check text-emerald-500 text-[13px]" />
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                  {defaultPermCount > 0
                    ? `${defaultPermCount} default permission module${defaultPermCount !== 1 ? "s" : ""} will be auto-applied`
                    : "No default permissions set for this role"}
                </span>
              </div>
            )}
            {formData.role === "Owner" && (
              <div className="flex items-center gap-2 mt-3 mb-1 px-1">
                <i className="bi bi-shield-fill-check text-red-500 text-[13px]" />
                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                  Owner has full access to all pages and functions
                </span>
              </div>
            )}
            <FieldError msg={errors.role} />

            <Divider label="Set Password" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-1">
              <div>
                <FieldLabel>Password</FieldLabel>
                <div className="relative">
                  <input
                    type={showPass1 ? "text" : "password"}
                    name="password1"
                    value={formData.password1}
                    className={`${inputBase} pr-11 ${errors.password1 ? inputError : ""}`}
                    placeholder="Min 8 characters"
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass1(!showPass1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[15px] transition-colors duration-200"
                  >
                    <i
                      className={`bi ${showPass1 ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                    />
                  </button>
                </div>
                <FieldError msg={errors.password1} />
              </div>
              <div>
                <FieldLabel>Confirm Password</FieldLabel>
                <div className="relative">
                  <input
                    type={showPass2 ? "text" : "password"}
                    name="password2"
                    value={formData.password2}
                    className={`${inputBase} pr-11 ${errors.password2 ? inputError : ""}`}
                    placeholder="Re-enter password"
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass2(!showPass2)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[15px] transition-colors duration-200"
                  >
                    <i
                      className={`bi ${showPass2 ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                    />
                  </button>
                </div>
                <FieldError msg={errors.password2} />
              </div>
            </div>

            {hasErrors && (
              <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-[13px] font-medium rounded-xl px-4 py-3.5 mt-4">
                <i className="bi bi-exclamation-triangle-fill text-red-500 shrink-0 mt-0.5" />
                <div>
                  {Object.entries(errors)
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <span key={k} className="block">
                        {Array.isArray(v) ? v[0] : v}
                      </span>
                    ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 mt-6 rounded-[14px] text-white text-[15px] font-bold flex items-center justify-center gap-2.5 transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
              }}
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating…
                </>
              ) : (
                <>
                  <i className="bi bi-person-check-fill text-base" />
                  Create User
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
