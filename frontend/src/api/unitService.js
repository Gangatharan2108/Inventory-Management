import api from "./axios"

export const getUnits = () => api.get("/units/");
export const getUnit = (id) => api.get(`/units/${id}/`);
export const createUnit = (data) => api.post("/units/create/", data);
export const updateUnit = (id, data) => api.put(`/units/update/${id}/`, data);
export const deleteUnit = (id) => api.delete(`/units/delete/${id}/`);