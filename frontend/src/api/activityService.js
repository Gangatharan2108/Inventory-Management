import api from "./axios";

export const getActivities = () => api.get("/activities/");