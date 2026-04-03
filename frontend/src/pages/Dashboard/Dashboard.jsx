import React, { useEffect, useState, useMemo, useContext } from "react";
import { getDashboardData } from "../../api/dashboardService";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import Topbar from "../../layouts/Topbar";
import { AuthContext } from "../../context/AuthContext";

const PIE_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#0d9488",
];

const DASH_STYLES = `
  @import url("https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap");

  :root {
    --bg-page: #f0f2ff;
    --bg-card: #ffffff;
    --bg-card-alt: #f8f9ff;
    --border: rgba(99,102,241,0.12);
    --border-hover: rgba(99,102,241,0.3);
    --shadow-sm: 0 2px 12px rgba(15,23,42,0.06), 0 0 1px rgba(15,23,42,0.04);
    --shadow-md: 0 8px 24px rgba(15,23,42,0.08);
    --shadow-lg: 0 20px 50px rgba(15,23,42,0.12), 0 4px 16px rgba(15,23,42,0.06);
    --accent: #6366f1;     --accent-bg: rgba(99,102,241,0.08);
    --success: #10b981;   --success-bg: rgba(16,185,129,0.09);
    --warning: #f59e0b;   --warning-bg: rgba(245,158,11,0.09);
    --danger: #ef4444;    --danger-bg: rgba(239,68,68,0.09);
    --info: #06b6d4;      --info-bg: rgba(6,182,212,0.09);
    --purple: #8b5cf6;    --purple-bg: rgba(139,92,246,0.09);
    --text-primary: #0f172a;
    --text-secondary: #475569;
    --text-muted: #94a3b8;
    --font-head: "Outfit", sans-serif;
    --font-body: "DM Sans", sans-serif;
  }
  body.dark-mode {
    --bg-page: #0a0f1e;
    --bg-card: #131929;
    --bg-card-alt: #1a2236;
    --border: rgba(99,102,241,0.18);
    --border-hover: rgba(99,102,241,0.35);
    --shadow-sm: 0 2px 12px rgba(0,0,0,0.35);
    --shadow-md: 0 8px 24px rgba(0,0,0,0.4);
    --shadow-lg: 0 20px 50px rgba(0,0,0,0.5);
    --text-primary: #f1f5f9;
    --text-secondary: #94a3b8;
    --text-muted: #64748b;
    --accent-bg: rgba(99,102,241,0.14);
    --success-bg: rgba(16,185,129,0.12);
    --warning-bg: rgba(245,158,11,0.12);
    --danger-bg: rgba(239,68,68,0.12);
    --info-bg: rgba(6,182,212,0.12);
    --purple-bg: rgba(139,92,246,0.12);
  }

  /* Keyframes */
  @keyframes fadeUp   { from { opacity:0; transform:translateY(20px) } to { opacity:1; transform:translateY(0) } }
  @keyframes slideUp  { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:translateY(0) } }
  @keyframes pulseDot { 0%,100% { opacity:1; transform:scale(1) } 50% { opacity:.5; transform:scale(.8) } }
  @keyframes dashSpin { to { transform:rotate(360deg) } }

  .d-fadein  { animation: fadeUp  .45s ease both }
  .d-slidein { animation: slideUp .5s  ease both }
  .d-livedot { animation: pulseDot 1.8s ease-in-out infinite }
  .d-spinner { animation: dashSpin .75s linear infinite }

  /* Hover — CSS vars use பண்றதால Tailwind-ல செய்ய முடியாது */
  .d-kpi:hover  { transform:translateY(-5px) !important; box-shadow:var(--shadow-lg) !important; border-color:var(--border-hover) !important; }
  .d-dcard:hover { transform:translateY(-4px) !important; box-shadow:0 16px 40px rgba(0,0,0,.12) !important; border-color:var(--border-hover) !important; }
  .d-addbtn:hover { background:var(--accent) !important; color:#fff !important; border-color:var(--accent) !important; transform:scale(1.1) !important; }
  .d-tab { background:transparent; color:var(--text-muted); border:none; cursor:pointer; transition:all .18s; font-size:11.5px; font-weight:600; padding:5px 12px; border-radius:8px; font-family:var(--font-head); }
  .d-tab.on { background:var(--accent); color:#fff; box-shadow:0 2px 10px rgba(99,102,241,.35); }
  .d-tab:not(.on):hover { background:var(--accent-bg); color:var(--accent); }
  .d-psup:hover  { background:var(--warning) !important; color:#fff !important; }
  .d-pcust:hover { background:var(--success) !important; color:#fff !important; }
  .d-ptot:hover  { background:var(--accent)  !important; color:#fff !important; }
  .d-prod:hover  { background:var(--bg-card-alt) !important; }
  .d-prod:hover .d-arr { opacity:1 !important; transform:translateX(0) !important; }

  /* Scrollbar */
  .d-scroll::-webkit-scrollbar       { width: 4px }
  .d-scroll::-webkit-scrollbar-track { background: transparent }
  .d-scroll::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px }
`;

