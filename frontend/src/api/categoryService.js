import api from "./axios";

export const getCategories = () => api.get("/categories/");
export const getCategory = (id) => api.get(`/categories/${id}/`);
export const createCategory = (data) => api.post("/categories/create/", data);
export const updateCategory = (id, data) => api.put(`/categories/update/${id}/`, data);
export const deleteCategory = (id) => api.delete(`/categories/delete/${id}/`);