import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { addDamagedStock } from "../../api/stockService";

const inputCls = `
  w-full px-4 py-2.5 rounded-xl border text-sm font-medium
  bg-white text-slate-800 border-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-red-400/25 focus:border-red-400
  transition-all duration-200
  dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
  dark:placeholder:text-slate-500 dark:focus:border-red-400 dark:focus:ring-red-400/20
`.trim();

const labelCls =
  "block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

/* CF = how many subUnits in 1 baseUnit (e.g. 1 Bag = 20 Kgs, CF=20)
   Damaged qty in sub unit → divide by CF to get base */
function toBaseQty(qty, useSubUnit, cf) {
  const q = Number(qty) || 0;
  const c = Number(cf) || 1;
  return useSubUnit ? q / c : q;
}

export default function DamagedStockForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [useSubUnit, setUseSubUnit] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    quantity: "",
    reason: "",
  });

  useEffect(() => {
    API.get("products/").then((res) => setProducts(res.data));
  }, []);

  const handleProductChange = (e) => {
    const id = e.target.value;
    const prod = products.find((p) => p.id == id) || null;
    setSelectedProduct(prod);
    setUseSubUnit(false);
    setFormData((prev) => ({ ...prev, product: id, quantity: "" }));
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUnitToggle = (sub) => {
    setUseSubUnit(sub);
    setFormData((prev) => ({ ...prev, quantity: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cf = Number(selectedProduct?.conversion_factor) || 1;
      const baseQty = toBaseQty(formData.quantity, useSubUnit, cf);
      await addDamagedStock({
        product: formData.product,
        quantity: baseQty,
        reason: formData.reason,
      });
      navigate("/products");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const cf = Number(selectedProduct?.conversion_factor) || 1;
  const hasSubUnit = Boolean(selectedProduct?.sub_unit && selectedProduct?.sub_unit_short_name);
  const currentBaseStock = Number(selectedProduct?.stock_quantity) || 0;
  const currentDisplayStock = useSubUnit ? +(currentBaseStock * cf).toFixed(4) : currentBaseStock;
  const unitLabel = useSubUnit ? selectedProduct?.sub_unit_short_name : selectedProduct?.unit_short_name;

  const qty = parseFloat(formData.quantity) || 0;
  const baseQtyRemoved = toBaseQty(qty, useSubUnit, cf);

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="bg-gradient-to-r from-red-700 to-red-500 dark:from-red-900 dark:to-red-700 px-6 py-[18px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <i className="bi bi-exclamation-triangle text-white text-lg" />
            </div>
            <div>
              <h5 className="text-white font-bold text-[15px] tracking-wide m-0 leading-none">Add Damaged Stock</h5>
              <p className="text-red-200 text-[11px] mt-0.5 m-0 font-medium">Record stock that is damaged or unusable</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-800/40 px-6 py-3 flex items-center gap-2">
          <i className="bi bi-info-circle text-red-500 dark:text-red-400 text-sm" />
          <span className="text-[12px] text-red-600 dark:text-red-400 font-medium">
            This will permanently reduce the available stock quantity.
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 px-6 py-7 transition-colors duration-300">
          <form onSubmit={handleSubmit} noValidate>

            {/* Product */}
            <div className="mb-5">
              <label className={labelCls}><i className="bi bi-box me-1.5 text-red-500" />Product <span className="text-red-500 ml-0.5">*</span></label>
              <select name="product" className={inputCls} value={formData.product} onChange={handleProductChange} required>
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.product_name}</option>
                ))}
              </select>
            </div>

            {/* Unit toggle for sub-unit products */}
            {selectedProduct && hasSubUnit && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/40">
                <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Enter damaged quantity in:</p>
                <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 text-[12px] font-bold w-fit mb-2">
                  <button type="button" onClick={() => handleUnitToggle(false)}
                    className={`px-4 py-1.5 transition-colors ${!useSubUnit ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                    {selectedProduct.unit_short_name}
                  </button>
                  <button type="button" onClick={() => handleUnitToggle(true)}
                    className={`px-4 py-1.5 transition-colors ${useSubUnit ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400"}`}>
                    {selectedProduct.sub_unit_short_name}
                  </button>
                </div>
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                  1 {selectedProduct.unit_short_name} = {selectedProduct.conversion_factor} {selectedProduct.sub_unit_short_name}
                  {" · "}Available stock:{" "}
                  <span className="font-bold">{currentDisplayStock} {unitLabel}</span>
                </p>
              </div>
            )}

            {selectedProduct && !hasSubUnit && (
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                Available stock: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBaseStock} {selectedProduct.unit_short_name}</span>
              </p>
            )}

            {/* Quantity */}
            <div className="mb-5">
              <label className={labelCls}>
                <i className="bi bi-hash me-1.5 text-red-500" />
                Damaged Quantity {unitLabel && <span className="text-slate-400 font-normal">({unitLabel})</span>} <span className="text-red-500 ml-0.5">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                min="0.0001"
                step="any"
                className={inputCls}
                placeholder="Enter quantity to mark as damaged"
                value={formData.quantity}
                onChange={handleChange}
                required
              />
              {qty > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <span className="flex items-center gap-1 font-semibold text-[12px] px-2.5 py-1 rounded-full bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 w-fit">
                    <i className="bi bi-dash-circle-fill text-[10px]" />
                    {qty} {unitLabel} will be removed from stock
                  </span>
                  {hasSubUnit && useSubUnit && (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 pl-1">
                      = {+(baseQtyRemoved).toFixed(4).replace(/\.?0+$/, "")} {selectedProduct.unit_short_name} (base unit)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Reason */}
            <div className="mb-7">
              <label className={labelCls}><i className="bi bi-chat-text me-1.5 text-red-500" />Reason <span className="text-red-500 ml-0.5">*</span></label>
              <textarea name="reason" rows={4} className={`${inputCls} resize-none`}
                placeholder="Describe why this stock is damaged (e.g. broken during transit, expired, water damage…)"
                value={formData.reason} onChange={handleChange} required />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
                Minimum 10 characters recommended for audit trail
              </p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 mb-6" />

            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => navigate("/products")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <i className="bi bi-arrow-left" /> Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:bg-red-500 dark:hover:bg-red-400">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving…</>
                ) : (
                  <><i className="bi bi-exclamation-triangle-fill" />Mark as Damaged</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
