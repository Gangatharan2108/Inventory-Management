import { useEffect, useState } from "react";
import { createPurchase } from "../../api/purchaseService";
import API from "../../api/axios";
import { useNavigate } from "react-router-dom";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import PaymentProcessingOverlay from "../../components/common/PaymentProcessingOverlay";

const inputCls = [
  "w-full px-4 py-2.5 rounded-xl border text-sm font-medium",
  "bg-white text-slate-800 border-slate-200 placeholder:text-slate-400",
  "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
  "transition-all duration-200",
  "dark:bg-slate-700/80 dark:text-slate-100 dark:border-slate-600",
  "dark:placeholder:text-slate-500 dark:focus:border-blue-400",
].join(" ");

const labelCls =
  "block text-[12.5px] font-bold text-slate-600 dark:text-slate-300 mb-1.5 tracking-wide";

const PAY_OPTS = [
  { val: "Cash", c: "emerald", icon: "bi-cash-stack" },
  { val: "Credit", c: "orange", icon: "bi-credit-card" },
  { val: "Bank", c: "blue", icon: "bi-bank" },
  { val: "UPI", c: "violet", icon: "bi-phone" },
];

const payActive = {
  emerald:
    "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500 dark:shadow-emerald-900/20",
  orange:
    "border-orange-400 bg-orange-50 text-orange-700 shadow-orange-100 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-500 dark:shadow-orange-900/20",
  blue: "border-blue-400 bg-blue-50 text-blue-700 shadow-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500 dark:shadow-blue-900/20",
  violet:
    "border-violet-400 bg-violet-50 text-violet-700 shadow-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500 dark:shadow-violet-900/20",
};

const payDefault =
  "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/80 dark:text-slate-400 dark:hover:border-slate-500";

const SectionHeader = ({ icon, iconColor, bgColor, label }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div
      className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}
    >
      <i className={`${icon} ${iconColor} text-xs`} />
    </div>
    <span className="text-[11.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
  </div>
);

