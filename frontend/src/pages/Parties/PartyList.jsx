import { useEffect, useState, useCallback, useMemo } from "react";
import { getParties, deleteParty } from "../../api/partyService";
import { Link } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import { usePermission } from "../../hooks/usePermission";

const ITEMS_PER_PAGE = 10;


const PartyList = () => {
  const { showToast } = useToast();
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState(null);
  const { can } = usePermission();
  const showActionCol = can("parties", "update") || can("parties", "delete");

  /* ── Fetch ── */
  const fetchParties = useCallback(async (type = "All") => {
    try {
      setLoading(true);
      const res = type === "All" ? await getParties() : await getParties(type);
      setParties(res.data || []);
      setError(null);
      setCurrentPage(1);
    } catch (err) {
      console.error("Party Fetch Error:", err);
      setError("Failed to load parties.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParties(filterType);
  }, [filterType, fetchParties]);

  const handleDelete = (id) => setDeleteId(id);
  const confirmDelete = async () => {
    try {
      await deleteParty(deleteId);
      showToast("Party deleted successfully", "success");
      fetchParties(filterType);
    } catch {
      showToast("Failed to delete party", "error");
    } finally {
      setDeleteId(null);
    }
  };

  /* ── Pagination ── */
  const totalPages = Math.ceil(parties.length / ITEMS_PER_PAGE);
  const paginatedParties = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return parties.slice(start, start + ITEMS_PER_PAGE);
  }, [parties, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const isSupplierView = filterType === "Supplier";

  /* ── Loading ── */
  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-600 dark:border-t-blue-400" />
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading parties…
          </p>
        </div>
      </div>
    );

  /* ── Error ── */
  if (error)
    return (
      <div className="mx-auto max-w-lg mt-10">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
          <i className="bi bi-exclamation-circle me-2" />
          {error}
        </div>
      </div>
    );

  /* ── Badge colour for party type ── */
  const typeBadge = (type) =>
    type === "Customer"
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

  /* ── Filter button style ── */
  const filterBtn = (active, color) => {
    const base =
      "px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border";
    const map = {
      dark: active
        ? "bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900 dark:border-slate-200"
        : "border-slate-300 text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700",
      success: active
        ? "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500"
        : "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-900/20",
      warning: active
        ? "bg-amber-500 text-white border-amber-500 dark:bg-amber-400 dark:text-slate-900"
        : "border-amber-400 text-amber-600 hover:bg-amber-50 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-900/20",
    };
    return `${base} ${map[color]}`;
  };

  return (
    <>
      {/* ═══ MAIN CARD ═══ */}
      <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        {/* ── Card Header ── */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2 m-0">
            <i className="bi bi-people text-blue-300" />
            Party List
          </h5>
          {can("parties", "create") && (
            <Link
              to="/parties/create"
              className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 no-underline shadow-sm hover:shadow-md hover:-translate-y-px"
            >
              <i className="bi bi-plus-circle" /> Add Party
            </Link>
          )}
        </div>

        {/* ── Card Body ── */}
        <div className="bg-white dark:bg-slate-800 p-6 transition-colors duration-300">
          {/* ── Filter Buttons ── */}
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              className={filterBtn(filterType === "All", "dark")}
              onClick={() => setFilterType("All")}
            >
              All
            </button>
            <button
              className={filterBtn(filterType === "Customer", "success")}
              onClick={() => setFilterType("Customer")}
            >
              <i className="bi bi-person-check me-1" />
              Customers
            </button>
            <button
              className={filterBtn(filterType === "Supplier", "warning")}
              onClick={() => setFilterType("Supplier")}
            >
              <i className="bi bi-building me-1" />
              Suppliers
            </button>
            {/* Party count badge */}
            <span className="ml-auto flex items-center text-[12px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-full">
              {parties.length}{" "}
              {filterType !== "All" ? filterType + "s" : "Parties"}
            </span>
          </div>

          {/* ── Empty State ── */}
          {parties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
              <i className="bi bi-people text-5xl opacity-40" />
              <p className="text-base font-semibold m-0">
                No {filterType !== "All" ? filterType + "s" : "Parties"} Found
              </p>
              <p className="text-sm m-0 opacity-70">
                Add your first{" "}
                {filterType !== "All" ? filterType.toLowerCase() : "party"} to
                get started
              </p>
            </div>
          ) : (
            <>
              {/* ── Table ── */}
              <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
                <table className="w-full text-sm text-center border-collapse">
                  {/* Table Head */}
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-600">
                      {[
                        "No",
                        "Name",
                        "Type",
                        "Phone",
                        "Email",
                        ...(isSupplierView
                          ? ["Total Purchase", "Total Paid", "Balance"]
                          : []),
                        ...(showActionCol ? ["Action"] : []),
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {paginatedParties.map((party, index) => {
                      const totalPurchase = parseFloat(
                        party.total_purchase || 0,
                      );
                      const totalPaid = parseFloat(party.total_paid || 0);
                      const balance = parseFloat(party.balance || 0);

                      return (
                        <tr
                          key={party.id}
                          className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                        >
                          {/* No */}
                          <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>

                          {/* Name */}
                          <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100">
                            {party.name}
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${typeBadge(party.party_type)}`}
                            >
                              {party.party_type}
                            </span>
                          </td>

                          {/* Phone */}
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            {party.phone || "—"}
                          </td>

                          {/* Email */}
                          <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                            {party.email || "—"}
                          </td>

                          {/* Supplier columns */}
                          {isSupplierView && (
                            <>
                              <td className="px-4 py-3.5 font-medium text-slate-700 dark:text-slate-200">
                                ₹ {totalPurchase.toFixed(2)}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-emerald-600 dark:text-emerald-400">
                                ₹ {totalPaid.toFixed(2)}
                              </td>
                              <td
                                className={`px-4 py-3.5 font-bold ${balance > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                              >
                                ₹ {balance.toFixed(2)}
                              </td>
                            </>
                          )}

                          {/* Actions */}
                          {showActionCol && (
                            <td className="px-4 py-3.5">
                              <div className="flex items-center justify-center gap-2">
                                {can("parties", "update") && (
                                  <Link
                                    to={`/parties/edit/${party.id}`}
                                    className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 no-underline dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-500 dark:hover:text-white"
                                  >
                                    <i className="bi bi-pencil-square" /> Edit
                                  </Link>
                                )}
                                {can("parties", "delete") && (
                                  <button
                                    onClick={() => handleDelete(party.id)}
                                    className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-500 dark:hover:text-white"
                                  >
                                    <i className="bi bi-trash" /> Delete
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ── */}
              {totalPages > 1 && (
                <div className="flex justify-end mt-5">
                  <div className="flex items-center gap-1">
                    {/* Previous */}
                    <PagBtn
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left text-[11px]" />
                    </PagBtn>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        const isActive = page === currentPage;
                        const show =
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1);
                        const showLeft = page === currentPage - 2 && page > 2;
                        const showRight =
                          page === currentPage + 2 && page < totalPages - 1;
                        if (showLeft || showRight)
                          return (
                            <span
                              key={page}
                              className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm"
                            >
                              …
                            </span>
                          );
                        if (!show) return null;
                        return (
                          <PagBtn
                            key={page}
                            onClick={() => goToPage(page)}
                            active={isActive}
                          >
                            {page}
                          </PagBtn>
                        );
                      },
                    )}

                    {/* Next */}
                    <PagBtn
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right text-[11px]" />
                    </PagBtn>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Confirm Delete Modal ── */}
      <ConfirmModal
        open={Boolean(deleteId)}
        title="Confirm Delete"
        message="Are you sure you want to delete this party? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
};

/* ── Pagination Button helper ── */
const PagBtn = ({ onClick, disabled, active, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 border
      ${
        active
          ? "bg-blue-600 text-white border-blue-600 shadow-sm dark:bg-blue-500 dark:border-blue-500"
          : disabled
            ? "text-slate-300 border-slate-200 cursor-not-allowed dark:text-slate-600 dark:border-slate-700"
            : "text-slate-600 border-slate-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700"
      }`}
  >
    {children}
  </button>
);

export default PartyList;
