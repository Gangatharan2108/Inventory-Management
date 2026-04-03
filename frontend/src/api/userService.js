// api/userService.js
import api from './axios';

export async function createUser(formData) {
  await api.get("/auth/csrf-cookie/");
  return api.post("/auth/create/", formData);
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
}

