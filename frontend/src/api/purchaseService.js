import api from "./axios"

export const getPurchases = () => api.get("/purchases/");
export const getPurchase = (id) => api.get(`/purchases/${id}/`);
export const createPurchase = (data) => api.post("/purchases/create/", data);


