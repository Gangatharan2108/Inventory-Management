import api from "./axios"

export const getUsers = () => api.get("/users/");
export const getUserById = (id) => api.get(`/users/${id}/`);
export const updateUser = (id, data) => api.put(`/users/update/${id}/`, data);
export const verifyOldPassword = (id, data) => api.post(`/users/verify-password/${id}/`, data);
export const toggleUserStatus = (id) => api.patch(`/users/toggle/${id}/`);
export const deleteUser = (id) => api.delete(`/users/delete/${id}/`);
