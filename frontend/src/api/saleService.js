import api from "./axios"


export const getSales = () => api.get("/sales/");
export const getSale = (id) => api.get(`/sales/${id}/`);
export const createSale = (data) => api.post("/sales/create/", data);
export const updateSale = (id, data) => api.put(`/sales/update/${id}/`, data);
export const deleteSale = (id) => api.delete(`/sales/delete/${id}/`);



    