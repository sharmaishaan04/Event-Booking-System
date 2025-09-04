import { jwtDecode } from "jwt-decode";
export default function useAuth() {
  const token = localStorage.getItem("adminToken");
  if (!token) return null;

  try {
    const decoded = jwtDecode(token);
    return decoded;
  } catch (e) {
    return null;
  }
}
