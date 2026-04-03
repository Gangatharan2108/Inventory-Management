import api from "./axios";

export const getRoles = async () => {
  const res = await api.get("/roles/");
  return res.data;
};

export const createRole = async (data) => {
  const res = await api.post("/roles/create/", data);
  return res.data;
};

export const updateRolePermissions = async (roleId, data) => {
  // Returns { role, updated_users, message }
  const res = await api.put(`/roles/update/${roleId}/`, data);
  return res.data;
};

export const deleteRole = async (roleId) => {
  const res = await api.delete(`/roles/delete/${roleId}/`);
  return res.data;
};

export const applyRoleDefaults = async (userId) => {
  // RESET: deletes user permissions and recreates from role defaults
  const res = await api.post(`/permissions/apply-defaults/${userId}/`);
  return res.data;
};