import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getProduct,
  createProduct,
  updateProduct,
} from "../../api/productService";
import { getParties } from "../../api/partyService";
import { getCategories } from "../../api/categoryService";
import { getUnits } from "../../api/unitService";
import ConfirmModal from "../../components/common/ConfirmModal";
import { useToast } from "../../context/ToastContext";

const inputCls = `
  w-full px-4 py-2.5 rounded-xl border text-sm font-medium
  bg-white text-slate-800 border-slate-200 placeholder:text-slate-400
  focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500
  transition-all duration-200
  dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600
  dark:placeholder:text-slate-500 dark:focus:border-blue-400 dark:focus:ring-blue-400/20
`.trim();

const labelCls =
  "block text-[13px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5";

const SectionTitle = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
      <i className={`bi ${icon} text-blue-500 text-sm`} />
    </div>
    <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
      {title}
    </span>
    <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700 ml-1" />
  </div>
);

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({
    product_name: "",
    supplier: "",
    category: "",
    unit: "",
    sub_unit: "",
    conversion_factor: "",
    cost_price: "",
    selling_price: "",
    minimum_stock: "",
    maximum_stock: "",
    image: null,
  });

  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [supRes, catRes, unitRes] = await Promise.all([
          getParties("Supplier"),
          getCategories(),
          getUnits(),
        ]);
        setSuppliers(supRes.data || []);
        setCategories(catRes.data || []);
        setUnits(unitRes.data || []);
      } catch (err) {
        console.error(err);
      }

      if (isEdit) {
        try {
          const res = await getProduct(id);
          setFormData({
            ...res.data,
            image: null,
            sub_unit: res.data.sub_unit || "",
            conversion_factor: res.data.conversion_factor || "",
          });
          setPreview(res.data.image);
        } catch (err) {
          console.error(err);
        }
      }
    };
    fetchAll();
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "image" && files?.[0]) {
      setFormData((prev) => ({ ...prev, image: files[0] }));
      setPreview(URL.createObjectURL(files[0]));
    } else if (name === "unit") {
      setFormData((prev) => ({
        ...prev,
        unit: value,
        sub_unit: prev.sub_unit == value ? "" : prev.sub_unit,
      }));
    } else if (name === "sub_unit") {
      setFormData((prev) => ({
        ...prev,
        sub_unit: value,
        conversion_factor: value ? prev.conversion_factor : "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.sub_unit && (!formData.conversion_factor || Number(formData.conversion_factor) <= 0)) {
      showToast("Please enter a valid conversion factor (must be > 0)", "warning");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSave = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach((k) => {
        if (k === "sub_unit") {
          data.append(k, formData[k] || "");
        } else if (k === "conversion_factor") {
          if (formData.sub_unit) {
            data.append(k, formData[k] || 1);
          }
        } else if (formData[k] !== null && formData[k] !== "") {
          data.append(k, formData[k]);
        }
      });
      if (isEdit) {
        await updateProduct(id, data);
        showToast("Product updated successfully", "success");
      } else {
        await createProduct(data);
        showToast("Product created successfully", "success");
      }
      navigate("/products");
    } catch (err) {
      console.error(err);
      showToast("Failed to save product", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedBaseUnit = units.find((u) => u.id == formData.unit);
  const selectedSubUnit = units.find((u) => u.id == formData.sub_unit);
  const availableSubUnits = units.filter((u) => u.id != formData.unit);

  return (
    <>
      <div className="max-w-3xl mx-auto">
        <div className="rounded-[20px] overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] border border-slate-200/80 dark:border-slate-700/60 dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300">
          <div className="bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-950 dark:to-slate-800 px-6 py-[18px]">
            <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2 m-0">
              <i className={`bi ${isEdit ? "bi-pencil-square" : "bi-box-seam"} text-blue-300`} />
              {isEdit ? "Update Product" : "Add New Product"}
            </h5>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 md:p-8 transition-colors duration-300">
            <form onSubmit={handleSubmit} noValidate>

              {/* IMAGE */}
              <div className="mb-8">
                <SectionTitle icon="bi-image" title="Product Image" />
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="shrink-0">
                    <div className="w-32 h-32 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 shadow-inner">
                      <img src={preview || "https://via.placeholder.com/150?text=No+Image"} alt="preview" className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <label className={labelCls}>
                      <i className="bi bi-upload me-1 text-blue-500" /> Upload Image <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file" name="image" accept=".jpg,.jpeg,.png"
                      onChange={handleChange} required={!isEdit}
                      className="w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400 cursor-pointer border border-slate-200 dark:border-slate-600 rounded-xl px-1 py-1 bg-white dark:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all duration-200"
                    />
                    <p className="mt-1.5 text-[11px] text-slate-400 dark:text-slate-500">Supported: JPG, JPEG, PNG · Max 5MB recommended</p>
                  </div>
                </div>
              </div>

              {/* BASIC INFO */}
              <div className="mb-7">
                <SectionTitle icon="bi-info-circle" title="Basic Information" />
                <label className={labelCls}><i className="bi bi-box me-1 text-blue-500" /> Product Name <span className="text-red-500">*</span></label>
                <input name="product_name" type="text" className={inputCls} placeholder="Enter product name" value={formData.product_name} onChange={handleChange} required />
              </div>

              {/* CLASSIFICATION */}
              <div className="mb-7">
                <SectionTitle icon="bi-diagram-3" title="Classification" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className={labelCls}><i className="bi bi-building me-1 text-blue-500" /> Supplier <span className="text-red-500">*</span></label>
                    <select name="supplier" className={inputCls} value={formData.supplier || ""} onChange={handleChange} required>
                      <option value="">Select Supplier</option>
                      {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><i className="bi bi-tags me-1 text-blue-500" /> Category <span className="text-red-500">*</span></label>
                    <select name="category" className={inputCls} value={formData.category || ""} onChange={handleChange} required>
                      <option value="">Select Category</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}><i className="bi bi-rulers me-1 text-blue-500" /> Base Unit <span className="text-red-500">*</span></label>
                    <select name="unit" className={inputCls} value={formData.unit || ""} onChange={handleChange} required>
                      <option value="">Select Unit</option>
                      {units.map((u) => <option key={u.id} value={u.id}>{u.short_name}</option>)}
                    </select>
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Stock always stored in this unit</p>
                  </div>
                </div>
              </div>

              {/* SECONDARY UNIT — only visible when base unit is chosen */}
              {formData.unit && (
                <div className="mb-7">
                  <SectionTitle icon="bi-arrow-left-right" title="Secondary Unit (Optional)" />
                  <div className="rounded-xl border border-dashed border-violet-200 dark:border-violet-800 bg-violet-50/40 dark:bg-violet-900/10 p-4">
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-3">
                      <i className="bi bi-info-circle me-1 text-violet-500" />
                      Add a bulk unit (Bag, Bottle, etc.) that auto-converts from <strong>{selectedBaseUnit?.short_name}</strong>. Enter how many <em>sub units</em> are in 1 <strong>{selectedBaseUnit?.short_name}</strong>.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}><i className="bi bi-box2 me-1 text-violet-500" /> Secondary Unit</label>
                        <select name="sub_unit" className={inputCls} value={formData.sub_unit || ""} onChange={handleChange}>
                          <option value="">None</option>
                          {availableSubUnits.map((u) => (
                            <option key={u.id} value={u.id}>{u.short_name} — {u.name}</option>
                          ))}
                        </select>
                      </div>

                      {formData.sub_unit && (
                        <div>
                          <label className={labelCls}>
                            <i className="bi bi-calculator me-1 text-violet-500" />
                            1 {selectedBaseUnit?.short_name} = ? {selectedSubUnit?.short_name}
                          </label>
                          <input
                            type="number" name="conversion_factor" min="0.0001" step="any"
                            className={inputCls}
                            placeholder={`e.g. 40`}
                            value={formData.conversion_factor}
                            onChange={handleChange}
                            required={Boolean(formData.sub_unit)}
                          />
                          {Number(formData.conversion_factor) > 0 && (
                            <p className="mt-1 text-[11px] text-violet-600 dark:text-violet-400 font-semibold">
                              ✓ 1 {selectedBaseUnit?.short_name} = {formData.conversion_factor} {selectedSubUnit?.short_name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* PRICING */}
              <div className="mb-7">
                <SectionTitle icon="bi-currency-rupee" title="Pricing" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}><i className="bi bi-arrow-down-circle me-1 text-blue-500" /> Cost Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
                      <input type="number" name="cost_price" min="0" step="0.01" className={`${inputCls} pl-8`} placeholder="0.00" value={formData.cost_price} onChange={handleChange} required />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}><i className="bi bi-arrow-up-circle me-1 text-emerald-500" /> Selling Price <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-semibold text-sm">₹</span>
                      <input type="number" name="selling_price" min="0" step="0.01" className={`${inputCls} pl-8`} placeholder="0.00" value={formData.selling_price} onChange={handleChange} required />
                    </div>
                  </div>
                </div>
                {formData.cost_price && formData.selling_price && (() => {
                  const cost = parseFloat(formData.cost_price) || 0;
                  const sell = parseFloat(formData.selling_price) || 0;
                  const margin = cost > 0 ? (((sell - cost) / cost) * 100).toFixed(1) : 0;
                  const isPos = sell >= cost;
                  return (
                    <div className="mt-3 flex items-center gap-2 text-[12px]">
                      <span className={`flex items-center gap-1 font-semibold px-2.5 py-1 rounded-full ${isPos ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"}`}>
                        <i className={`bi ${isPos ? "bi-arrow-up-right" : "bi-arrow-down-right"}`} /> Margin: {margin}%
                      </span>
                      <span className="text-slate-400 dark:text-slate-500">auto-calculated</span>
                    </div>
                  );
                })()}
              </div>

              {/* STOCK LIMITS */}
              <div className="mb-8">
                <SectionTitle icon="bi-bar-chart" title="Stock Limits" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}><i className="bi bi-exclamation-triangle me-1 text-amber-500" /> Minimum Stock</label>
                    <input type="number" name="minimum_stock" min="0" className={inputCls} placeholder="Alert threshold" value={formData.minimum_stock} onChange={handleChange} />
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">In {selectedBaseUnit?.short_name || "base unit"}</p>
                  </div>
                  <div>
                    <label className={labelCls}><i className="bi bi-check-circle me-1 text-emerald-500" /> Maximum Stock</label>
                    <input type="number" name="maximum_stock" min="0" className={inputCls} placeholder="Upper limit" value={formData.maximum_stock} onChange={handleChange} />
                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">In {selectedBaseUnit?.short_name || "base unit"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 mb-6" />

              <div className="flex items-center justify-between gap-3">
                <Link to="/products" className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-sm font-semibold hover:bg-slate-100 hover:border-slate-400 transition-all duration-200 no-underline dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700">
                  <i className="bi bi-arrow-left" /> Cancel
                </Link>
                <button type="submit" disabled={loading} className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:shadow-md hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 dark:bg-emerald-500 dark:hover:bg-emerald-400">
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving…</>
                  ) : (
                    <><i className={`bi ${isEdit ? "bi-check-circle" : "bi-plus-circle"}`} /> {isEdit ? "Update Product" : "Save Product"}</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={showConfirm}
        title="Confirm Save"
        message={`Are you sure you want to ${isEdit ? "update" : "save"} this product?`}
        confirmText={isEdit ? "Yes, Update" : "Yes, Save"}
        variant="primary"
        onConfirm={handleConfirmSave}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default ProductForm;
