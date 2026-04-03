import api from "./axios";

export const getParties = (type) => {
  if (type && type !== "All") {
    return api.get(`/parties/?type=${type}`);
  }
  return api.get("/parties/");
};
export const getParty = (id) => api.get(`/parties/${id}/`);
export const createParty = (data) => api.post("/parties/create/", data);
export const updateParty = (id, data) => api.put(`/parties/update/${id}/`, data);
export const deleteParty = (id) => api.delete(`/parties/delete/${id}/`);