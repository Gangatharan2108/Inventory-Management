import { useEffect, useState, useCallback } from "react";
import { getCategories, deleteCategory } from "../../api/categoryService";
import { Link } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import { usePermission } from "../../hooks/usePermission";

const CategoryList = () => {
  const { showToast } = useToast();
  const { can } = usePermission();

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const showActionCol =
    can("categories", "update") || can("categories", "delete");

  /* ── Fetch ── */
  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCategories();
      setCategories(res.data || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  /* ── Delete ── */
  const handleDelete = (id) => setDeleteId(id);
  const confirmDelete = async () => {
    try {
      await deleteCategory(deleteId);
      showToast("Category deleted successfully", "success");
      fetchCategories();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete category", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";

  /* ── Loading ── */
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-600 dark:border-t-blue-400" />
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading categories…
        </p>
      </div>
    );

  /* ── Error ── */
  if (error)
    return (
      <div className="max-w-lg mx-auto mt-10">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <i className="bi bi-exclamation-circle me-2" />
          {error}
        </div>
      </div>
    );

  return (
    <>
      <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        {/* ── Card Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2 m-0">
            <i className="bi bi-tags text-blue-300" />
            Category List
            <span className="ml-2 text-[11px] font-semibold bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full">
              {categories.length} total
            </span>
          </h5>

          {can("categories", "create") && (
            <Link
              to="/categories/create"
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 no-underline shadow-sm hover:shadow-md hover:-translate-y-px"
            >
              <i className="bi bi-plus-circle" /> Add Category
            </Link>
          )}
        </div>

        {/* ── Card Body ── */}
        <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
          {/* ── Empty State ── */}
          {categories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
              <i className="bi bi-tags text-5xl opacity-30" />
              <p className="text-base font-semibold m-0">No Categories Found</p>
              <p className="text-sm m-0 opacity-70">
                Organize your products by creating categories
              </p>
              {can("categories", "create") && (
                <Link
                  to="/categories/create"
                  className="mt-2 flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all duration-200 no-underline"
                >
                  <i className="bi bi-plus-circle" /> Create First Category
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                {/* Head */}
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-600">
                    {[
                      "No",
                      "Category Name",
                      "Products",
                      "Created At",
                      ...(showActionCol ? ["Actions"] : []),
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3.5 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400
                          ${i === (showActionCol ? 4 : 3) ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {categories.map((cat, index) => (
                    <tr
                      key={cat.id}
                      className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                    >
                      {/* No */}
                      <td className="px-5 py-4 text-slate-400 dark:text-slate-500 font-medium text-sm w-16">
                        {index + 1}
                      </td>

                      {/* Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                            <i className="bi bi-folder2-open text-blue-500 dark:text-blue-400 text-base" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-100 text-[14px]">
                            {cat.name}
                          </span>
                        </div>
                      </td>

                      {/* Product Count */}
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[12px] font-bold px-3 py-1.5 rounded-full">
                          <i className="bi bi-box-seam text-[10px]" />
                          {cat.product_count ?? 0} product
                          {(cat.product_count ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Created At */}
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400 text-[13px]">
                        <div className="flex items-center gap-1.5">
                          <i className="bi bi-calendar3 text-slate-400 dark:text-slate-500 text-[11px]" />
                          {formatDate(cat.created_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      {showActionCol && (
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {can("categories", "update") && (
                              <Link
                                to={`/categories/edit/${cat.id}`}
                                className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 no-underline dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-500 dark:hover:text-white"
                              >
                                <i className="bi bi-pencil-square" /> Edit
                              </Link>
                            )}
                            {can("categories", "delete") && (
                              <button
                                onClick={() => handleDelete(cat.id)}
                                className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-500 dark:hover:text-white"
                              >
                                <i className="bi bi-trash" /> Delete
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Confirm Delete"
        message="Are you sure you want to delete this category? Products linked to this category may be affected."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
};

export default CategoryList;