/* ── Recharts Tooltip ── */
const Tip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
        fontSize: 13,
      }}
    >
      <p style={{ color: "var(--text-muted)", marginBottom: 4, fontSize: 11 }}>
        {label}
      </p>
      <p style={{ color: "var(--text-primary)", fontWeight: 700, margin: 0 }}>
        ₹ {Number(payload[0].value).toLocaleString("en-IN")}
      </p>
    </div>
  );
};

/* ── Empty State ── */
const Empty = ({ icon, text }) => (
  <div
    style={{ color: "var(--text-muted)" }}
    className="flex flex-col items-center justify-center py-12 gap-2 text-sm"
  >
    <i className={`bi ${icon}`} style={{ fontSize: 36, opacity: 0.35 }} />
    <span>{text}</span>
  </div>
);

/* ── Filter Tabs ── */
const FilterTabs = ({ value, onChange }) => (
  <div
    style={{
      background: "var(--bg-card-alt)",
      border: "1px solid var(--border)",
    }}
    className="flex gap-0.5 rounded-[10px] p-[3px]"
  >
    {["Day", "Weekly", "Monthly", "Yearly"].map((f) => (
      <button
        key={f}
        className={`d-tab ${value === f ? "on" : ""}`}
        onClick={() => onChange(f)}
      >
        {f}
      </button>
    ))}
  </div>
);

/* ── Stat Row ── */
const StatRow = ({ stats }) => (
  <div
    style={{
      background: "var(--bg-card-alt)",
      borderBottom: "1px solid var(--border)",
    }}
    className="flex"
  >
    {stats.map((s, i) => (
      <React.Fragment key={i}>
        {i > 0 && (
          <div style={{ background: "var(--border)" }} className="w-px my-3" />
        )}
        <div className="flex-1 px-5 py-3.5">
          <div
            style={{
              fontFamily: "var(--font-head)",
              color: "var(--text-primary)",
            }}
            className="text-[18px] font-bold"
          >
            {s.v}
          </div>
          <div
            style={{ color: "var(--text-muted)" }}
            className="text-[11px] font-medium mt-0.5"
          >
            {s.l}
          </div>
        </div>
      </React.Fragment>
    ))}
  </div>
);

