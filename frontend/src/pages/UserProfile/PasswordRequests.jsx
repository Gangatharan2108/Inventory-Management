import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import { useToast } from "../../context/ToastContext";

const PagBtn = ({ onClick, disabled, active, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      "w-9 h-9 flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 border",
      active
        ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 dark:bg-blue-500 dark:shadow-blue-900/40"
        : disabled
          ? "text-slate-300 border-slate-200 cursor-not-allowed dark:text-slate-600 dark:border-slate-700"
          : "text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700",
    ].join(" ")}
  >
    {children}
  </button>
);

const StatusBadge = ({ status }) => {
  if (status === "Pending")
    return (
      <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
        Pending
      </span>
    );
  if (status === "Approved")
    return (
      <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
        Approved
      </span>
    );
  if (status === "Completed")
    return (
      <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Completed
      </span>
    );
  if (status === "Rejected")
    return (
      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-700/60 text-[11px] font-bold px-3 py-1.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600 text-[11px] font-bold px-3 py-1.5 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      {status}
    </span>
  );
};

const usePagination = (items, perPage = 8) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(items.length / perPage);
  const paginated = useMemo(() => {
    const s = (currentPage - 1) * perPage;
    return items.slice(s, s + perPage);
  }, [items, currentPage, perPage]);
  const goToPage = (p) => { if (p >= 1 && p <= totalPages) setCurrentPage(p); };
  useEffect(() => { setCurrentPage(1); }, [items.length]);
  return { currentPage, totalPages, paginated, goToPage, perPage };
};

const PaginationBar = ({ currentPage, totalPages, goToPage, start, end, total }) => (
  <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/50 dark:bg-slate-800/50">
    <span className="text-[12.5px] text-slate-400 dark:text-slate-500 font-medium">
      Showing{" "}
      <span className="font-bold text-slate-600 dark:text-slate-300">{start}</span>
      {" – "}
      <span className="font-bold text-slate-600 dark:text-slate-300">{end}</span>
      {" of "}
      <span className="font-bold text-slate-600 dark:text-slate-300">{total}</span>
    </span>
    <div className="flex items-center gap-1">
      <PagBtn onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
        <i className="bi bi-chevron-left text-[11px]" />
      </PagBtn>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
        const show = page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1);
        const eL = page === currentPage - 2 && page > 2;
        const eR = page === currentPage + 2 && page < totalPages - 1;
        if (eL || eR) return <span key={page} className="w-9 h-9 flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-semibold">…</span>;
        if (!show) return null;
        return <PagBtn key={page} onClick={() => goToPage(page)} active={page === currentPage}>{page}</PagBtn>;
      })}
      <PagBtn onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
        <i className="bi bi-chevron-right text-[11px]" />
      </PagBtn>
    </div>
  </div>
);

const EmptyState = ({ message, sub }) => (
  <div className="flex flex-col items-center justify-center py-20 gap-4">
    <div className="w-20 h-20 rounded-3xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center">
      <i className="bi bi-inbox text-4xl text-slate-300 dark:text-slate-600" />
    </div>
    <div className="text-center">
      <p className="text-base font-bold text-slate-600 dark:text-slate-400 m-0">{message}</p>
      <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 m-0">{sub}</p>
    </div>
  </div>
);

const LoadingState = () => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <div className="relative w-14 h-14">
      <div className="absolute inset-0 rounded-full border-4 border-blue-100 dark:border-slate-700" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin" />
    </div>
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 tracking-wide">Loading requests…</p>
  </div>
);

const PasswordRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("password");
  const { showToast } = useToast();
  const navigate = useNavigate();

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/password-requests/");
      setRequests(res.data);
    } catch (err) {
      console.error("Failed to load requests", err);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (id) => {
    try {
      await axios.post(`/password-requests/approve/${id}/`);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r)));
      showToast("Request approved — user can now change password", "success");
    } catch { showToast("Approval failed", "error"); }
  };

  const declineRequest = async (id) => {
    try {
      await axios.post(`/password-requests/decline/${id}/`);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r)));
      showToast("Request declined", "success");
    } catch { showToast("Decline failed", "error"); }
  };

  const resumeAccount = async (id) => {
    try {
      await axios.post(`/password-requests/resume/${id}/`);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved" } : r)));
      showToast("Account resumed successfully", "success");
      navigate("/users");
    } catch { showToast("Failed to resume account", "error"); }
  };

  const cancelResumeRequest = async (id) => {
    try {
      await axios.post(`/password-requests/decline/${id}/`);
      setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected" } : r)));
      showToast("Resume request cancelled", "success");
    } catch { showToast("Cancel failed", "error"); }
  };

  useEffect(() => { fetchRequests(); }, []);

  const passwordRequests = requests.filter((r) => r.request_type === "password_change");
  const resumeRequests = requests.filter((r) => r.request_type === "account_resume");

  const pendingPasswordCount = passwordRequests.filter((r) => r.status === "Pending").length;
  const pendingResumeCount = resumeRequests.filter((r) => r.status === "Pending").length;

  const pwdPagination = usePagination(passwordRequests);
  const resumePagination = usePagination(resumeRequests);

  const activeList = activeTab === "password" ? passwordRequests : resumeRequests;
  const activePending = activeTab === "password" ? pendingPasswordCount : pendingResumeCount;

  const tabs = [
    {
      key: "password",
      label: "Password Requests",
      icon: "bi-key-fill",
      pending: pendingPasswordCount,
      activeGradient: "from-violet-600 to-indigo-600",
      pendingPill: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/60 dark:text-amber-400",
      headerPending: "bg-violet-500/20 border-violet-400/30 text-violet-300",
      headerDot: "bg-violet-400",
    },
    {
      key: "resume",
      label: "Account Resume",
      icon: "bi-person-fill-lock",
      pending: pendingResumeCount,
      activeGradient: "from-orange-500 to-amber-500",
      pendingPill: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/60 dark:text-amber-400",
      headerPending: "bg-amber-500/20 border-amber-400/30 text-amber-300",
      headerDot: "bg-amber-400",
    },
  ];

  const activeCfg = tabs.find((t) => t.key === activeTab);

  return (
    <div className="space-y-5">

      {/* ════ TAB SWITCHER ════ */}
      <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-2 flex gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={[
              "flex-1 flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl font-bold text-[13.5px] transition-all duration-200",
              activeTab === tab.key
                ? `bg-gradient-to-r ${tab.activeGradient} text-white shadow-lg`
                : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/60 hover:text-slate-700 dark:hover:text-slate-200",
            ].join(" ")}
          >
            <i className={`bi ${tab.icon} text-base`} />
            {tab.label}
            {tab.pending > 0 && (
              <span className={[
                "text-[10.5px] font-extrabold px-2 py-0.5 rounded-full border",
                activeTab === tab.key
                  ? "bg-white/20 border-white/30 text-white"
                  : tab.pendingPill,
              ].join(" ")}>
                {tab.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ════ KPI SUMMARY ════ */}
      {activeList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total", value: activeList.length, icon: "bi-list-ul", gradient: "from-blue-500 to-indigo-600", textColor: "text-blue-600 dark:text-blue-400" },
            { label: "Pending", value: activePending, icon: "bi-hourglass-split", gradient: "from-amber-500 to-orange-600", textColor: "text-amber-600 dark:text-amber-400" },
            {
              label: activeTab === "password" ? "Completed" : "Resumed",
              value: activeTab === "password"
                ? activeList.filter((r) => r.status === "Completed").length
                : activeList.filter((r) => r.status === "Approved").length,
              icon: activeTab === "password" ? "bi-check2-circle" : "bi-person-fill-check",
              gradient: "from-emerald-500 to-teal-600",
              textColor: "text-emerald-600 dark:text-emerald-400",
            },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${kpi.gradient} flex items-center justify-center shrink-0 shadow-sm`}>
                <i className={`bi ${kpi.icon} text-white text-lg`} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-0.5">{kpi.label}</p>
                <p className={`text-[26px] font-extrabold leading-none ${kpi.textColor}`}>{kpi.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════ TABLE CARD ════ */}
      <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.07)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.35)] border border-slate-200/80 dark:border-slate-700/60 transition-all duration-300">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 px-6 py-[18px] flex items-center justify-between">
          <h5 className="text-white font-bold text-[15px] tracking-wide flex items-center gap-2.5 m-0">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center">
              <i className={`bi ${activeCfg.icon} text-blue-300 text-sm`} />
            </div>
            {activeCfg.label}
            <span className="text-[11px] font-semibold bg-white/10 text-white/70 px-2.5 py-0.5 rounded-full border border-white/10">
              {activeList.length} total
            </span>
          </h5>
          {activePending > 0 && (
            <span className={`inline-flex items-center gap-1.5 border text-[11.5px] font-bold px-3 py-1.5 rounded-full ${activeCfg.headerPending}`}>
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeCfg.headerDot}`} />
              {activePending} pending
            </span>
          )}
        </div>

        {/* Body */}
        <div className="bg-white dark:bg-slate-800 transition-colors duration-300">
          {loading ? (
            <LoadingState />
          ) : activeTab === "password" ? (
            passwordRequests.length === 0 ? (
              <EmptyState message="No password requests" sub="Password change requests from users will appear here" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                        {[
                          { label: "#", cls: "w-14 text-center" },
                          { label: "User", cls: "text-left" },
                          { label: "Name", cls: "text-left" },
                          { label: "Requested At", cls: "text-left" },
                          { label: "Action", cls: "text-center" },
                        ].map((h) => (
                          <th key={h.label} className={`px-5 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${h.cls}`}>
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {pwdPagination.paginated.map((req, index) => (
                        <tr key={req.id} className="bg-white dark:bg-slate-800 hover:bg-violet-50/30 dark:hover:bg-slate-700/40 transition-colors duration-150">
                          <td className="px-5 py-4 text-center text-slate-400 dark:text-slate-500 font-semibold text-[13px]">
                            {(pwdPagination.currentPage - 1) * pwdPagination.perPage + index + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 shadow-sm">
                                {(req.username || "U").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">{req.username}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-left font-semibold text-slate-600 dark:text-slate-300 text-[13px]">{req.name}</td>
                          <td className="px-5 py-4 text-left text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                            {new Date(req.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {req.status === "Pending" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => approveRequest(req.id)} className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/60 dark:hover:bg-emerald-500 dark:hover:text-white hover:-translate-y-px">
                                  <i className="bi bi-check-circle-fill" /> Approve
                                </button>
                                <button onClick={() => declineRequest(req.id)} className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/60 dark:hover:bg-red-500 dark:hover:text-white hover:-translate-y-px">
                                  <i className="bi bi-x-circle-fill" /> Decline
                                </button>
                              </div>
                            ) : (
                              <StatusBadge status={req.status} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {pwdPagination.totalPages > 1 && (
                  <PaginationBar currentPage={pwdPagination.currentPage} totalPages={pwdPagination.totalPages} goToPage={pwdPagination.goToPage}
                    start={(pwdPagination.currentPage - 1) * pwdPagination.perPage + 1}
                    end={Math.min(pwdPagination.currentPage * pwdPagination.perPage, passwordRequests.length)}
                    total={passwordRequests.length} />
                )}
              </>
            )
          ) : (
            resumeRequests.length === 0 ? (
              <EmptyState message="No resume requests" sub="Account resume requests from paused users will appear here" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600/70">
                        {[
                          { label: "#", cls: "w-14 text-center" },
                          { label: "User", cls: "text-left" },
                          { label: "Name", cls: "text-left" },
                          { label: "Message", cls: "text-left" },
                          { label: "Requested At", cls: "text-left" },
                          { label: "Action", cls: "text-center" },
                        ].map((h) => (
                          <th key={h.label} className={`px-5 py-3.5 text-[11px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap ${h.cls}`}>
                            {h.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                      {resumePagination.paginated.map((req, index) => (
                        <tr key={req.id} className="bg-white dark:bg-slate-800 hover:bg-orange-50/30 dark:hover:bg-slate-700/40 transition-colors duration-150">
                          <td className="px-5 py-4 text-center text-slate-400 dark:text-slate-500 font-semibold text-[13px]">
                            {(resumePagination.currentPage - 1) * resumePagination.perPage + index + 1}
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center text-white text-[11px] font-extrabold shrink-0 shadow-sm">
                                {(req.username || "U").charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">{req.username}</span>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-left font-semibold text-slate-600 dark:text-slate-300 text-[13px]">{req.name}</td>
                          <td className="px-5 py-4 text-left text-slate-500 dark:text-slate-400 text-[12.5px] max-w-[200px]">
                            {req.message ? (
                              <span className="block truncate italic" title={req.message}>"{req.message}"</span>
                            ) : (
                              <span className="text-slate-300 dark:text-slate-600">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-left text-slate-500 dark:text-slate-400 text-[12.5px] whitespace-nowrap">
                            {new Date(req.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true })}
                          </td>
                          <td className="px-5 py-4 text-center">
                            {req.status === "Pending" ? (
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => resumeAccount(req.id)} className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/60 dark:hover:bg-emerald-500 dark:hover:text-white hover:-translate-y-px">
                                  <i className="bi bi-person-fill-check" /> Resume
                                </button>
                                <button onClick={() => cancelResumeRequest(req.id)} className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-md hover:shadow-red-200/50 px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-700/60 dark:hover:bg-red-500 dark:hover:text-white hover:-translate-y-px">
                                  <i className="bi bi-x-circle-fill" /> Cancel
                                </button>
                              </div>
                            ) : (
                              <StatusBadge status={req.status} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {resumePagination.totalPages > 1 && (
                  <PaginationBar currentPage={resumePagination.currentPage} totalPages={resumePagination.totalPages} goToPage={resumePagination.goToPage}
                    start={(resumePagination.currentPage - 1) * resumePagination.perPage + 1}
                    end={Math.min(resumePagination.currentPage * resumePagination.perPage, resumeRequests.length)}
                    total={resumeRequests.length} />
                )}
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default PasswordRequests;