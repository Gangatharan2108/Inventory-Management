import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export function usePermission() {
  const { user } = useContext(AuthContext);

  const can = (module, action) => {
    if (!user) return false;
    if (user.role === "Owner") return true;
    return !!user?.permissions?.[module]?.[action];
  };

  return { can };
}