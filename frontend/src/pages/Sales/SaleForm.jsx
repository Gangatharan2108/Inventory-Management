import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getProducts } from "../../api/productService";
import { getParties, createParty } from "../../api/partyService";
import { createSale } from "../../api/saleService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";
import { AuthContext } from "../../context/AuthContext";
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
  { val: "Credit Card", c: "blue", icon: "bi-credit-card" },
  { val: "UPI", c: "violet", icon: "bi-phone" },
  { val: "Net Banking", c: "cyan", icon: "bi-bank" },
];

const payActive = {
  emerald: "border-emerald-400 bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-500 dark:shadow-emerald-900/20",
  blue: "border-blue-400 bg-blue-50 text-blue-700 shadow-md shadow-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-500 dark:shadow-blue-900/20",
  violet: "border-violet-400 bg-violet-50 text-violet-700 shadow-md shadow-violet-100 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-500 dark:shadow-violet-900/20",
  cyan: "border-cyan-400 bg-cyan-50 text-cyan-700 shadow-md shadow-cyan-100 dark:bg-cyan-900/20 dark:text-cyan-400 dark:border-cyan-500 dark:shadow-cyan-900/20",
};

const payDefault =
  "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700/80 dark:text-slate-400 dark:hover:border-slate-500";

const SectionHeader = ({ icon, iconColor, bgColor, label }) => (
  <div className="flex items-center gap-2.5 mb-5">
    <div className={`w-7 h-7 rounded-lg ${bgColor} flex items-center justify-center shrink-0`}>
      <i className={`${icon} ${iconColor} text-xs`} />
    </div>
    <span className="text-[11.5px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700" />
  </div>
);

/* ─────────────────────────────────────────────────
   Helper: compute actual base-unit quantity
───────────────────────────────────────────────── */
function toBaseQty(userQty, useSubUnit, conversionFactor) {
  const qty = Number(userQty) || 0;
  const cf = Number(conversionFactor) || 1;
  // CF = how many subUnits in 1 baseUnit (e.g. 1 Bag = 20 Kgs → CF=20)
  // selling in sub unit (Kgs): divide by CF to get base (Bags)
  return useSubUnit ? qty / cf : qty;
}

