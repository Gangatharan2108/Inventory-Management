import api from "./axios"

export const getPayments = () => api.get("/payments/");