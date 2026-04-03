import api from "./axios";

// ✅ GET PERMISSIONS
export const getPermissions = async (userId) => {
  try {
    const res = await api.get(`/permissions/${userId}/`);
    return res.data;
  } catch (err) {
    console.error("Fetch permissions error:", err);
    throw err.response?.data || { error: "Failed to load permissions" };
  }
};

// ✅ UPDATE PERMISSIONS
export const updatePermissions = async (userId, data) => {
  try {
    const res = await api.post(`/permissions/${userId}/`, data);
    return res.data;
  } catch (err) {
    console.error("Permission update error:", err);
    throw err.response?.data || { error: "Something went wrong" };
  }
};