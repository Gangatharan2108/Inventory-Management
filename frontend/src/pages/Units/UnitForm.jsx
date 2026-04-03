import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { createUnit, getUnit, updateUnit } from "../../api/unitService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

/* ── Shared classes ── */
const inputCls = `
  w-full px-4 py-2.5 rounded-xl border text-sm font-medium
  bg-white text-slate-800 border-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500
  transition-all duration-200
  dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
  dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20
`.trim();

const labelCls =
  "block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

/* ── Unit type option card ── */
const TypeCard = ({ value, current, onChange, icon, title, desc, color }) => {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={`
        flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 text-center
        transition-all duration-200 cursor-pointer
        ${
          active
            ? `${color.activeBorder} ${color.activeBg} ${color.activeText} shadow-sm`
            : "border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300 dark:border-slate-600 dark:bg-slate-700/40 dark:text-slate-400 dark:hover:border-slate-500"
        }
      `}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${active ? color.iconBg : "bg-white dark:bg-slate-700"}`}
      >
        <i
          className={`bi ${icon} ${active ? color.iconText : "text-slate-400 dark:text-slate-500"}`}
        />
      </div>
      <div>
        <div
          className={`text-[13px] font-bold ${active ? color.activeText : "text-slate-700 dark:text-slate-300"}`}
        >
          {title}
        </div>
        <div
          className={`text-[11px] mt-0.5 ${active ? color.activeSubText : "text-slate-400 dark:text-slate-500"}`}
        >
          {desc}
        </div>
      </div>
    </button>
  );
};

export default function UnitForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    short_name: "",
    unit_type: "Integer",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Load for edit ── */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await getUnit(id);
        setFormData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load unit.");
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleTypeChange = (val) =>
    setFormData((prev) => ({ ...prev, unit_type: val }));

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError("");
    try {
      if (isEdit) {
        await updateUnit(id, formData);
        showToast("Unit updated successfully", "success");
      } else {
        await createUnit(formData);
        showToast("Unit created successfully", "success");
      }
      navigate("/units");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data
        ? Object.values(err.response.data).flat().join(" ")
        : "Failed to save unit.";
      setError(msg);
      showToast("Failed to save unit", "error");
    } finally {
      setLoading(false);
    }
  };

  const isValid = formData.name.trim() && formData.short_name.trim();

  return (
    <>
      <div className="max-w-lg mx-auto">
        <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
          {/* ── Card Header ── */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <i className="bi bi-rulers text-blue-300 text-lg" />
              </div>
              <div>
                <h5 className="text-white font-bold text-[15px] tracking-wide m-0 leading-none">
                  {isEdit ? "Update Unit" : "Add New Unit"}
                </h5>
                <p className="text-slate-400 text-[11px] mt-0.5 m-0 font-medium">
                  {isEdit
                    ? "Edit measurement unit details"
                    : "Define a new measurement unit for products"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Card Body ── */}
          <div className="bg-white dark:bg-slate-800 px-6 py-7 transition-colors duration-300">
            {/* Error */}
            {error && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
                <i className="bi bi-exclamation-circle shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* ── Unit Name ── */}
              <div className="mb-5">
                <label className={labelCls}>
                  <i className="bi bi-rulers me-1.5 text-blue-500" />
                  Unit Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={inputCls}
                  placeholder="e.g. Kilogram, Litre, Piece…"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>

              {/* ── Short Name ── */}
              <div className="mb-6">
                <label className={labelCls}>
                  <i className="bi bi-badge-ad me-1.5 text-blue-500" />
                  Short Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="short_name"
                    className={`${inputCls} pr-20`}
                    placeholder="e.g. kg, L, pcs…"
                    value={formData.short_name}
                    onChange={handleChange}
                    maxLength={10}
                    required
                  />
                  {/* Live preview tag */}
                  {formData.short_name.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-[11px] font-bold px-2.5 py-1 rounded-lg">
                        {formData.short_name.trim()}
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                  This will appear next to quantities in product forms (max 10
                  chars)
                </p>
              </div>

              {/* ── Unit Type — Visual Card Selector ── */}
              <div className="mb-7">
                <label className={labelCls}>
                  <i className="bi bi-toggles me-1.5 text-blue-500" />
                  Unit Type
                </label>
                <div className="flex gap-3">
                  <TypeCard
                    value="Integer"
                    current={formData.unit_type}
                    onChange={handleTypeChange}
                    icon="bi-hash"
                    title="Integer"
                    desc="Whole numbers only (1, 2, 3…)"
                    color={{
                      activeBorder: "border-blue-500 dark:border-blue-400",
                      activeBg: "bg-blue-50 dark:bg-blue-900/20",
                      activeText: "text-blue-700 dark:text-blue-300",
                      activeSubText: "text-blue-500 dark:text-blue-400",
                      iconBg: "bg-blue-100 dark:bg-blue-900/40",
                      iconText: "text-blue-600 dark:text-blue-400",
                    }}
                  />
                  <TypeCard
                    value="Decimal"
                    current={formData.unit_type}
                    onChange={handleTypeChange}
                    icon="bi-calculator"
                    title="Decimal"
                    desc="Fractional values (1.5, 2.75…)"
                    color={{
                      activeBorder:
                        "border-emerald-500 dark:border-emerald-400",
                      activeBg: "bg-emerald-50 dark:bg-emerald-900/20",
                      activeText: "text-emerald-700 dark:text-emerald-300",
                      activeSubText: "text-emerald-500 dark:text-emerald-400",
                      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
                      iconText: "text-emerald-600 dark:text-emerald-400",
                    }}
                  />
                </div>
              </div>

              {/* ── Preview Summary ── */}
              {isValid && (
                <div className="mb-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600">
                  <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                    Preview
                  </p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        Name:
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                        {formData.name}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        Symbol:
                      </span>
                      <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400 text-[12px] font-bold px-2.5 py-0.5 rounded-lg">
                        {formData.short_name}
                      </span>
                    </div>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 text-sm">
                        Type:
                      </span>
                      <span
                        className={`text-[11.5px] font-bold px-2.5 py-0.5 rounded-full
                        ${
                          formData.unit_type === "Decimal"
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                        }`}
                      >
                        {formData.unit_type}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Divider ── */}
              <div className="border-t border-slate-100 dark:border-slate-700 mb-6" />

              {/* ── Action Buttons ── */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/units"
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 no-underline dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <i className="bi bi-arrow-left" /> Cancel
                </Link>

                <button
                  type="submit"
                  disabled={loading || !isValid}
                  className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:bg-emerald-500 dark:hover:bg-emerald-400"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i
                        className={`bi ${isEdit ? "bi-check-circle" : "bi-plus-circle"}`}
                      />
                      {isEdit ? "Update Unit" : "Save Unit"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm Save"
        message={`Are you sure you want to ${isEdit ? "update" : "create"} the unit "${formData.name}"?`}
        confirmText={isEdit ? "Yes, Update" : "Yes, Create"}
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
