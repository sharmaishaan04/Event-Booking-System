import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("adminToken", res.data.token);
      navigate("/admin/dashboard");
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gradient-to-br from-gray-100 to-gray-300">
      <form
        onSubmit={handleLogin}
        className="bg-white/90 backdrop-blur-md p-10 rounded-2xl shadow-2xl w-full max-w-md"
      >
        <h1 className="text-3xl font-extrabold mb-2 text-center text-gray-800">
          Admin Portal
        </h1>
        <p className="text-sm text-gray-500 mb-8 text-center">
          Sign in with your credentials
        </p>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Email Address
          </label>
          <input
            type="email"
            placeholder="admin@example.com"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-600 mb-1">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-md hover:bg-blue-700 hover:shadow-lg transition"
        >
          Login
        </button>
      </form>
    </div>
  );
}
