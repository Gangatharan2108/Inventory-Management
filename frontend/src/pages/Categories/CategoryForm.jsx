import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getCategory,
  createCategory,
  updateCategory,
} from "../../api/categoryService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

const CategoryForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  /* ── Load existing category (edit mode) ── */
  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      try {
        const res = await getCategory(id);
        setName(res.data.name);
      } catch (err) {
        console.error(err);
        setError("Failed to load category.");
      }
    })();
  }, [id, isEdit]);

  /* ── Submit ── */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    setError(null);
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    setError(null);
    try {
      if (isEdit) {
        await updateCategory(id, { name });
        showToast("Category updated successfully", "success");
      } else {
        await createCategory({ name });
        showToast("Category created successfully", "success");
      }
      navigate("/categories");
    } catch (err) {
      console.error(err);
      showToast("Failed to save category", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ── Character count ── */
  const charCount = name.trim().length;
  const isValid = charCount > 0;

  return (
    <>
      <div className="max-w-lg mx-auto">
        <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
          {/* ── Card Header ── */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                <i className="bi bi-tags text-blue-300 text-lg" />
              </div>
              <div>
                <h5 className="text-white font-bold text-[15px] tracking-wide m-0 leading-none">
                  {isEdit ? "Update Category" : "Add New Category"}
                </h5>
                <p className="text-slate-400 text-[11px] mt-0.5 m-0 font-medium">
                  {isEdit
                    ? "Edit the category name below"
                    : "Create a new product category"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Card Body ── */}
          <div className="bg-white dark:bg-slate-800 px-6 py-7 transition-colors duration-300">
            {/* Error */}
            {error && (
              <div className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl dark:bg-red-900/20 dark:border-red-700 dark:text-red-400">
                <i className="bi bi-exclamation-circle shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* ── Category Name Input ── */}
              <div className="mb-6">
                <label className="block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  <i className="bi bi-tags me-1.5 text-blue-500" />
                  Category Name
                  <span className="text-red-500 ml-0.5">*</span>
                </label>

                <div className="relative">
                  <input
                    type="text"
                    className={`
                      w-full px-4 py-3 rounded-xl border text-sm font-medium pr-16
                      bg-white text-slate-800 placeholder:text-slate-400
                      focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-500
                      transition-all duration-200
                      dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
                      dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20
                      ${error && !name.trim() ? "border-red-400 dark:border-red-500" : "border-slate-200"}
                    `}
                    placeholder="e.g. Dairy Products, Electronics, Beverages…"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (error) setError(null);
                    }}
                    maxLength={80}
                    required
                    autoFocus
                  />
                  {/* Char counter */}
                  <span
                    className={`absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-medium tabular-nums
                    ${charCount > 70 ? "text-amber-500" : "text-slate-400 dark:text-slate-500"}`}
                  >
                    {charCount}/80
                  </span>
                </div>

                <p className="mt-1.5 text-[11.5px] text-slate-400 dark:text-slate-500">
                  Use a clear, descriptive name — it will appear in product
                  forms and reports.
                </p>
              </div>

              {/* ── Preview pill ── */}
              {isValid && (
                <div className="mb-6 flex items-center gap-2 text-[12.5px] text-slate-500 dark:text-slate-400">
                  <span className="font-medium">Preview:</span>
                  <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-semibold px-3 py-1 rounded-full border border-blue-100 dark:border-blue-800">
                    <i className="bi bi-folder2-open text-[11px]" />
                    {name.trim()}
                  </span>
                </div>
              )}

              {/* ── Divider ── */}
              <div className="border-t border-slate-100 dark:border-slate-700 mb-6" />

              {/* ── Action Buttons ── */}
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/categories"
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
                      {isEdit ? "Update Category" : "Save Category"}
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
        message={`Are you sure you want to ${isEdit ? "update" : "create"} the category "${name.trim()}"?`}
        confirmText={isEdit ? "Yes, Update" : "Yes, Create"}
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default CategoryForm;