/* ── Card Header ── */
const CardHdr = ({ iconBg, icon, iconColor, title, right }) => (
  <div
    style={{
      background: "var(--bg-card)",
      borderBottom: "1px solid var(--border)",
    }}
    className="flex items-center justify-between px-[22px] pt-[18px] pb-[14px]"
  >
    <span
      style={{ fontFamily: "var(--font-head)", color: "var(--text-primary)" }}
      className="flex items-center gap-2.5 text-[15px] font-bold"
    >
      <span
        style={{ background: iconBg }}
        className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-sm shrink-0"
      >
        <i className={`bi ${icon}`} style={{ color: iconColor }} />
      </span>
      {title}
    </span>
    {right}
  </div>
);

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════ */
export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState(null);
  const [sales, setSales] = useState([]);
  const [purch, setPurch] = useState([]);
  const [pl, setPl] = useState(null);
  const [custOut, setCustOut] = useState([]);
  const [stock, setStock] = useState([]);
  const [parties, setParties] = useState([]);
  const [sF, setSF] = useState("Weekly");
  const [pF, setPF] = useState("Weekly");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  // ── Which dashboard sections can this user see? ──────────────
  // Owner → all 7. Others → whatever is in dashboard.fields permission.
  const ALL_DASH_FIELDS = [
    "product_list",
    "sale_summary",
    "purchase_summary",
    "profit_loss",
    "customer_outstanding",
    "current_stock",
    "parties",
  ];
  const allowedFields = useMemo(() => {
    if (!user) return [];
    if (user.role === "Owner") return ALL_DASH_FIELDS;
    const fields = user?.permissions?.dashboard?.fields;
    if (Array.isArray(fields) && fields.length > 0) return fields;
    return ALL_DASH_FIELDS; // fallback: show all if no fields set
  }, [user]);

  const canShow = (fieldKey) => allowedFields.includes(fieldKey);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const r = await getDashboardData();
        const d = r.data;
        setData(d);
        setSales(d.sales || []);
        setPurch(d.purchases || []);
        setPl(d.profit_loss || null);
        setCustOut(d.customer_outstanding || []);
        setStock(d.current_stock || []);
        setParties(d.parties || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const makeChart = (rows, filter, key = "total_amount") => {
    if (!rows.length) return [];
    const today = new Date();
    if (filter === "Day") {
      const ds = today.toISOString().split("T")[0];
      return [
        {
          date: ds,
          amount: rows
            .filter((r) => r.created_at?.split("T")[0] === ds)
            .reduce((a, r) => a + Number(r[key] || 0), 0),
        },
      ];
    }
    if (filter === "Weekly") {
      const g = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - (6 - i));
        g[d.toISOString().split("T")[0]] = 0;
      }
      rows.forEach((r) => {
        const ds = r.created_at?.split("T")[0];
        if (ds in g) g[ds] += Number(r[key] || 0);
      });
      return Object.entries(g).map(([d, a]) => ({
        date: new Date(d).toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
        }),
        amount: a,
      }));
    }
    if (filter === "Monthly") {
      const wm = {};
      rows.forEach((r) => {
        const diff = Math.ceil(
          Math.abs(today - new Date(r.created_at)) / 86400000,
        );
        const wk =
          diff <= 7
            ? "Week 1"
            : diff <= 14
              ? "Week 2"
              : diff <= 21
                ? "Week 3"
                : "Week 4";
        wm[wk] = (wm[wk] || 0) + Number(r[key] || 0);
      });
      return ["Week 4", "Week 3", "Week 2", "Week 1"].map((w) => ({
        date: w,
        amount: wm[w] || 0,
      }));
    }
    const mn = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const mm = Object.fromEntries(mn.map((m) => [m, 0]));
    rows.forEach((r) => {
      mm[mn[new Date(r.created_at).getMonth()]] += Number(r[key] || 0);
    });
    return mn.map((m) => ({ date: m, amount: mm[m] }));
  };

  const cS = useMemo(() => makeChart(sales, sF), [sales, sF]);
  const cP = useMemo(() => makeChart(purch, pF), [purch, pF]);

  const plChart = useMemo(
    () => [
      { name: "Sales", value: pl?.total_sales || 0 },
      { name: "Purchase", value: pl?.total_purchase || 0 },
    ],
    [pl],
  );
  const stockChart = useMemo(
    () =>
      stock
        .slice(0, 15)
        .map((i) => ({
          nm: (i.product_name || "").substring(0, 12),
          qty: i.available_quantity || 0,
        })),
    [stock],
  );
  const partySumm = useMemo(
    () => ({
      sup: parties.filter((p) => p.party_type === "Supplier").length,
      cust: parties.filter((p) => p.party_type === "Customer").length,
    }),
    [parties],
  );
  const prods = useMemo(() => {
    const l = data?.products || [];
    return q.trim()
      ? l.filter((p) => p.product_name.toLowerCase().includes(q.toLowerCase()))
      : l;
  }, [data, q]);

  const fmt = (v) => `₹ ${Number(v || 0).toLocaleString("en-IN")}`;
  const domY = (arr) => [
    0,
    Math.ceil(Math.max(...arr.map((d) => d.amount || 0)) * 1.15),
  ];
  const sum = (arr) => arr.reduce((a, d) => a + d.amount, 0);
  const active = (arr) => arr.filter((d) => d.amount > 0).length;

  const inStock =
    data?.products?.filter((p) => p.stock_quantity > 0).length || 0;
  const totalSales = sales.reduce((a, s) => a + Number(s.total_amount || 0), 0);

  /* ── LOADING ── */
  if (loading)
    return (
      <>
        <style>{DASH_STYLES}</style>
        <div
          style={{
            background: "var(--bg-page)",
            fontFamily: "var(--font-head)",
          }}
          className="min-h-screen flex flex-col items-center justify-center gap-4"
        >
          <div
            className="d-spinner"
            style={{
              width: 44,
              height: 44,
              border: "3px solid var(--border)",
              borderTopColor: "var(--accent)",
              borderRadius: "50%",
            }}
          />
          <p
            style={{ color: "var(--text-secondary)" }}
            className="text-sm font-medium m-0"
          >
            Loading Dashboard…
          </p>
        </div>
      </>
    );

  /* ─────────────────────────────────────────────────────
     KPI card data array
  ───────────────────────────────────────────────────── */
  const kpiCards = [
    {
      delay: ".05s",
      strip: "linear-gradient(90deg,#6366f1,#818cf8)",
      iBg: "var(--accent-bg)",
      ic: "bi-box-seam",
      iC: "var(--accent)",
      bBg: "var(--success-bg)",
      bC: "var(--success)",
      bIc: "bi-arrow-up-short",
      bTxt: "Live",
      val: data?.total_products || 0,
      lbl: "Total Products",
      sub: `${data?.category_count || 0} categories`,
    },
    {
      delay: ".10s",
      strip: "linear-gradient(90deg,#10b981,#34d399)",
      iBg: "var(--success-bg)",
      ic: "bi-check-circle",
      iC: "var(--success)",
      bBg: "var(--success-bg)",
      bC: "var(--success)",
      bIc: "bi-arrow-up-short",
      bTxt: "Good",
      val: inStock,
      lbl: "In Stock",
      sub: "Items available now",
    },
    {
      delay: ".15s",
      strip: "linear-gradient(90deg,#ef4444,#f87171)",
      iBg: "var(--danger-bg)",
      ic: "bi-exclamation-triangle",
      iC: "var(--danger)",
      bBg: "var(--danger-bg)",
      bC: "var(--danger)",
      bIc: "bi-arrow-down-short",
      bTxt: "Alert",
      val: data?.low_stock_count || 0,
      lbl: "Low Stock",
      sub: "Need reorder soon",
    },
    {
      delay: ".20s",
      strip: "linear-gradient(90deg,#f59e0b,#fbbf24)",
      iBg: "var(--warning-bg)",
      ic: "bi-currency-rupee",
      iC: "var(--warning)",
      bBg: "var(--success-bg)",
      bC: "var(--success)",
      bIc: "bi-arrow-up-short",
      bTxt: "",
      val: fmt(totalSales),
      lbl: "Total Revenue",
      sub: "All time sales",
      big: true,
    },
  ];

  /* ─────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────── */
  return (
    <>
      <style>{DASH_STYLES}</style>

      {/* Page Wrapper */}
      <div
        style={{
          fontFamily: "var(--font-body)",
          transition: "background .3s",
        }}
        className="min-h-screen px-7 pt-7 pb-16"
      >
        <Topbar productSearchQuery={q} setProductSearchQuery={setQ} />

        {/* ════ KPI CARDS — 4 columns ════ */}
        <div className="grid grid-cols-4 gap-[18px] mb-7 max-[1100px]:grid-cols-2 max-[600px]:grid-cols-1">
          {kpiCards.map((k, i) => (
            <div
              key={i}
              className="d-fadein d-kpi relative overflow-hidden cursor-default rounded-[20px] p-[22px] border transition-all duration-[220ms]"
              style={{
                animationDelay: k.delay,
                background: "var(--bg-card)",
                borderColor: "var(--border)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              {/* Top colour strip */}
              <div
                className="absolute top-0 left-0 right-0 h-[3px] rounded-t-[20px]"
                style={{ background: k.strip }}
              />
              {/* Icon + Badge */}
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center text-xl shrink-0"
                  style={{ background: k.iBg }}
                >
                  <i className={`bi ${k.ic}`} style={{ color: k.iC }} />
                </div>
                <div
                  className="flex items-center gap-1 text-[10.5px] font-bold px-[9px] py-1 rounded-full"
                  style={{
                    fontFamily: "var(--font-head)",
                    background: k.bBg,
                    color: k.bC,
                  }}
                >
                  <i className={`bi ${k.bIc}`} />
                  {k.bTxt}
                </div>
              </div>
              {/* Value */}
              <div
                className="d-slidein font-extrabold leading-none mb-1.5"
                style={{
                  fontFamily: "var(--font-head)",
                  fontSize: k.big ? 22 : 34,
                  color: "var(--text-primary)",
                }}
              >
                {k.val}
              </div>
              <div
                className="text-[13px] font-medium"
                style={{ color: "var(--text-secondary)" }}
              >
                {k.lbl}
              </div>
              <div
                className="text-[11px] mt-0.5"
                style={{ color: "var(--text-muted)" }}
              >
                {k.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ════ ROW 1 — Products | Sales | Purchase ════ */}
        {(canShow("product_list") || canShow("sale_summary") || canShow("purchase_summary")) && (
        <div
          className="gap-5 mb-5"
          style={{
            display: "grid",
            gridTemplateColumns: [
              canShow("product_list"),
              canShow("sale_summary"),
              canShow("purchase_summary"),
            ].filter(Boolean).length === 1
              ? "1fr"
              : [
                    canShow("product_list"),
                    canShow("sale_summary"),
                    canShow("purchase_summary"),
                  ].filter(Boolean).length === 2
                ? "1fr 1fr"
                : "1fr 1fr 1fr",
          }}
        >
          {/* ── Product List ── */}
          {canShow("product_list") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".05s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="var(--accent-bg)"
              icon="bi-box-seam"
              iconColor="var(--accent)"
              title="Product List"
              right={
                <Link
                  to="/products/create"
                  className="d-addbtn w-[30px] h-[30px] rounded-[9px] flex items-center justify-center text-lg no-underline border shrink-0 transition-all duration-[180ms]"
                  style={{
                    background: "var(--accent-bg)",
                    color: "var(--accent)",
                    borderColor: "rgba(99,102,241,.2)",
                  }}
                >
                  <i className="bi bi-plus" />
                </Link>
              }
            />
            <div className="d-scroll flex flex-col max-h-[500px] overflow-y-auto">
              {prods.length === 0 ? (
                <Empty icon="bi-box-seam" text="No products found" />
              ) : (
                prods.slice(0, 10).map((p) => {
                  const low = p.stock_quantity <= p.minimum_stock;
                  const pct = p.stock_percent || 0;
                  const bC =
                    pct > 60
                      ? "var(--success)"
                      : pct > 30
                        ? "var(--warning)"
                        : "var(--danger)";
                  const pBg =
                    pct > 60
                      ? "var(--success-bg)"
                      : pct > 30
                        ? "var(--warning-bg)"
                        : "var(--danger-bg)";
                  const pC =
                    pct > 60
                      ? "var(--success)"
                      : pct > 30
                        ? "var(--warning)"
                        : "var(--danger)";
                  return (
                    <div
                      key={p.id}
                      className="d-prod flex items-center gap-3 px-5 py-[11px] cursor-pointer relative border-b"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <img
                        src={p.image || "https://via.placeholder.com/46"}
                        alt={p.product_name}
                        className="w-11 h-11 rounded-[11px] object-cover shrink-0 border"
                        style={{
                          border: "1px solid var(--border)",
                          background: "var(--bg-card-alt)",
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-[13px] font-semibold truncate"
                          style={{
                            fontFamily: "var(--font-head)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {p.product_name}
                        </div>
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {p.category_name || "—"}
                        </div>
                        <div
                          className="h-[3px] rounded-[10px] overflow-hidden mt-1.5 w-14"
                          style={{ background: "var(--bg-card-alt)" }}
                        >
                          <div
                            style={{
                              height: "100%",
                              width: `${pct}%`,
                              background: bC,
                              borderRadius: 10,
                              transition: "width .4s",
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className="text-[13.5px] font-bold"
                          style={{
                            fontFamily: "var(--font-head)",
                            color: "var(--text-primary)",
                          }}
                        >
                          {fmt(p.selling_price)}
                        </div>
                        <div
                          className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full mt-1"
                          style={{
                            background: low ? "var(--danger-bg)" : pBg,
                            color: low ? "var(--danger)" : pC,
                          }}
                        >
                          {low ? "Low" : `${pct}%`}
                        </div>
                      </div>
                      <i
                        className="bi bi-chevron-right d-arr text-[11px] absolute right-3"
                        style={{
                          color: "var(--text-muted)",
                          opacity: 0,
                          transform: "translateX(-4px)",
                          transition: "all .15s",
                        }}
                      />
                    </div>
                  );
                })
              )}
            </div>
          </div>}

          {/* ── Sales Summary ── */}
          {canShow("sale_summary") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".10s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="rgba(99,102,241,.1)"
              icon="bi-graph-up-arrow"
              iconColor="var(--accent)"
              title="Sales Summary"
              right={<FilterTabs value={sF} onChange={setSF} />}
            />
            <StatRow
              stats={[
                { v: fmt(sum(cS)), l: "Period Total" },
                { v: active(cS), l: "Active Days" },
                {
                  v: fmt(cS.length ? sum(cS) / Math.max(1, active(cS)) : 0),
                  l: "Avg / Day",
                },
              ]}
            />
            <div className="p-[18px_14px_14px]">
              {cS.length === 0 ? (
                <Empty icon="bi-graph-up" text="No sales data" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <ResponsiveContainer
                    width={
                      sF === "Yearly" ? Math.max(520, cS.length * 80) : "100%"
                    }
                    height={230}
                  >
                    <LineChart data={cS}>
                      <defs>
                        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="0%"
                            stopColor="#6366f1"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="100%"
                            stopColor="#6366f1"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={domY(cS)}
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<Tip />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        dot={{
                          fill: "#6366f1",
                          r: 4,
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>}

          {/* ── Purchase Summary ── */}
          {canShow("purchase_summary") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".15s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="rgba(245,158,11,.1)"
              icon="bi-cart-check"
              iconColor="var(--warning)"
              title="Purchase Summary"
              right={<FilterTabs value={pF} onChange={setPF} />}
            />
            <StatRow
              stats={[
                { v: fmt(sum(cP)), l: "Period Total" },
                { v: active(cP), l: "Active Days" },
                {
                  v: fmt(cP.length ? sum(cP) / Math.max(1, active(cP)) : 0),
                  l: "Avg / Day",
                },
              ]}
            />
            <div className="p-[18px_14px_14px]">
              {cP.length === 0 ? (
                <Empty icon="bi-cart-check" text="No purchase data" />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <ResponsiveContainer
                    width={
                      pF === "Yearly" ? Math.max(520, cP.length * 80) : "100%"
                    }
                    height={230}
                  >
                    <LineChart data={cP}>
                      <CartesianGrid
                        strokeDasharray="4 4"
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={domY(cP)}
                        tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip content={<Tip />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#f59e0b"
                        strokeWidth={2.5}
                        dot={{
                          fill: "#f59e0b",
                          r: 4,
                          strokeWidth: 2,
                          stroke: "#fff",
                        }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>}
        </div>
        )}

        {/* ════ ROW 2 — Profit & Loss | Customer Outstanding ════ */}
        {(canShow("profit_loss") || canShow("customer_outstanding")) && (
        <div
          className="gap-5 mb-5"
          style={{
            display: "grid",
            gridTemplateColumns:
              canShow("profit_loss") && canShow("customer_outstanding")
                ? "4fr 8fr"
                : "1fr",
          }}
        >
          {/* ── Profit & Loss ── */}
          {canShow("profit_loss") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".05s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="rgba(139,92,246,.1)"
              icon="bi-pie-chart"
              iconColor="var(--purple)"
              title="Profit & Loss"
            />
            <div className="p-[22px]">
              {pl ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={plChart}
                        dataKey="value"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={46}
                        paddingAngle={3}
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-[10px] mt-[14px]">
                    {[
                      {
                        l: "Total Sales",
                        v: pl.total_sales,
                        c: "var(--accent)",
                      },
                      {
                        l: "Total Purchase",
                        v: pl.total_purchase,
                        c: "var(--warning)",
                      },
                    ].map((item) => (
                      <div
                        key={item.l}
                        className="rounded-[10px] px-[14px] py-3 text-center border"
                        style={{
                          background: "var(--bg-card-alt)",
                          borderColor: "var(--border)",
                        }}
                      >
                        <div
                          className="text-[11px] font-medium mb-1"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {item.l}
                        </div>
                        <div
                          className="text-[14px] font-bold"
                          style={{
                            fontFamily: "var(--font-head)",
                            color: item.c,
                          }}
                        >
                          {fmt(item.v)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    className="mt-2.5 rounded-[10px] p-[14px] text-center border border-indigo-500/20"
                    style={{
                      background:
                        "linear-gradient(135deg,rgba(99,102,241,.06),rgba(139,92,246,.06))",
                    }}
                  >
                    <div
                      className="text-[10.5px] font-semibold uppercase tracking-[.05em] mb-1.5"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Net Profit / Loss
                    </div>
                    <div
                      className="text-[26px] font-extrabold"
                      style={{
                        fontFamily: "var(--font-head)",
                        color:
                          pl.profit >= 0 ? "var(--success)" : "var(--danger)",
                      }}
                    >
                      {fmt(pl.profit)}
                    </div>
                  </div>
                </>
              ) : (
                <Empty icon="bi-pie-chart" text="No data available" />
              )}
            </div>
          </div>}

          {/* ── Customer Outstanding ── */}
          {canShow("customer_outstanding") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".10s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="rgba(6,182,212,.1)"
              icon="bi-people"
              iconColor="var(--info)"
              title="Customer Outstanding"
              right={
                <span
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: "var(--text-muted)" }}
                >
                  <span
                    className="d-livedot inline-block w-[7px] h-[7px] rounded-full"
                    style={{ background: "var(--success)" }}
                  />
                  Live
                </span>
              }
            />
            <div className="px-[10px] py-[16px]">
              {custOut.length === 0 ? (
                <Empty icon="bi-people" text="No customer data" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={custOut.map((i) => ({
                        name: i.customer_name || "Walk-in",
                        value: Number(i.total_bill),
                      }))}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={120}
                      innerRadius={55}
                      paddingAngle={2}
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                      labelLine={{
                        stroke: "var(--text-muted)",
                        strokeWidth: 1,
                      }}
                    >
                      {custOut.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) =>
                        `₹ ${Number(v).toLocaleString("en-IN")}`
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>}
        </div>
        )}

        {/* ════ ROW 3 — Current Stock | Parties ════ */}
        {(canShow("current_stock") || canShow("parties")) && (
        <div
          className="gap-5 mb-5"
          style={{
            display: "grid",
            gridTemplateColumns:
              canShow("current_stock") && canShow("parties")
                ? "8fr 4fr"
                : "1fr",
          }}
        >
          {/* ── Current Stock ── */}
          {canShow("current_stock") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".05s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="rgba(139,92,246,.1)"
              icon="bi-bar-chart-line"
              iconColor="var(--purple)"
              title="Current Stock"
              right={
                <span
                  className="text-[12px] font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  Top {stockChart.length} products
                </span>
              }
            />
            <div className="overflow-x-auto p-[18px_14px_14px]">
              {stockChart.length === 0 ? (
                <Empty icon="bi-bar-chart-line" text="No stock data" />
              ) : (
                <ResponsiveContainer
                  width={Math.max(680, stockChart.length * 110)}
                  height={290}
                >
                  <BarChart data={stockChart} barCategoryGap={28}>
                    <defs>
                      <linearGradient id="stg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                      stroke="var(--border)"
                    />
                    <XAxis
                      dataKey="nm"
                      angle={-30}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 11.5, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(99,102,241,.04)", radius: 8 }}
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid var(--border)",
                        boxShadow: "var(--shadow-md)",
                        fontSize: 13,
                        background: "var(--bg-card)",
                      }}
                    />
                    <Bar
                      dataKey="qty"
                      fill="url(#stg)"
                      radius={[10, 10, 0, 0]}
                      barSize={36}
                    >
                      <LabelList
                        dataKey="qty"
                        position="top"
                        style={{
                          fontSize: 11.5,
                          fontWeight: 700,
                          fill: "var(--text-secondary)",
                        }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>}

          {/* ── Parties Summary ── */}
          {canShow("parties") && <div
            className="d-fadein d-dcard rounded-[20px] overflow-hidden border transition-all duration-[220ms]"
            style={{
              animationDelay: ".10s",
              background: "var(--bg-card)",
              borderColor: "var(--border)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <CardHdr
              iconBg="rgba(16,185,129,.1)"
              icon="bi-people"
              iconColor="var(--success)"
              title="Parties Summary"
            />
            <div className="p-[22px] flex flex-col gap-3">
              {[
                {
                  cls: "d-psup",
                  bg: "linear-gradient(135deg,rgba(245,158,11,.07),rgba(251,191,36,.04))",
                  iB: "var(--warning-bg)",
                  em: "🏭",
                  lbl: "Total Suppliers",
                  val: partySumm.sup,
                  to: "/parties?type=Supplier",
                  bC: "var(--warning)",
                  bBg: "var(--warning-bg)",
                  bBr: "rgba(245,158,11,.25)",
                },
                {
                  cls: "d-pcust",
                  bg: "linear-gradient(135deg,rgba(16,185,129,.07),rgba(52,211,153,.04))",
                  iB: "var(--success-bg)",
                  em: "👤",
                  lbl: "Total Customers",
                  val: partySumm.cust,
                  to: "/parties?type=Customer",
                  bC: "var(--success)",
                  bBg: "var(--success-bg)",
                  bBr: "rgba(16,185,129,.25)",
                },
                {
                  cls: "d-ptot",
                  bg: "linear-gradient(135deg,rgba(99,102,241,.07),rgba(129,140,248,.04))",
                  iB: "var(--accent-bg)",
                  em: "🤝",
                  lbl: "All Parties",
                  val: parties.length,
                  to: "/parties",
                  bC: "var(--accent)",
                  bBg: "var(--accent-bg)",
                  bBr: "rgba(99,102,241,.25)",
                },
              ].map((row) => (
                <div
                  key={row.lbl}
                  className="rounded-[16px] flex items-center gap-3.5 border relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    padding: "18px 18px 14px",
                    background: row.bg,
                    borderColor: "var(--border)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-[13px] flex items-center justify-center text-[22px] shrink-0"
                    style={{ background: row.iB }}
                  >
                    {row.em}
                  </div>
                  <div className="flex-1">
                    <div
                      className="text-[12px] font-medium mb-1"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {row.lbl}
                    </div>
                    <div
                      className="text-[30px] font-extrabold leading-none"
                      style={{
                        fontFamily: "var(--font-head)",
                        color: "var(--text-primary)",
                      }}
                    >
                      {row.val}
                    </div>
                  </div>
                  <Link
                    to={row.to}
                    className={`${row.cls} text-[11.5px] font-semibold px-[13px] py-1.5 rounded-[8px] no-underline border whitespace-nowrap transition-all duration-[180ms]`}
                    style={{
                      color: row.bC,
                      background: row.bBg,
                      borderColor: row.bBr,
                    }}
                  >
                    View →
                  </Link>
                </div>
              ))}
            </div>
          </div>}
        </div>
        )}
      </div>
    </>
  );
}