/* ══════════════════════════════════════════
   PURCHASE FORM COMPONENT
   NOTE: Purchase always uses BASE UNIT only.
   Sub-unit is only for Sales, not Purchases.
══════════════════════════════════════════ */
const PurchaseForm = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPaymentLoader, setShowPaymentLoader] = useState(false);
  const [pendingNavState, setPendingNavState] = useState(null);
  const [formData, setFormData] = useState({
    supplier: "",
    paid_amount: "",
    payment_type: "",
  });
  // Each item: { product, quantity (always in BASE unit), price }
  const [items, setItems] = useState([{ product: "", quantity: 1, price: 0 }]);

  useEffect(() => {
    API.get("parties/?type=Supplier")
      .then((res) => setSuppliers(res.data))
      .catch(() => showToast("Failed to load suppliers", "warning"));
  }, []);

  const handleSupplierChange = async (e) => {
    const sid = e.target.value;
    setFormData({ ...formData, supplier: sid });
    setItems([{ product: "", quantity: 1, price: 0 }]);
    if (!sid) {
      setProducts([]);
      return;
    }
    try {
      const res = await API.get(`products/?supplier=${sid}`);
      setProducts(res.data);
    } catch {
      showToast("Failed to load products", "warning");
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "product") {
      const sel = products.find((p) => p.id == value);
      item.product = value;
      item.price = sel?.cost_price || 0;
      item.quantity = 1;
    } else if (field === "quantity") {
      const sel = products.find((p) => p.id == item.product);
      if (sel) {
        const qty = Number(value);
        const maxAllowed =
          Number(sel.maximum_stock) - Number(sel.stock_quantity);

        if (maxAllowed <= 0) {
          showToast("Stock already reached maximum limit", "warning");
          return;
        }
        if (qty > maxAllowed) {
          showToast(
            `Maximum purchase allowed: ${maxAllowed} ${sel.unit_short_name || "units"}`,
            "warning",
          );
          return;
        }
      }
      item.quantity = value;
    } else {
      item[field] = value;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const addRow = () =>
    setItems([...items, { product: "", quantity: 1, price: 0 }]);
  const removeRow = (i) => setItems(items.filter((_, idx) => idx !== i));

  // Grand total: base qty × price
  const calculateTotal = () =>
    items.reduce((s, item) => {
      return s + Number(item.quantity) * Number(item.price);
    }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.supplier) {
      showToast("Please select supplier", "warning");
      return;
    }
    if (!formData.payment_type) {
      showToast("Select payment type", "warning");
      return;
    }
    if (items.some((i) => !i.product)) {
      showToast("Select product for all rows", "warning");
      return;
    }
    if (items.some((i) => !Number(i.quantity) || Number(i.quantity) <= 0)) {
      showToast("Enter valid quantity for all rows", "warning");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const total = calculateTotal();
      const response = await createPurchase({
        supplier: formData.supplier,
        paid_amount: Number(formData.paid_amount) || 0,
        payment_type: formData.payment_type,
        total_amount: total,
        items: items.map((item) => ({
          product: item.product,
          quantity: Number(item.quantity), // always base unit
          price: Number(item.price),
        })),
      });
      showToast("Purchase created successfully", "success");
      setPendingNavState({
        type: "purchase",
        purchaseId: response.data?.id,
        purchaseNo: response.data?.purchase_no,
        amount: total,
        paymentMode: formData.payment_type,
        supplier: suppliers.find((s) => s.id == formData.supplier)?.name,
      });
      setShowPaymentLoader(true);
    } catch (err) {
      console.error(err);
      showToast("Failed to create purchase", "error");
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = calculateTotal();
  const dueAmount = grandTotal - (Number(formData.paid_amount) || 0);

  return (
    <>
      <div className="max-w-4xl mx-auto space-y-5">
        <div className="rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <i className="bi bi-cart-plus-fill text-blue-300 text-lg" />
                </div>
                <div>
                  <h5 className="text-white font-extrabold text-[16px] tracking-wide m-0 leading-none">
                    Create Purchase
                  </h5>
                  <p className="text-slate-400 text-[12px] mt-1 m-0 font-medium">
                    Add products from a supplier to your inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/purchases")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white/70 text-[13px] font-semibold hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <i className="bi bi-arrow-left" /> Back
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="bg-white dark:bg-slate-800 p-6 transition-colors duration-300">
            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1: Purchase Info */}
              <div className="mb-7">
                <SectionHeader
                  icon="bi bi-info-circle-fill"
                  iconColor="text-blue-500"
                  bgColor="bg-blue-50 dark:bg-blue-900/30"
                  label="Purchase Info"
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Supplier */}
                  <div>
                    <label className={labelCls}>
                      <i className="bi bi-building me-1.5 text-blue-500" />{" "}
                      Supplier <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={inputCls}
                      value={formData.supplier}
                      onChange={handleSupplierChange}
                    >
                      <option value="">Select Supplier…</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Paid Amount */}
                  <div>
                    <label className={labelCls}>
                      <i className="bi bi-cash-stack me-1.5 text-blue-500" />{" "}
                      Paid Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm select-none">
                        ₹
                      </span>
                      <input
                        type="number"
                        min={0}
                        className={`${inputCls} pl-8`}
                        placeholder="0.00"
                        value={formData.paid_amount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paid_amount: e.target.value,
                          })
                        }
                      />
                    </div>
                    {formData.paid_amount && (
                      <p
                        className={`mt-1.5 text-[11.5px] font-bold flex items-center gap-1 ${dueAmount > 0 ? "text-red-500 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
                      >
                        <i
                          className={
                            dueAmount > 0
                              ? "bi bi-exclamation-circle-fill"
                              : "bi bi-check-circle-fill"
                          }
                        />
                        {dueAmount > 0
                          ? `Due: ₹ ${dueAmount.toLocaleString("en-IN")}`
                          : "Fully paid ✓"}
                      </p>
                    )}
                  </div>

                  {/* Payment Type */}
                  <div>
                    <label className={labelCls}>
                      <i className="bi bi-credit-card me-1.5 text-blue-500" />{" "}
                      Payment Type <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {PAY_OPTS.map((opt) => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() =>
                            setFormData({ ...formData, payment_type: opt.val })
                          }
                          className={[
                            "py-2 px-2 rounded-xl border-2 text-[12px] font-bold transition-all duration-200 leading-tight",
                            "flex items-center justify-center gap-1.5",
                            formData.payment_type === opt.val
                              ? `${payActive[opt.c]} shadow-md -translate-y-px`
                              : payDefault,
                          ].join(" ")}
                        >
                          <i className={`bi ${opt.icon} text-xs`} /> {opt.val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Items */}
              <div className="mb-6">
                <SectionHeader
                  icon="bi bi-bag-fill"
                  iconColor="text-indigo-500"
                  bgColor="bg-indigo-50 dark:bg-indigo-900/30"
                  label="Purchase Items"
                />

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                        {[
                          "Product",
                          "Unit",
                          "Qty",
                          "Price (₹)",
                          "Total",
                          "",
                        ].map((h, i) => (
                          <th
                            key={i}
                            className={[
                              "px-4 py-3 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400",
                              h === "Total"
                                ? "text-right"
                                : h === ""
                                  ? "w-12 text-center"
                                  : "text-left",
                            ].join(" ")}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {items.map((item, index) => {
                        const selProd = products.find(
                          (p) => p.id == item.product,
                        );

                        // Max allowed in base unit
                        const maxBaseAllowed = selProd
                          ? Number(selProd.maximum_stock) -
                            Number(selProd.stock_quantity)
                          : null;

                        const lineTotal =
                          Number(item.quantity) * Number(item.price);

                        return (
                          <tr
                            key={index}
                            className="bg-white dark:bg-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors duration-150"
                          >
                            {/* Product */}
                            <td className="px-4 py-3">
                              <select
                                className={inputCls}
                                value={item.product}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "product",
                                    e.target.value,
                                  )
                                }
                              >
                                <option value="">Select product…</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.product_name}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Unit — always base unit, read-only */}
                            <td className="px-3 py-3 w-24">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/50 text-[12px] font-bold text-blue-700 dark:text-blue-300">
                                <i className="bi bi-box-seam text-[10px]" />
                                {selProd?.unit_short_name || "—"}
                              </span>
                            </td>

                            {/* Qty */}
                            <td className="px-4 py-3 w-32">
                              <input
                                type="number"
                                step="any"
                                min={0}
                                className={inputCls}
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value,
                                  )
                                }
                              />
                              {maxBaseAllowed !== null && (
                                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                  Max:{" "}
                                  <span className="font-bold">
                                    {maxBaseAllowed} {selProd?.unit_short_name}
                                  </span>
                                </p>
                              )}
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3 w-36">
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm select-none">
                                  ₹
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  className={`${inputCls} pl-8`}
                                  value={item.price}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "price",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">
                                per {selProd?.unit_short_name || "unit"}
                              </p>
                            </td>

                            {/* Line Total */}
                            <td className="px-4 py-3 text-right">
                              <span className="font-extrabold text-slate-800 dark:text-slate-100 text-[14px]">
                                ₹ {lineTotal.toLocaleString("en-IN")}
                              </span>
                            </td>

                            {/* Remove */}
                            <td className="px-4 py-3 text-center">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeRow(index)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-sm transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/60 dark:hover:bg-red-500 dark:hover:text-white mx-auto"
                                >
                                  <i className="bi bi-x-lg text-[11px]" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button
                  type="button"
                  onClick={addRow}
                  className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-sm font-bold hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all duration-200 dark:border-blue-600/60 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <i className="bi bi-plus-circle-fill" /> Add Item
                </button>
              </div>

              {/* Grand Total Banner */}
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 shadow-lg shadow-blue-200/50 dark:shadow-blue-900/30 mb-6">
                <div>
                  <p className="text-blue-100 text-[11.5px] font-semibold uppercase tracking-widest m-0">
                    Grand Total
                  </p>
                  <p className="text-white text-[11px] mt-0.5 m-0 opacity-75">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-[28px] font-black text-white tracking-tight">
                  ₹ {grandTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => navigate("/purchases")}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700/60"
                >
                  <i className="bi bi-arrow-left" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || grandTotal === 0}
                  className="flex items-center gap-2 px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-sm font-bold shadow-md shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-200/60 hover:-translate-y-px transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:shadow-emerald-900/30"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{" "}
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle-fill" /> Save Purchase
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <PaymentProcessingOverlay
        show={showPaymentLoader}
        type="purchase"
        amount={pendingNavState?.amount || 0}
        onComplete={() => {
          setShowPaymentLoader(false);
          navigate("/payment-success", { state: pendingNavState });
        }}
      />

      <ConfirmModal
        open={showConfirm}
        title="Confirm Purchase"
        message={`Are you sure you want to save this purchase?\nGrand Total: ₹ ${grandTotal.toLocaleString("en-IN")}`}
        confirmText="Yes, Save"
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default PurchaseForm;
