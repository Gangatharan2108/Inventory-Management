import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axios";
import { adjustStock } from "../../api/stockService";

const inputCls = `
  w-full px-4 py-2.5 rounded-xl border text-sm font-medium
  bg-white text-slate-800 border-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-amber-400/25 focus:border-amber-400
  transition-all duration-200
  dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
  dark:placeholder:text-slate-500 dark:focus:border-amber-400 dark:focus:ring-amber-400/20
`.trim();

const labelCls =
  "block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

/* CF = how many subUnits in 1 baseUnit (e.g. 1 Bag = 20 Kgs, CF=20)
   To convert sub→base: qty / CF */
function toBaseQty(qty, useSubUnit, cf) {
  const q = Number(qty) || 0;
  const c = Number(cf) || 1;
  return useSubUnit ? q / c : q;
}

export default function StockAdjustmentForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [useSubUnit, setUseSubUnit] = useState(false);
  const [formData, setFormData] = useState({
    product: "",
    old_quantity: "",
    new_quantity: "",
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
    const currentBase = Number(prod?.stock_quantity) || 0;
    setFormData((prev) => ({ ...prev, product: id, old_quantity: currentBase, new_quantity: "" }));
  };

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleUnitToggle = (sub) => {
    setUseSubUnit(sub);
    const currentBase = Number(selectedProduct?.stock_quantity) || 0;
    const cf = Number(selectedProduct?.conversion_factor) || 1;
    // convert current stock to the newly selected unit for display
    const currentInNewUnit = sub ? +(currentBase * cf).toFixed(4) : currentBase;
    setFormData((prev) => ({ ...prev, old_quantity: currentInNewUnit, new_quantity: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cf = Number(selectedProduct?.conversion_factor) || 1;
      const oldBase = toBaseQty(formData.old_quantity, useSubUnit, cf);
      const newBase = toBaseQty(formData.new_quantity, useSubUnit, cf);
      await adjustStock({
        product: formData.product,
        old_quantity: oldBase,
        new_quantity: newBase,
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

  const oldQty = parseFloat(formData.old_quantity) || 0;
  const newQty = parseFloat(formData.new_quantity) || 0;
  const delta = newQty - oldQty;
  const deltaBase = toBaseQty(Math.abs(delta), useSubUnit, cf);
  const hasDelta = formData.old_quantity !== "" && formData.new_quantity !== "";

  const fmtNum = (n) => Number(n.toFixed(4)).toString();

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="bg-gradient-to-r from-amber-600 to-amber-400 dark:from-amber-800 dark:to-amber-600 px-6 py-[18px]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <i className="bi bi-arrow-repeat text-white text-lg" />
            </div>
            <div>
              <h5 className="text-white font-bold text-[15px] tracking-wide m-0 leading-none">Stock Adjustment</h5>
              <p className="text-amber-100 text-[11px] mt-0.5 m-0 font-medium">Manually correct current stock quantity</p>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-100 dark:border-amber-800/40 px-6 py-3 flex items-center gap-2">
          <i className="bi bi-info-circle text-amber-500 dark:text-amber-400 text-sm" />
          <span className="text-[12px] text-amber-700 dark:text-amber-400 font-medium">
            Use this to correct stock discrepancies found during physical count.
          </span>
        </div>

        <div className="bg-white dark:bg-slate-800 px-6 py-7 transition-colors duration-300">
          <form onSubmit={handleSubmit} noValidate>

            {/* Product */}
            <div className="mb-5">
              <label className={labelCls}><i className="bi bi-box me-1.5 text-amber-500" />Product <span className="text-red-500 ml-0.5">*</span></label>
              <select name="product" className={inputCls} value={formData.product} onChange={handleProductChange} required>
                <option value="">Select a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.product_name}</option>
                ))}
              </select>
            </div>

            {/* Unit toggle */}
            {selectedProduct && hasSubUnit && (
              <div className="mb-4 p-3.5 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/40">
                <p className="text-[11.5px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Enter quantities in:</p>
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
                <p className="text-[11px] text-violet-600 dark:text-violet-400 font-medium">
                  1 {selectedProduct.unit_short_name} = {selectedProduct.conversion_factor} {selectedProduct.sub_unit_short_name}
                  {" · "}Current stock:{" "}
                  <span className="font-bold">{currentDisplayStock} {unitLabel}</span>
                </p>
              </div>
            )}

            {selectedProduct && !hasSubUnit && (
              <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-4">
                Current stock: <span className="font-semibold text-slate-700 dark:text-slate-200">{currentBaseStock} {selectedProduct.unit_short_name}</span>
              </p>
            )}

            {/* Qty row */}
            <div className="grid grid-cols-2 gap-4 mb-2">
              <div>
                <label className={labelCls}>
                  <i className="bi bi-archive me-1.5 text-amber-500" />
                  Current Qty {unitLabel && <span className="text-slate-400 font-normal">({unitLabel})</span>} <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input type="number" name="old_quantity" min="0" step="any" className={inputCls} placeholder="e.g. 50" value={formData.old_quantity} onChange={handleChange} required />
              </div>
              <div>
                <label className={labelCls}>
                  <i className="bi bi-arrow-right-circle me-1.5 text-amber-500" />
                  New Qty {unitLabel && <span className="text-slate-400 font-normal">({unitLabel})</span>} <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input type="number" name="new_quantity" min="0" step="any" className={inputCls} placeholder="e.g. 45" value={formData.new_quantity} onChange={handleChange} required />
              </div>
            </div>

            {/* Live delta */}
            {hasDelta && (
              <div className="mb-5 mt-2">
                <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border text-[12.5px] font-semibold
                  ${delta === 0
                    ? "bg-slate-50 border-slate-200 text-slate-500 dark:bg-slate-700/40 dark:border-slate-600 dark:text-slate-400"
                    : delta > 0
                      ? "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-700 dark:text-emerald-400"
                      : "bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400"}`}>
                  <i className={`bi text-base ${delta === 0 ? "bi-dash-circle" : delta > 0 ? "bi-arrow-up-circle-fill" : "bi-arrow-down-circle-fill"}`} />
                  <span>
                    {delta === 0
                      ? "No change in quantity"
                      : `Stock will ${delta > 0 ? "increase" : "decrease"} by ${fmtNum(Math.abs(delta))} ${unitLabel}${hasSubUnit ? ` (= ${fmtNum(deltaBase)} ${selectedProduct.unit_short_name})` : ""} (${oldQty} → ${newQty})`}
                  </span>
                </div>
              </div>
            )}

            {/* Reason */}
            <div className="mb-7">
              <label className={labelCls}><i className="bi bi-chat-text me-1.5 text-amber-500" />Reason <span className="text-red-500 ml-0.5">*</span></label>
              <textarea name="reason" rows={4} className={`${inputCls} resize-none`}
                placeholder="Explain why the stock is being adjusted (e.g. physical count mismatch, theft, return from customer…)"
                value={formData.reason} onChange={handleChange} required />
              <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Reason will be logged in the activity history</p>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 mb-6" />

            <div className="flex items-center justify-between gap-3">
              <button type="button" onClick={() => navigate("/products")}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                <i className="bi bi-arrow-left" /> Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:bg-amber-500 dark:hover:bg-amber-400">
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Adjusting…</>
                ) : (
                  <><i className="bi bi-arrow-repeat" />Adjust Stock</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
