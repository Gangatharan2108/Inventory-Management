import { Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getFirstPermittedPath } from "../utils/getFirstPermittedPath";

const ProtectedRoute = ({ children, module, action }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/" />;
  if (user.role === "Owner") {
    return children;
  }
  if (module && action) {
    const hasAccess = !!user.permissions?.[module]?.[action];
    if (!hasAccess) {
      const firstPath = getFirstPermittedPath(user);
      return <Navigate to={firstPath} replace />;
    }
  }
 
  return children;
};

export default ProtectedRoute;