/* ══════════════════════════════════════════
   SALE FORM COMPONENT
══════════════════════════════════════════ */
export default function SaleForm() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useContext(AuthContext);

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showPaymentLoader, setShowPaymentLoader] = useState(false);
  const [pendingNavState, setPendingNavState] = useState(null);

  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const newCustInputRef = useRef(null);

  const [formData, setFormData] = useState({
    customer: "",
    payment_mode: "Cash",
  });
  // Each item: { product, quantity (user-visible), useSubUnit (bool), price }
  const [items, setItems] = useState([{ product: "", quantity: 1, useSubUnit: false, price: 0 }]);

  useEffect(() => {
    (async () => {
      try {
        const [custRes, prodRes] = await Promise.all([getParties("Customer"), getProducts()]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (err) {
        console.error(err);
        showToast("Failed to load data", "warning");
      }
    })();
  }, []);

  const handleFormChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleCustomerChange = (e) => {
    const val = e.target.value;
    if (val === "__new__") {
      setIsNewCustomer(true);
      setNewCustomerName("");
      setFormData({ ...formData, customer: "" });
      setTimeout(() => newCustInputRef.current?.focus(), 50);
    } else {
      setIsNewCustomer(false);
      setNewCustomerName("");
      setFormData({ ...formData, customer: val });
    }
  };

  const cancelNewCustomer = () => {
    setIsNewCustomer(false);
    setNewCustomerName("");
    setFormData({ ...formData, customer: "" });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "product") {
      const sel = products.find((p) => p.id == value);
      item.product = value;
      item.price = sel?.selling_price || 0;
      item.useSubUnit = Boolean(sel?.sub_unit);
      item.quantity = 1;

    } else if (field === "useSubUnit") {
      item.useSubUnit = value;
      item.quantity = 1;

    } else if (field === "quantity") {
      const sel = products.find((p) => p.id == item.product);
      if (sel) {
        // Validate based on active unit type (base or sub)
        const activeUnitType = item.useSubUnit ? sel.sub_unit_type : sel.unit_type;
        if (activeUnitType === "Integer") {
          const parsed = Number(value);
          if (!Number.isInteger(parsed) || parsed < 0) {
            const unitLabel = item.useSubUnit ? sel.sub_unit_short_name : sel.unit_short_name;
            showToast(`${unitLabel} unit only allows whole numbers (1, 2, 3…)`, "warning");
            return;
          }
        }
        const cf = Number(sel.conversion_factor) || 1;
        const baseQtyEntered = item.useSubUnit
          ? Number(value) / cf
          : Number(value);

        const availableBase = Number(sel.stock_quantity);
        if (baseQtyEntered > availableBase) {
          const maxInUserUnit = item.useSubUnit
            ? +(availableBase * cf).toFixed(4)
            : availableBase;
          const unitLabel = item.useSubUnit ? sel.sub_unit_short_name : sel.unit_short_name;
          showToast(`Only ${maxInUserUnit} ${unitLabel} available in stock`, "warning");
          return;
        }
      }
      item.quantity = value;

    } else if (field === "price") {
      item.price = Number(value);
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () =>
    setItems([...items, { product: "", quantity: 1, useSubUnit: false, price: 0 }]);
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const calculateTotal = () =>
    items.reduce((sum, item) => {
      const sel = products.find((p) => p.id == item.product);
      const baseQty = toBaseQty(item.quantity, item.useSubUnit, sel?.conversion_factor);
      return sum + baseQty * Number(item.price);
    }, 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isNewCustomer && !newCustomerName.trim()) {
      showToast("Please enter the new customer name", "warning");
      newCustInputRef.current?.focus();
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
      let customerId = formData.customer;
      let customerDisplayName = customers.find((c) => c.id == customerId)?.name;

      if (isNewCustomer && newCustomerName.trim()) {
        const partyRes = await createParty({
          name: newCustomerName.trim(),
          party_type: "Customer",
          phone: "",
          email: "",
          address: "",
        });
        customerId = partyRes.data.id;
        customerDisplayName = partyRes.data.name;
        setCustomers((prev) => [...prev, partyRes.data]);
        showToast(`New customer "${partyRes.data.name}" added to Parties`, "info");
      }

      const total = calculateTotal();
      const response = await createSale({
        customer: customerId || null,
        worker: user?.id,
        payment_mode: formData.payment_mode,
        total_amount: total,
        items: items.map((item) => {
          const sel = products.find((p) => p.id == item.product);
          const baseQty = toBaseQty(item.quantity, item.useSubUnit, sel?.conversion_factor);
          return {
            product: item.product,
            quantity: baseQty,          // ← always base unit qty to backend
            per_item_price: item.price,
          };
        }),
      });

      showToast("Sale created successfully", "success");
      setPendingNavState({
        type: "sale",
        saleId: response.data?.id,
        invoiceNo: response.data?.invoice_no,
        amount: total,
        paymentMode: formData.payment_mode,
        customer: customerDisplayName,
      });
      setShowPaymentLoader(true);
    } catch (err) {
      console.error(err);
      showToast("Failed to create sale", "error");
    } finally {
      setLoading(false);
    }
  };

  const grandTotal = calculateTotal();

  return (
    <>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="rounded-2xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.4)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center shrink-0">
                  <i className="bi bi-receipt-cutoff text-blue-300 text-lg" />
                </div>
                <div>
                  <h5 className="text-white font-extrabold text-[16px] tracking-wide m-0 leading-none">Create Sale</h5>
                  <p className="text-slate-400 text-[12px] mt-1 m-0 font-medium">Add products and generate a sales invoice</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/sales")}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/20 text-white/70 text-[13px] font-semibold hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <i className="bi bi-arrow-left" /> Back
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="bg-white dark:bg-slate-800 p-6 transition-colors duration-300">
            <form onSubmit={handleSubmit} noValidate>
              {/* Section 1: Sale Info */}
              <div className="mb-7">
                <SectionHeader icon="bi bi-person-fill" iconColor="text-blue-500" bgColor="bg-blue-50 dark:bg-blue-900/30" label="Sale Info" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Customer */}
                  <div>
                    <label className={labelCls}><i className="bi bi-person-check me-1.5 text-blue-500" /> Customer <span className="text-red-500">*</span></label>
                    {!isNewCustomer && (
                      <select name="customer" className={inputCls} value={formData.customer} onChange={handleCustomerChange} required={!isNewCustomer}>
                        <option value="">Select Customer…</option>
                        {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        <option value="__new__">＋ Add New Customer</option>
                      </select>
                    )}
                    {isNewCustomer && (
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <i className="bi bi-person-plus-fill absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm pointer-events-none" />
                            <input
                              ref={newCustInputRef}
                              type="text"
                              className={`${inputCls} pl-9`}
                              placeholder="Type new customer name…"
                              value={newCustomerName}
                              onChange={(e) => setNewCustomerName(e.target.value)}
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={cancelNewCustomer}
                            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-red-500 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200 shrink-0"
                          >
                            <i className="bi bi-x-lg text-xs" />
                          </button>
                        </div>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <i className="bi bi-info-circle" /> Customer will be saved to Parties after sale
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Worker */}
                  <div>
                    <label className={labelCls}><i className="bi bi-person-badge me-1.5 text-blue-500" /> Worker</label>
                    <div className={`${inputCls} flex items-center gap-2.5 cursor-default select-none bg-slate-50 dark:bg-slate-700/40 border-slate-200 dark:border-slate-600`}>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <span className="text-white text-[10px] font-black">{(user?.first_name || user?.username || "U").charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="font-semibold text-slate-700 dark:text-slate-200 truncate flex-1">
                        {user?.first_name ? `${user.first_name} ${user.last_name || ""}`.trim() : user?.username || "—"}
                      </span>
                      <span className="shrink-0 text-[10px] bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-0.5 rounded-full font-bold">You</span>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div>
                    <label className={labelCls}><i className="bi bi-wallet2 me-1.5 text-blue-500" /> Payment Mode</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      {PAY_OPTS.map((opt) => (
                        <button
                          key={opt.val} type="button"
                          onClick={() => setFormData({ ...formData, payment_mode: opt.val })}
                          className={[
                            "py-2 px-2 rounded-xl border-2 text-[11px] font-bold transition-all duration-200 leading-tight",
                            "flex items-center justify-center gap-1.5",
                            formData.payment_mode === opt.val ? `${payActive[opt.c]} -translate-y-px` : payDefault,
                          ].join(" ")}
                        >
                          <i className={`bi ${opt.icon} text-xs`} /> {opt.val}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Sale Items */}
              <div className="mb-6">
                <SectionHeader icon="bi bi-cart3" iconColor="text-indigo-500" bgColor="bg-indigo-50 dark:bg-indigo-900/30" label="Sale Items" />

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                        {[
                          { label: "Product", align: "left" },
                          { label: "Unit", align: "left", w: "w-28" },
                          { label: "Qty", align: "left", w: "w-28" },
                          { label: "Price (₹)", align: "left", w: "w-32" },
                          { label: "Total", align: "right", w: "w-32" },
                          { label: "", align: "center", w: "w-12" },
                        ].map((h, i) => (
                          <th key={i} className={["px-4 py-3 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400", h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : "text-left", h.w || ""].join(" ")}>
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {items.map((item, index) => {
                        const selProd = products.find((p) => p.id == item.product);
                        const hasSubUnit = Boolean(selProd?.sub_unit && selProd?.sub_unit_short_name);
                        const cf = Number(selProd?.conversion_factor) || 1;

                        const availableBase = Number(selProd?.stock_quantity) || 0;
                        const maxInUserUnit = selProd
                          ? (item.useSubUnit ? +(availableBase * cf).toFixed(4) : availableBase)
                          : null;
                        const unitLabel = item.useSubUnit ? selProd?.sub_unit_short_name : selProd?.unit_short_name;
                        // Active unit type controls step & validation in the qty input
                        const activeUnitType = item.useSubUnit ? selProd?.sub_unit_type : selProd?.unit_type;

                        const baseQty = toBaseQty(item.quantity, item.useSubUnit, cf);
                        const lineTotal = baseQty * Number(item.price);

                        return (
                          <tr key={index} className="bg-white dark:bg-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors duration-150">
                            {/* Product */}
                            <td className="px-4 py-3">
                              <select
                                className={inputCls}
                                value={item.product}
                                onChange={(e) => handleItemChange(index, "product", e.target.value)}
                              >
                                <option value="">Select product…</option>
                                {products.map((p) => {
                                  const pCf = Number(p.conversion_factor) || 1;
                                  const pBase = Number(p.stock_quantity) || 0;
                                  const stockLabel = p.sub_unit_short_name
                                    ? `${pBase} ${p.unit_short_name} / ${+(pBase * pCf).toFixed(2)} ${p.sub_unit_short_name}`
                                    : `${pBase} ${p.unit_short_name}`;
                                  return (
                                    <option key={p.id} value={p.id}>
                                      {p.product_name} — Stock: {stockLabel}
                                    </option>
                                  );
                                })}
                              </select>
                            </td>

                            {/* Unit toggle */}
                            <td className="px-3 py-3">
                              {hasSubUnit ? (
                                <div className="flex flex-col gap-1">
                                  <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-slate-600 text-[11px] font-bold">
                                    <button
                                      type="button"
                                      onClick={() => handleItemChange(index, "useSubUnit", true)}
                                      className={`flex-1 py-1.5 px-2 transition-colors ${item.useSubUnit ? "bg-violet-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600"}`}
                                    >
                                      {selProd?.sub_unit_short_name}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleItemChange(index, "useSubUnit", false)}
                                      className={`flex-1 py-1.5 px-2 transition-colors ${!item.useSubUnit ? "bg-blue-600 text-white" : "bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-600"}`}
                                    >
                                      {selProd?.unit_short_name}
                                    </button>
                                  </div>
                                  {item.useSubUnit && (
                                    <p className="text-[10px] text-violet-500 dark:text-violet-400 font-medium text-center">
                                      1 {selProd?.unit_short_name} = {cf} {selProd?.sub_unit_short_name}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[12px] text-slate-500 dark:text-slate-400 font-semibold">
                                  {selProd?.unit_short_name || "—"}
                                </span>
                              )}
                            </td>

                            {/* Qty */}
                            <td className="px-4 py-3">
                              <input
                                type="number"
                                step={activeUnitType === "Integer" ? "1" : "any"}
                                min={activeUnitType === "Integer" ? 1 : 0}
                                max={maxInUserUnit || undefined}
                                className={inputCls}
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              />
                              {maxInUserUnit !== null && (
                                <p className="text-[10.5px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                                  Max: <span className="font-bold">{maxInUserUnit} {unitLabel}</span>
                                </p>
                              )}
                              {/* Converted qty hint */}
                              {hasSubUnit && item.useSubUnit && Number(item.quantity) > 0 && (
                                <p className="text-[10px] text-violet-500 dark:text-violet-400 mt-0.5 font-semibold">
                                  = {+(Number(item.quantity) / cf).toFixed(4)} {selProd?.unit_short_name}
                                </p>
                              )}
                            </td>

                            {/* Price */}
                            <td className="px-4 py-3">
                              <div className="relative">
                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-sm select-none">₹</span>
                                <input
                                  type="number"
                                  min={0}
                                  className={`${inputCls} pl-8`}
                                  value={item.price}
                                  onChange={(e) => handleItemChange(index, "price", e.target.value)}
                                />
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1">per {selProd?.unit_short_name || "unit"}</p>
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
                                  onClick={() => removeItem(index)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/60 dark:hover:bg-red-500 dark:hover:text-white mx-auto"
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
                  onClick={addItem}
                  className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 text-sm font-bold hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all duration-200 dark:border-blue-600/60 dark:text-blue-400 dark:hover:bg-blue-900/20"
                >
                  <i className="bi bi-plus-circle-fill" /> Add Item
                </button>
              </div>

              {/* Grand Total */}
              <div className="flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-700 dark:to-teal-700 shadow-lg shadow-emerald-200/50 dark:shadow-emerald-900/30 mb-6">
                <div>
                  <p className="text-emerald-100 text-[11.5px] font-semibold uppercase tracking-widest m-0">Grand Total</p>
                  <p className="text-white text-[11px] mt-0.5 m-0 opacity-75">{items.length} item{items.length !== 1 ? "s" : ""}</p>
                </div>
                <span className="text-[28px] font-black text-white tracking-tight">
                  ₹ {grandTotal.toLocaleString("en-IN")}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => navigate("/sales")}
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
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><i className="bi bi-check-circle-fill" /> Save Sale</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <PaymentProcessingOverlay
        show={showPaymentLoader}
        type="sale"
        amount={pendingNavState?.amount || 0}
        onComplete={() => {
          setShowPaymentLoader(false);
          navigate("/payment-success", { state: pendingNavState });
        }}
      />

      <ConfirmModal
        open={showConfirm}
        title="Confirm Sale"
        message={`Are you sure you want to save this sale?\nGrand Total: ₹ ${grandTotal.toLocaleString("en-IN")}${isNewCustomer && newCustomerName.trim() ? `\nNew customer "${newCustomerName.trim()}" will be added to Parties` : ""}`}
        confirmText="Yes, Save"
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
}
