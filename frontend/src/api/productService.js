import api from "./axios";

export const getProducts = () => api.get("/products/");
export const getProduct = (id) => api.get(`/products/${id}/`);
export const createProduct = (data) => api.post("/products/create/", data);
export const updateProduct = (id, data) => api.put(`/products/update/${id}/`, data);
export const deleteProduct = (id) => api.delete(`/products/delete/${id}/`);