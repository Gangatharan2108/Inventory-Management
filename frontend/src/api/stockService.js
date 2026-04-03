import api from "./axios"

export const addDamagedStock = (data) => api.post(`/damaged-stocks/`, data);
export const adjustStock = (data) => api.post(`/stock-adjustments/`, data);



