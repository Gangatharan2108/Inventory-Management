import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getUserById,
  updateUser,
  verifyOldPassword,
} from "../../api/usereditService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

/* ══════════════════════════════════════════
   ROLE CONFIG
══════════════════════════════════════════ */
const ROLE_CONFIG = {
  Owner: {
    bg: "bg-red-50 dark:bg-red-900/20",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-300 dark:border-red-600",
    icon: "bi-shield-fill-check",
    iconBg: "bg-red-500",
    accent: "#c0392b",
    badgeCls:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60",
  },
  Manager: {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-400",
    border: "border-blue-300 dark:border-blue-600",
    icon: "bi-briefcase-fill",
    iconBg: "bg-blue-500",
    accent: "#2563eb",
    badgeCls:
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60",
  },
  Supervisor: {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-300 dark:border-emerald-600",
    icon: "bi-person-badge-fill",
    iconBg: "bg-emerald-500",
    accent: "#16a34a",
    badgeCls:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60",
  },
  Employee: {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-300 dark:border-amber-600",
    icon: "bi-person-fill",
    iconBg: "bg-amber-500",
    accent: "#ca8a04",
    badgeCls:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60",
  },
};

const roles = ["Owner", "Manager", "Supervisor", "Employee"];

/* ── Shared input class ── */
const inputBase = [
  "w-full h-[44px] rounded-xl border px-3.5 text-sm font-medium",
  "bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100",
  "border-slate-200 dark:border-slate-600",
  "placeholder:text-slate-400 dark:placeholder:text-slate-500",
  "focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:bg-white dark:focus:bg-slate-700 dark:focus:border-blue-400",
  "transition-all duration-200",
  "disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-700",
].join(" ");

const inputError =
  "!border-red-400 !ring-2 !ring-red-400/15 dark:!border-red-500";

/* ── Field label ── */
const FieldLabel = ({ children }) => (
  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-1.5">
    {children}
  </label>
);

/* ── Error message ── */
const FieldError = ({ msg }) =>
  msg ? (
    <p className="flex items-center gap-1.5 text-[12px] text-red-500 dark:text-red-400 mt-1.5 font-semibold">
      <i className="bi bi-exclamation-circle-fill text-[10px]" />
      {msg}
    </p>
  ) : null;

/* ── Section divider ── */
const Divider = ({ label }) => (
  <div className="flex items-center gap-3 my-5">
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
    <span className="text-[10.5px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
  </div>
);

