import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import API, { setAuthToken } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password });
      const { token, user } = res.data;
      if (!token) throw new Error("No token returned");

      localStorage.setItem("token", token);
      if (user) {
        localStorage.setItem("user", JSON.stringify(user));
      } else {
        setAuthToken(token);
        const profileRes = await API.get("/auth/profile");
        localStorage.setItem("user", JSON.stringify(profileRes.data.user));
      }

      setAuthToken(token);
      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
      const role = storedUser.role || "student";

      if (role === "instructor") navigate("/instructor");
      else if (role === "admin") navigate("/admin");
      else navigate("/student");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 via-indigo-100 to-purple-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          {/* Logo and Title */}
          <Link to="/" className="inline-flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur">
              <span className="text-white font-extrabold text-xl">SL</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Smart_Learn
              </span>
              <span className="text-sm text-white/80">
                Learn. Practice. Grow.
              </span>
            </div>
          </Link>

          {/* Home Button */}
          <Link
            to="/"
            className="text-white font-semibold text-lg bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition"
          >
            Home
          </Link>
        </div>
      </header>

      {/* Login Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md p-8 rounded-xl shadow-lg w-full max-w-md mt-20"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Login
        </h2>

        {error && (
          <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-center">
            {error}
          </div>
        )}

        {/* Email */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="you@example.com"
          />
        </div>

        {/* Password */}
        <div className="mb-6 relative">
          <label className="block text-sm font-medium mb-1">Password</label>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            required
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded p-2 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-gray-500 hover:text-indigo-600"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-700 text-white py-2 rounded hover:opacity-90 transition"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Signup link */}
        <p className="text-center text-sm text-gray-700 mt-4">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="text-indigo-700 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}
