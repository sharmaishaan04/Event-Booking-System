import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000,
});

export default API;