/* ══════════════════════════════════════════
   USER FORM COMPONENT
══════════════════════════════════════════ */
export default function UserForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    email: "",
    phone: "",
    role: "",
    profile_image: null,
    old_password: "",
    password1: "",
    password2: "",
  });

  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const [oldPasswordVerified, setOldPasswordVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const selectedRole = ROLE_CONFIG[formData.role];
  const accent = selectedRole?.accent || "#3b82f6";

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await getUserById(id);
      setFormData((prev) => ({
        ...prev,
        username: res.data.username || "",
        first_name: res.data.first_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        role: res.data.role || "",
      }));
      setPreview(res.data.profile_image || null);
    } catch {
      showToast("Failed to load user", "error");
      navigate("/users");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "profile_image") {
      const file = files[0];
      setFormData((prev) => ({ ...prev, profile_image: file }));
      setPreview(URL.createObjectURL(file));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const verifyPassword = async () => {
    setVerifying(true);
    setErrors({});
    try {
      await verifyOldPassword(id, { old_password: formData.old_password });
      setOldPasswordVerified(true);
      showToast("Password verified", "success");
    } catch (err) {
      setOldPasswordVerified(false);
      if (err.response?.data) setErrors(err.response.data);
    }
    setVerifying(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setSaving(true);
    setErrors({});
    if (oldPasswordVerified && formData.password1 !== formData.password2) {
      setErrors({ password2: "Passwords do not match" });
      setSaving(false);
      return;
    }
    try {
      const data = new FormData();
      data.append("first_name", formData.first_name);
      data.append("email", formData.email);
      data.append("phone", formData.phone);
      data.append("role", formData.role);
      if (formData.profile_image instanceof File)
        data.append("profile_image", formData.profile_image);
      if (oldPasswordVerified) {
        data.append("old_password", formData.old_password);
        data.append("password1", formData.password1);
        data.append("password2", formData.password2);
      }
      await updateUser(id, data);
      showToast("User updated successfully", "success");
      navigate("/users");
    } catch (err) {
      if (err.response?.data) setErrors(err.response.data);
      else showToast("Update failed", "error");
    }
    setSaving(false);
  };

  const avatarUrl =
    preview ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.first_name || formData.username || "U")}&background=${accent.replace("#", "")}&color=fff&bold=true&size=128`;

  /* ── Loading ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
        </div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">
          Loading user…
        </p>
      </div>
    );

  return (
    <>
      <div className="max-w-[660px] mx-auto">
        {/* ════ CARD ════ */}
        <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] overflow-hidden transition-colors duration-300">
          {/* ── Dynamic accent bar ── */}
          <div
            className="h-1 w-full transition-colors duration-300"
            style={{ background: accent }}
          />

          {/* ════ HEADER ════ */}
          <div className="px-7 pt-6 pb-5 border-b border-slate-100 dark:border-slate-700/70">
            {/* Back button */}
            <button
              type="button"
              onClick={() => navigate("/users")}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-5 transition-colors duration-200"
            >
              <i className="bi bi-arrow-left" />
              Back to Users
            </button>

            {/* Avatar zone */}
            <div className="flex flex-col items-center gap-2.5">
              <label
                htmlFor="uf_img_input"
                className="relative w-[90px] h-[90px] cursor-pointer group"
              >
                <img
                  className="w-full h-full rounded-full object-cover border-[3px] border-white dark:border-slate-700 shadow-[0_2px_14px_rgba(0,0,0,0.14)] transition-opacity duration-200 group-hover:opacity-75"
                  src={avatarUrl}
                  alt="avatar"
                />
                <div className="absolute inset-0 rounded-full bg-black/35 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <i className="bi bi-camera-fill text-white text-lg" />
                </div>
              </label>
              <input
                id="uf_img_input"
                type="file"
                name="profile_image"
                accept="image/*"
                className="hidden"
                onChange={handleChange}
              />

              {/* Name + username + role badge */}
              <div className="text-center">
                <p className="text-[17px] font-extrabold text-slate-900 dark:text-slate-100 mb-1 leading-tight">
                  {formData.first_name || formData.username}
                </p>
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-slate-400 dark:text-slate-500 text-[12.5px] font-medium">
                    @{formData.username}
                  </span>
                  {selectedRole && (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${selectedRole.badgeCls}`}
                    >
                      <i className={`bi ${selectedRole.icon} text-[10px]`} />
                      {formData.role}
                    </span>
                  )}
                </div>
                <p className="text-[11.5px] text-slate-400 dark:text-slate-500 mt-1.5 font-medium">
                  Click avatar to change photo
                </p>
              </div>
            </div>
          </div>

          {/* ════ TABS ════ */}
          <div className="flex gap-2 px-7 pt-4">
            {[
              { key: "profile", label: "Profile", icon: "bi-person-fill" },
              { key: "password", label: "Password", icon: "bi-lock-fill" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={[
                  "flex-1 h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition-all duration-200 border",
                  activeTab === tab.key
                    ? "text-white border-transparent shadow-sm"
                    : "bg-slate-100 dark:bg-slate-700/60 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
                ].join(" ")}
                style={
                  activeTab === tab.key
                    ? { background: accent, borderColor: accent }
                    : {}
                }
              >
                <i className={`bi ${tab.icon}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* ════ FORM BODY ════ */}
          <form onSubmit={handleSubmit}>
            <div className="px-7 py-6">
              {/* ════ PROFILE TAB ════ */}
              {activeTab === "profile" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username — disabled */}
                    <div className="sm:col-span-2">
                      <FieldLabel>Username</FieldLabel>
                      <div className="relative">
                        <i className="bi bi-at absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[13px] pointer-events-none" />
                        <input
                          className={`${inputBase} pl-9`}
                          value={formData.username}
                          disabled
                        />
                      </div>
                    </div>

                    {/* Full Name */}
                    <div>
                      <FieldLabel>Full Name</FieldLabel>
                      <input
                        name="first_name"
                        className={`${inputBase} ${errors.first_name ? inputError : ""}`}
                        value={formData.first_name}
                        onChange={handleChange}
                        placeholder="Full name"
                      />
                      <FieldError msg={errors.first_name} />
                    </div>

                    {/* Phone */}
                    <div>
                      <FieldLabel>Phone</FieldLabel>
                      <div className="relative">
                        <i className="bi bi-telephone-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[13px] pointer-events-none" />
                        <input
                          name="phone"
                          className={`${inputBase} pl-9`}
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="+91 99999 99999"
                        />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="sm:col-span-2">
                      <FieldLabel>Email</FieldLabel>
                      <div className="relative">
                        <i className="bi bi-envelope-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[13px] pointer-events-none" />
                        <input
                          name="email"
                          type="email"
                          className={`${inputBase} pl-9 ${errors.email ? inputError : ""}`}
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="email@example.com"
                        />
                      </div>
                      <FieldError msg={errors.email} />
                    </div>
                  </div>

                  {/* ── Role picker ── */}
                  <Divider label="Role" />
                  <div className="grid grid-cols-2 gap-3">
                    {roles.map((role) => {
                      const cfg = ROLE_CONFIG[role];
                      const isSelected = formData.role === role;
                      return (
                        <label
                          key={role}
                          className={[
                            "flex items-center gap-3 p-3.5 rounded-xl cursor-pointer border-2 transition-all duration-200",
                            isSelected
                              ? `${cfg.bg} ${cfg.border}`
                              : "bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700/60",
                          ].join(" ")}
                        >
                          <input
                            type="radio"
                            name="role"
                            value={role}
                            className="hidden"
                            checked={isSelected}
                            onChange={handleChange}
                          />
                          {/* Role icon */}
                          <div
                            className={[
                              "w-9 h-9 rounded-xl flex items-center justify-center text-[15px] shrink-0 transition-all duration-200",
                              isSelected
                                ? `${cfg.iconBg} text-white shadow-sm`
                                : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400",
                            ].join(" ")}
                          >
                            <i className={`bi ${cfg.icon}`} />
                          </div>
                          <span
                            className={`text-[13.5px] font-bold transition-colors duration-200 ${isSelected ? cfg.text : "text-slate-600 dark:text-slate-300"}`}
                          >
                            {role}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <FieldError msg={errors.role} />
                </>
              )}

              {/* ════ PASSWORD TAB ════ */}
              {activeTab === "password" && (
                <>
                  {/* Old password + Verify */}
                  {!oldPasswordVerified && (
                    <div className="mb-4">
                      <FieldLabel>Current Password</FieldLabel>
                      <div className="flex gap-2">
                        {/* Password input */}
                        <div className="relative flex-1">
                          <input
                            type={showOld ? "text" : "password"}
                            name="old_password"
                            className={`${inputBase} pr-11 ${errors.old_password ? inputError : ""}`}
                            value={formData.old_password}
                            onChange={handleChange}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowOld(!showOld)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                          >
                            <i
                              className={`bi ${showOld ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                            />
                          </button>
                        </div>
                        {/* Verify button */}
                        <button
                          type="button"
                          onClick={verifyPassword}
                          disabled={verifying || !formData.old_password}
                          className="h-[44px] px-5 rounded-xl text-white text-[13px] font-bold flex items-center gap-2 transition-all duration-200 hover:opacity-90 hover:-translate-y-px disabled:opacity-60 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
                          style={{
                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                          }}
                        >
                          {verifying ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <i className="bi bi-shield-check" /> Verify
                            </>
                          )}
                        </button>
                      </div>
                      <FieldError msg={errors.old_password} />
                    </div>
                  )}

                  {/* Verified badge */}
                  {oldPasswordVerified && (
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/60 text-emerald-700 dark:text-emerald-400 text-[13px] font-semibold px-4 py-2.5 rounded-xl">
                        <i className="bi bi-check-circle-fill text-emerald-500" />
                        Identity verified — set your new password
                      </div>
                    </div>
                  )}

                  {/* New passwords */}
                  {oldPasswordVerified && (
                    <>
                      <Divider label="New Password" />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* New password */}
                        <div>
                          <FieldLabel>New Password</FieldLabel>
                          <div className="relative">
                            <input
                              type={showNew ? "text" : "password"}
                              name="password1"
                              className={`${inputBase} pr-11 ${errors.password1 ? inputError : ""}`}
                              value={formData.password1}
                              onChange={handleChange}
                              placeholder="Min 8 characters"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNew(!showNew)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                            >
                              <i
                                className={`bi ${showNew ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                              />
                            </button>
                          </div>
                          <FieldError msg={errors.password1} />
                        </div>

                        {/* Confirm password */}
                        <div>
                          <FieldLabel>Confirm Password</FieldLabel>
                          <div className="relative">
                            <input
                              type={showCfm ? "text" : "password"}
                              name="password2"
                              className={`${inputBase} pr-11 ${errors.password2 ? inputError : ""}`}
                              value={formData.password2}
                              onChange={handleChange}
                              placeholder="Re-enter password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCfm(!showCfm)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                            >
                              <i
                                className={`bi ${showCfm ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                              />
                            </button>
                          </div>
                          <FieldError msg={errors.password2} />
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── Error summary box ── */}
              {Object.values(errors).some(Boolean) && (
                <div className="mt-4 flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-[13px] font-medium rounded-xl px-4 py-3.5">
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
            </div>

            {/* ════ FOOTER ════ */}
            {(activeTab === "profile" ||
              (activeTab === "password" && oldPasswordVerified)) && (
              <div className="px-7 py-4 border-t border-slate-100 dark:border-slate-700/70 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/users")}
                  className="h-[44px] px-6 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-transparent text-slate-600 dark:text-slate-300 text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="h-[44px] px-7 rounded-xl text-white text-sm font-bold flex items-center gap-2 shadow-md transition-all duration-200 hover:opacity-90 hover:-translate-y-px hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  style={{
                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                  }}
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-circle" />
                      Update User
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Update"
        message="Are you sure you want to save the changes to this user?"
        confirmText="Update"
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
