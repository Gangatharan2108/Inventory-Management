import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import { getFirstPermittedPath } from "../../utils/getFirstPermittedPath";
import axios from "../../api/axios";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [formData, setFormData] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  // Account-hold state
  const [accountHold, setAccountHold] = useState(false);
  const [holdUsername, setHoldUsername] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState("");

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await login(formData.username, formData.password);
      const userData = res.data;
      setUser(userData);
      navigate(getFirstPermittedPath(userData));
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.error === "account_hold") {
        setAccountHold(true);
        setHoldUsername(formData.username);
        setError("");
      } else {
        setError(errData?.error || "Invalid username or password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSendResumeRequest = async () => {
    setRequestError("");
    setRequestLoading(true);
    try {
      await axios.post("/request-account-resume/", {
        username: holdUsername,
        message: resumeMessage,
      });
      setRequestSent(true);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to send request. Please try again.";
      setRequestError(
        msg === "Request already pending"
          ? "You already have a pending request. Please wait for the owner to respond."
          : msg
      );
    } finally {
      setRequestLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setAccountHold(false);
    setRequestSent(false);
    setResumeMessage("");
    setRequestError("");
    setHoldUsername("");
    setFormData({ username: "", password: "" });
  };

  return (
    /* ── Full-page wrapper ── */
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 transition-colors duration-300 px-4">
      {/* ── Decorative blobs (light mode only) ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-100/60 dark:bg-blue-900/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-100/60 dark:bg-indigo-900/10 blur-3xl" />
      </div>

      {/* ── Card ── */}
      <div className="relative w-full max-w-[420px] rounded-[28px] bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/60 shadow-[0_20px_60px_rgba(0,0,0,0.10)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden transition-colors duration-300">
        {/* Top accent gradient bar */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${accountHold ? "from-orange-500 via-amber-500 to-yellow-500" : "from-blue-500 via-indigo-500 to-violet-500"}`} />

        <div className="px-8 pt-8 pb-10">

          {/* ══════════ ACCOUNT HOLD VIEW ══════════ */}
          {accountHold ? (
            <div className="flex flex-col gap-5">
              {/* Icon + heading */}
              <div className="flex flex-col items-center gap-3 mb-1">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
                  <i className="bi bi-lock-fill text-white text-2xl" />
                </div>
                <div className="text-center">
                  <h1 className="text-[20px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0">
                    Account On Hold
                  </h1>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0 font-medium">
                    Your account has been paused by the owner.
                  </p>
                </div>
              </div>

              {/* Hold notice banner */}
              <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/60 rounded-2xl px-4 py-3.5">
                <i className="bi bi-exclamation-triangle-fill text-amber-500 text-base mt-0.5 shrink-0" />
                <p className="text-[13px] text-amber-800 dark:text-amber-300 font-semibold m-0 leading-relaxed">
                  Your access has been temporarily restricted. Send a request to the owner to resume your account.
                </p>
              </div>

              {/* ── Request sent success ── */}
              {requestSent ? (
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <i className="bi bi-check2-circle text-emerald-500 text-3xl" />
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-[15px] m-0">
                      Request Sent!
                    </p>
                    <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0">
                      The owner will review your request and resume your account shortly.
                    </p>
                  </div>
                  <button
                    onClick={handleBackToLogin}
                    className="mt-2 w-full h-[46px] rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                  >
                    <i className="bi bi-arrow-left me-2" />
                    Back to Login
                  </button>
                </div>
              ) : (
                <>
                  {/* Message textarea */}
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                      Message to Owner{" "}
                      <span className="text-slate-400 dark:text-slate-500 font-semibold normal-case tracking-normal">
                        (optional)
                      </span>
                    </label>
                    <textarea
                      rows={3}
                      value={resumeMessage}
                      onChange={(e) => setResumeMessage(e.target.value)}
                      placeholder="Explain why you need your account resumed..."
                      className="w-full px-4 py-3 rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 dark:focus:border-amber-400 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200 resize-none"
                    />
                  </div>

                  {/* Request error */}
                  {requestError && (
                    <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-[13px] font-semibold rounded-xl px-4 py-3">
                      <i className="bi bi-exclamation-circle-fill text-red-500 shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  {/* Send request button */}
                  <button
                    onClick={handleSendResumeRequest}
                    disabled={requestLoading}
                    className="w-full h-[50px] rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-amber-200/60 dark:shadow-amber-900/30 hover:shadow-xl hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                  >
                    {requestLoading ? (
                      <>
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill text-base" />
                        Send Resume Request
                      </>
                    )}
                  </button>

                  {/* Back to login */}
                  <button
                    onClick={handleBackToLogin}
                    className="w-full h-[44px] rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                  >
                    <i className="bi bi-arrow-left me-2" />
                    Back to Login
                  </button>
                </>
              )}
            </div>
          ) : (
            /* ══════════ NORMAL LOGIN VIEW ══════════ */
            <>
              {/* ── Brand / Logo area ── */}
              <div className="flex flex-col items-center gap-3 mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-blue-900/40">
                  <i className="bi bi-box-seam-fill text-white text-2xl" />
                </div>
                <div className="text-center">
                  <h1 className="text-[22px] font-extrabold text-slate-900 dark:text-slate-100 tracking-tight m-0">
                    Inventory Login
                  </h1>
                  <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-1 m-0 font-medium">
                    Sign in to your account to continue
                  </p>
                </div>
              </div>

              {/* ── Error alert ── */}
              {error && (
                <div className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-400 text-[13px] font-semibold rounded-xl px-4 py-3 mb-5">
                  <i className="bi bi-exclamation-circle-fill text-red-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                {/* Username */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Username
                  </label>
                  <div className="relative">
                    <i className="bi bi-person-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[14px] pointer-events-none" />
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      placeholder="Enter your username"
                      className="w-full h-[48px] pl-10 pr-4 rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <i className="bi bi-lock-fill absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-[14px] pointer-events-none" />
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      placeholder="Enter your password"
                      className="w-full h-[48px] pl-10 pr-11 rounded-xl border-[1.5px] border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 focus:bg-white dark:focus:bg-slate-700 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(!showPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 text-[15px] transition-colors duration-200"
                    >
                      <i
                        className={`bi ${showPass ? "bi-eye-slash-fill" : "bi-eye-fill"}`}
                      />
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-[50px] mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[15px] font-bold flex items-center justify-center gap-2.5 shadow-lg shadow-blue-200/60 dark:shadow-blue-900/30 hover:shadow-xl hover:-translate-y-px transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-box-arrow-in-right text-base" />
                      Login
                    </>
                  )}
                </button>
              </form>

              {/* ── Footer note ── */}
              <p className="text-center text-[12px] text-slate-400 dark:text-slate-500 font-medium mt-6 m-0">
                <i className="bi bi-shield-lock me-1.5" />
                Secured login · Inventory Management System
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
