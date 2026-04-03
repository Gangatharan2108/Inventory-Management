/**
 * Sidebar order-ல் user-க்கு முதல் permission உள்ள page return பண்ணுது.
 * Login redirect + ProtectedRoute fallback இரண்டிலும் use பண்ணலாம்.
 */
export function getFirstPermittedPath(user) {
  if (!user) return "/";

  const can = (module, action) => {
    if (user.role === "Owner") return true;
    return !!user?.permissions?.[module]?.[action];
  };

  // Sidebar-ல் இருக்கற exact order
  if (can("dashboard",        "view"))   return "/dashboard";
  if (can("parties",          "view"))   return "/parties";
  if (can("products",         "view"))   return "/products";
  if (can("damaged_stock",    "create")) return "/damaged-stock";
  if (can("stock_adjustment", "create")) return "/stock-adjustment";
  if (can("categories",       "view"))   return "/categories";
  if (can("units",            "view"))   return "/units";
  if (can("sales",            "view"))   return "/sales";
  if (can("purchases",        "view"))   return "/purchases";
  if (can("payments",         "view"))   return "/payments";
  if (can("activity",         "view"))   return "/activity";
  if (can("current_stock",    "view"))   return "/reports/current-stock";
  if (can("low_stock",        "view"))   return "/reports/low-stock";
  if (can("sales_summary",    "view"))   return "/reports/sales-summary";
  if (can("profit_loss",      "view"))   return "/reports/profit-loss";
  if (can("customer_outstanding","view"))return "/reports/customer-outstanding";
  if (can("users",            "view"))   return "/users";
  if (can("create_user",      "create")) return "/create-user";

  // எந்த permission-உம் இல்லன்னா → no-access page
  return "/no-access";
}