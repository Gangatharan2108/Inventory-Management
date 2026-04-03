import { useState, useEffect, useMemo } from "react";
import { getProducts, deleteProduct } from "../../api/productService";
import { getCategories } from "../../api/categoryService";
import { Link } from "react-router-dom";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import { usePermission } from "../../hooks/usePermission";

const inputCls = `
  w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium
  bg-white text-slate-800 border-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
  transition-all duration-200
  dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
  dark:placeholder:text-slate-500 dark:focus:border-blue-400
`.trim();

const labelCls =
  "block text-[12.5px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

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

/* ─────────────────────────────────────────────────────
   Stock cell: shows sub_unit stock by default (if exists),
   with a tiny toggle to switch to base unit
───────────────────────────────────────────────────── */
const StockCell = ({ product }) => {
  const hasSubUnit = Boolean(product.sub_unit && product.sub_unit_short_name);
  // default: show sub_unit if available
  const [showBase, setShowBase] = useState(false);

  const cf = Number(product.conversion_factor) || 1;
  const baseStock = Number(product.stock_quantity) || 0;
  const subStock = cf > 0 ? baseStock * cf : 0;

  const isLow = baseStock <= product.minimum_stock;

  if (!hasSubUnit) {
    return (
      <span className={`font-bold text-base ${isLow ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}>
        {baseStock}
      </span>
    );
  }

  const displayQty = showBase ? baseStock : +subStock.toFixed(4);
  const displayUnit = showBase ? product.unit_short_name : product.sub_unit_short_name;

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`font-bold text-base ${isLow ? "text-red-500 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}>
        {displayQty}
      </span>
      {/* Unit toggle pill */}
      <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-600 text-[10px] font-bold">
        <button
          type="button"
          onClick={() => setShowBase(false)}
          className={`px-2 py-0.5 transition-colors ${!showBase ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
        >
          {product.sub_unit_short_name}
        </button>
        <button
          type="button"
          onClick={() => setShowBase(true)}
          className={`px-2 py-0.5 transition-colors ${showBase ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600"}`}
        >
          {product.unit_short_name}
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PRODUCT LIST
═══════════════════════════════════════════════════════ */
const ProductList = () => {
  const { showToast } = useToast();
  const { can } = usePermission();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;
  const showActionCol = can("products", "update") || can("products", "delete");

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await getProducts();
      setProducts(res.data || []);
      setFilteredProducts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleGenerate = () => {
    const filtered = products.filter((p) => {
      const matchSearch =
        p.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        p.supplier_name?.toLowerCase().includes(search.toLowerCase());
      const matchCat =
        selectedCategory === "" || p.category === Number(selectedCategory);
      return matchSearch && matchCat;
    });
    setFilteredProducts(filtered);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearch("");
    setSelectedCategory("");
    setFilteredProducts(products);
    setCurrentPage(1);
  };

  const handleDelete = (id) => setDeleteId(id);
  const confirmDelete = async () => {
    try {
      await deleteProduct(deleteId);
      showToast("Product deleted successfully", "success");
      fetchProducts();
    } catch {
      showToast("Failed to delete product", "error");
    } finally {
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);
  const goToPage = (p) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

  const exportToExcel = async () => {
    if (!filteredProducts.length) return;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Products");
    ws.columns = [
      { header: "#", key: "index", width: 5 },
      { header: "Product", key: "product", width: 25 },
      { header: "Supplier", key: "supplier", width: 25 },
      { header: "Category", key: "category", width: 20 },
      { header: "Cost Price", key: "cost", width: 15 },
      { header: "Selling Price", key: "selling", width: 15 },
      { header: "Stock (Base)", key: "stock", width: 12 },
      { header: "Base Unit", key: "unit", width: 10 },
      { header: "Sub Unit", key: "subunit", width: 10 },
      { header: "Conversion", key: "cf", width: 14 },
    ];
    filteredProducts.forEach((p, i) =>
      ws.addRow({
        index: i + 1,
        product: p.product_name,
        supplier: p.supplier_name || "-",
        category: p.category_name,
        cost: p.cost_price,
        selling: p.selling_price,
        stock: p.stock_quantity,
        unit: p.unit_short_name || "-",
        subunit: p.sub_unit_short_name || "-",
        cf: p.sub_unit ? `1 ${p.unit_short_name} = ${p.conversion_factor} ${p.sub_unit_short_name}` : "-",
      }),
    );
    ws.getRow(1).font = { bold: true };
    ws.getRow(1).alignment = { horizontal: "center" };
    ws.getColumn("cost").numFmt = "₹#,##0.00";
    ws.getColumn("selling").numFmt = "₹#,##0.00";
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "Product_List.xlsx");
  };

  const fmtCurrency = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(v || 0);

  return (
    <>
      <div className="space-y-5">
        {/* ════ FILTER CARD ════ */}
        <div className="rounded-[20px] overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-slate-200/80 dark:border-slate-700/60 bg-white dark:bg-slate-800 transition-colors duration-300">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
              <i className="bi bi-funnel text-blue-500 text-sm" />
            </div>
            <span className="text-[14px] font-bold text-slate-700 dark:text-slate-200">
              Filter Products
            </span>
          </div>

          <div className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
              <div className="lg:col-span-2">
                <label className={labelCls}>
                  <i className="bi bi-search me-1 text-blue-500" /> Search
                </label>
                <input
                  type="text"
                  className={inputCls}
                  placeholder="Product name or supplier…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
                />
              </div>

              <div>
                <label className={labelCls}>
                  <i className="bi bi-tags me-1 text-blue-500" /> Category
                </label>
                <select
                  className={inputCls}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleGenerate}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 dark:bg-blue-500 dark:hover:bg-blue-400"
              >
                <i className="bi bi-funnel-fill" /> Filter
              </button>

              <button
                onClick={handleClear}
                className="flex items-center justify-center gap-1.5 w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-100 hover:border-slate-400 text-sm font-semibold transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <i className="bi bi-x-circle" /> Clear
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={exportToExcel}
                disabled={filteredProducts.length === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-600 hover:text-white hover:border-emerald-600 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-600 dark:hover:text-white"
              >
                <i className="bi bi-file-earmark-excel" /> Export Excel
              </button>
            </div>
          </div>
        </div>

        {/* ════ TABLE CARD ════ */}
        <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
            <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2 m-0">
              <i className="bi bi-box-seam text-blue-300" /> Product List
              <span className="ml-2 text-[11px] font-semibold bg-white/10 text-white/80 px-2.5 py-0.5 rounded-full">
                {filteredProducts.length} items
              </span>
            </h5>
            {can("products", "create") && (
              <Link
                to="/products/create"
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-400 text-white text-[13px] font-semibold px-4 py-2 rounded-xl transition-all duration-200 no-underline shadow-sm hover:shadow-md hover:-translate-y-px"
              >
                <i className="bi bi-plus-circle" /> Add Product
              </Link>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin dark:border-slate-600 dark:border-t-blue-400" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading products…</p>
              </div>
            ) : paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-500">
                <i className="bi bi-box-seam text-5xl opacity-30" />
                <p className="text-base font-semibold m-0">No Products Found</p>
                <p className="text-sm m-0 opacity-70">Try adjusting your filters or add a new product</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-center border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/60 border-b border-slate-200 dark:border-slate-600">
                        {[
                          "No", "Image", "Product", "Category",
                          "Cost", "Selling", "Stock", "Status", "Supplier",
                          ...(showActionCol ? ["Action"] : []),
                        ].map((h) => (
                          <th key={h} className="px-4 py-3 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {paginatedData.map((product, index) => {
                        const isLow = product.stock_quantity <= product.minimum_stock;
                        return (
                          <tr
                            key={product.id}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150"
                          >
                            <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </td>

                            <td className="px-4 py-3">
                              <img
                                src={product.image || "https://via.placeholder.com/50"}
                                alt={product.product_name}
                                className="w-12 h-12 rounded-xl object-cover mx-auto shadow-sm border border-slate-100 dark:border-slate-600"
                              />
                            </td>

                            <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-100 text-left">
                              <div>{product.product_name}</div>
                              {/* Show conversion info below name if sub_unit set */}
                              {product.sub_unit && (
                                <div className="text-[10px] text-violet-500 dark:text-violet-400 font-medium mt-0.5">
                                  1 {product.unit_short_name} = {product.conversion_factor} {product.sub_unit_short_name}
                                </div>
                              )}
                            </td>

                            <td className="px-4 py-3.5">
                              <span className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-[11px] font-semibold px-2.5 py-1 rounded-lg">
                                {product.category_name}
                              </span>
                            </td>

                            <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300 font-medium">
                              {fmtCurrency(product.cost_price)}
                            </td>

                            <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-slate-100">
                              {fmtCurrency(product.selling_price)}
                            </td>

                            {/* Stock with unit toggle */}
                            <td className="px-4 py-3.5">
                              <StockCell product={product} />
                            </td>

                            <td className="px-4 py-3.5">
                              {isLow ? (
                                <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                                  Low Stock
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-full">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                                  Available
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                              {product.supplier_name || "—"}
                            </td>

                            {showActionCol && (
                              <td className="px-4 py-3.5">
                                <div className="flex items-center justify-center gap-2">
                                  {can("products", "update") && (
                                    <Link
                                      to={`/products/edit/${product.id}`}
                                      className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-500 hover:text-white hover:border-amber-500 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all duration-200 no-underline dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700 dark:hover:bg-amber-500 dark:hover:text-white"
                                    >
                                      <i className="bi bi-pencil" /> Edit
                                    </Link>
                                  )}
                                  {can("products", "delete") && (
                                    <button
                                      onClick={() => handleDelete(product.id)}
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

                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 dark:border-slate-700">
                    <span className="text-[12px] text-slate-400 dark:text-slate-500">
                      Showing {(currentPage - 1) * itemsPerPage + 1}–
                      {Math.min(currentPage * itemsPerPage, filteredProducts.length)}{" "}
                      of {filteredProducts.length}
                    </span>
                    <div className="flex items-center gap-1">
                      <PagBtn onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
                        <i className="bi bi-chevron-left text-[11px]" />
                      </PagBtn>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        const show = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
                        const showEllipsisL = page === currentPage - 2 && page > 2;
                        const showEllipsisR = page === currentPage + 2 && page < totalPages - 1;
                        if (showEllipsisL || showEllipsisR)
                          return <span key={page} className="w-9 h-9 flex items-center justify-center text-slate-400 text-sm">…</span>;
                        if (!show) return null;
                        return (
                          <PagBtn key={page} onClick={() => goToPage(page)} active={page === currentPage}>
                            {page}
                          </PagBtn>
                        );
                      })}
                      <PagBtn onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
                        <i className="bi bi-chevron-right text-[11px]" />
                      </PagBtn>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Confirm Delete"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteId(null)}
      />
    </>
  );
};

export default ProductList;
