import { Routes, Route } from "react-router-dom";
import Layout from "../layouts/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Dashboard from "../pages/Dashboard/Dashboard";
import ActivityList from "../pages/Activity/ActivityList";
import CategoryList from "../pages/Categories/CategoryList";
import CategoryForm from "../pages/Categories/CategoryForm";
import PartyList from "../pages/Parties/PartyList";
import PartyForm from "../pages/Parties/PartyForm";
import PaymentList from "../pages/Payments/PaymentList";
import PaymentSuccess from "../pages/Payments/PaymentSuccess";
import ProductList from "../pages/Products/ProductList";
import ProductForm from "../pages/Products/ProductForm";
import PurchaseList from "../pages/Purchases/PurchaseList";
import PurchaseForm from "../pages/Purchases/PurchaseForm";
import PurchaseDetail from "../pages/Purchases/PurchaseDetail";
import Login from "../pages/Auth/Login";
import CreateUser from "../pages/Auth/CreateUser";
import SaleList from "../pages/Sales/SaleList";
import SaleForm from "../pages/Sales/SaleForm";
import SaleDetail from "../pages/Sales/SaleDetail";
import UnitList from "../pages/Units/UnitList";
import UnitForm from "../pages/Units/UnitForm";
import StockAdjustmentForm from "../pages/Stocks/StockAdjustmentForm";
import DamagedStockForm from "../pages/Stocks/DamagedStockForm";
import UserList from "../pages/User/UserList";
import UserForm from "../pages/User/UserForm";
import CurrentStockReport from "../pages/reports/CurrentStockReport";
import LowStockReport from "../pages/reports/LowStockReport";
import SalesSummaryReport from "../pages/reports/SalesSummaryReport";
import ProfitLossReport from "../pages/reports/ProfitLossReport";
import CustomerOutstandingReport from "../pages/reports/CustomerOutstandingReport";
import PasswordRequests from "../pages/UserProfile/PasswordRequests";
import PermissionPage from "../pages/Permission/PermissionPage";
import NoAccess from "../pages/NoAccess";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            {" "}
            <Layout />{" "}
          </ProtectedRoute>
        }
      >
        <Route
          path="dashboard"
          element={
            <ProtectedRoute module="dashboard" action="view">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/password-requests"
          element={
            <ProtectedRoute module="users" action="update">
              <PasswordRequests />
            </ProtectedRoute>
          }
        />

        <Route
          path="create-user"
          element={
            <ProtectedRoute module="create_user" action="create">
              <CreateUser />
            </ProtectedRoute>
          }
        />

        <Route
          path="users"
          element={
            <ProtectedRoute module="users" action="view">
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="users/edit/:id"
          element={
            <ProtectedRoute module="users" action="update">
              <UserForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="categories"
          element={
            <ProtectedRoute module="categories" action="view">
              <CategoryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/create"
          element={
            <ProtectedRoute module="categories" action="create">
              <CategoryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="categories/edit/:id"
          element={
            <ProtectedRoute module="categories" action="update">
              <CategoryForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="parties"
          element={
            <ProtectedRoute module="parties" action="view">
              <PartyList />
            </ProtectedRoute>
          }
        />
        <Route
          path="parties/create"
          element={
            <ProtectedRoute module="parties" action="create">
              <PartyForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="parties/edit/:id"
          element={
            <ProtectedRoute module="parties" action="update">
              <PartyForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="products"
          element={
            <ProtectedRoute module="products" action="view">
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/create"
          element={
            <ProtectedRoute module="products" action="create">
              <ProductForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="products/edit/:id"
          element={
            <ProtectedRoute module="products" action="update">
              <ProductForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="sales"
          element={
            <ProtectedRoute module="sales" action="view">
              <SaleList />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/create"
          element={
            <ProtectedRoute module="sales" action="create">
              <SaleForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="sales/:id"
          element={
            <ProtectedRoute module="sales" action="view">
              <SaleDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="purchases"
          element={
            <ProtectedRoute module="purchases" action="view">
              <PurchaseList />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchases/create"
          element={
            <ProtectedRoute module="purchases" action="create">
              <PurchaseForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="purchases/:id"
          element={
            <ProtectedRoute module="purchases" action="view">
              <PurchaseDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="units"
          element={
            <ProtectedRoute module="units" action="view">
              <UnitList />
            </ProtectedRoute>
          }
        />
        <Route
          path="units/create"
          element={
            <ProtectedRoute module="units" action="create">
              <UnitForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="units/edit/:id"
          element={
            <ProtectedRoute module="units" action="update">
              <UnitForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="stock-adjustment"
          element={
            <ProtectedRoute module="stock_adjustment" action="create">
              <StockAdjustmentForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="damaged-stock"
          element={
            <ProtectedRoute module="damaged_stock" action="create">
              <DamagedStockForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="payments"
          element={
            <ProtectedRoute module="payments" action="view">
              <PaymentList />
            </ProtectedRoute>
          }
        />

        <Route
          path="activity"
          element={
            <ProtectedRoute module="activity" action="view">
              <ActivityList />
            </ProtectedRoute>
          }
        />

        <Route
          path="reports/current-stock"
          element={
            <ProtectedRoute module="current_stock" action="view">
              <CurrentStockReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/low-stock"
          element={
            <ProtectedRoute module="low_stock" action="view">
              <LowStockReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/sales-summary"
          element={
            <ProtectedRoute module="sales_summary" action="view">
              <SalesSummaryReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/profit-loss"
          element={
            <ProtectedRoute module="profit_loss" action="view">
              <ProfitLossReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="reports/customer-outstanding"
          element={
            <ProtectedRoute module="customer_outstanding" action="view">
              <CustomerOutstandingReport />
            </ProtectedRoute>
          }
        />

        <Route
          path="permissions"
          element={
            <ProtectedRoute module="users" action="update">
              <PermissionPage />
            </ProtectedRoute>
          }
        />
        <Route path="/payment-success" element={<ProtectedRoute><PaymentSuccess /></ProtectedRoute>} />
      </Route>
      <Route path="/no-access" element={<NoAccess />} />
    </Routes>
  );
};

export default AppRoutes;
