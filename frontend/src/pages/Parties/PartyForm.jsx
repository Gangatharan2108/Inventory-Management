import { useEffect, useState } from "react";
import { useNavigate, useParams, Link, useLocation } from "react-router-dom";
import { getParty, createParty, updateParty } from "../../api/partyService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

const PartyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  /* ── Pre-fill from navigation state (e.g. quick-add from SaleForm) ── */
  const prefill = location.state?.prefill || {};

  const [formData, setFormData] = useState({
    name: prefill.name || "",
    party_type: prefill.party_type || "",
    phone: "",
    email: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Fetch existing party (edit mode) ── */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await getParty(id);
        setFormData(res.data);
      } catch {
        setFetchError("Failed to load party data.");
      }
    })();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setShowConfirm(true);
  };
  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      if (isEdit) {
        await updateParty(id, formData);
        showToast("Party updated successfully", "success");
      } else {
        await createParty(formData);
        showToast("Party created successfully", "success");
      }
      navigate("/parties");
    } catch {
      showToast("Failed to save party", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Shared input class ── */
  const inputCls = `
    w-full px-4 py-2.5 rounded-xl border text-sm font-medium
    bg-white text-slate-800 border-slate-200
    placeholder:text-slate-400
    focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
    transition-all duration-200
    dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
    dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20
  `.trim();

  const labelCls =
    "block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

  return (
    <>
      {/* ═══ FORM CARD ═══ */}
      <div className="max-w-2xl mx-auto rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        {/* ── Card Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px]">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2 m-0">
            <i
              className={`bi ${isEdit ? "bi-pencil-square" : "bi-person-plus"} text-blue-300`}
            />
            {isEdit ? "Update Party" : "Add New Party"}
          </h5>
        </div>

        {/* ── Card Body ── */}
        <div className="bg-white dark:bg-slate-800 p-6 md:p-8 transition-colors duration-300">
          {/* Fetch Error */}
          {fetchError && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
              <i className="bi bi-exclamation-circle me-2" />
              {fetchError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Name */}
              <div>
                <label className={labelCls}>
                  <i className="bi bi-person me-1 text-blue-500" />
                  Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  className={inputCls}
                  placeholder="Enter party name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Party Type */}
              <div>
                <label className={labelCls}>
                  <i className="bi bi-tag me-1 text-blue-500" />
                  Party Type
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <select
                  name="party_type"
                  className={inputCls}
                  value={formData.party_type}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Type</option>
                  <option value="Customer">Customer</option>
                  <option value="Supplier">Supplier</option>
                </select>
              </div>

              {/* Phone */}
              <div>
                <label className={labelCls}>
                  <i className="bi bi-telephone me-1 text-blue-500" />
                  Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  className={inputCls}
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              {/* Email */}
              <div>
                <label className={labelCls}>
                  <i className="bi bi-envelope me-1 text-blue-500" />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  className={inputCls}
                  placeholder="example@email.com"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Address — full width */}
              <div className="md:col-span-2">
                <label className={labelCls}>
                  <i className="bi bi-geo-alt me-1 text-blue-500" />
                  Address
                </label>
                <textarea
                  name="address"
                  rows={3}
                  className={`${inputCls} resize-none`}
                  placeholder="Enter full address (optional)"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="my-6 border-t border-slate-100 dark:border-slate-700" />

            {/* ── Action Buttons ── */}
            <div className="flex items-center justify-between gap-3">
              <Link
                to="/parties"
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 no-underline dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <i className="bi bi-arrow-left" /> Cancel
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:bg-emerald-500 dark:hover:bg-emerald-400"
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
                    {isEdit ? "Update Party" : "Save Party"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      <ConfirmModal
        open={showConfirm}
        title="Confirm Save"
        message={`Are you sure you want to ${isEdit ? "update" : "save"} this party?`}
        confirmText={isEdit ? "Yes, Update" : "Yes, Save"}
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default PartyForm;
