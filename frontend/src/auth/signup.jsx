import React, { useState } from "react";
import API from "../lib/api";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState("");
  const navigate = useNavigate();

  // ✅ Simple password strength logic
  const checkPasswordStrength = (value) => {
    if (value.length < 6) return "Weak";
    if (value.match(/[A-Z]/) && value.match(/[0-9]/) && value.match(/[^A-Za-z0-9]/))
      return "Strong";
    if (value.length >= 8) return "Medium";
    return "Weak";
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setStrength(checkPasswordStrength(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await API.post("/auth/signup", { name, email, password, role });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const getStrengthColor = () => {
    if (strength === "Weak") return "text-red-500";
    if (strength === "Medium") return "text-yellow-500";
    if (strength === "Strong") return "text-green-600";
    return "text-gray-400";
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-100 via-indigo-100 to-purple-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-700 text-white shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-4">
            <div className="h-14 w-14 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur">
              <span className="text-white font-extrabold text-xl">SL</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight">Smart_Learn</span>
              <span className="text-sm text-white/80">Learn. Practice. Grow.</span>
            </div>
          </Link>
        </div>
      </header>

      {/* Signup Form */}
      <main className="flex-1 flex items-center justify-center pt-10 pb-2 px-2">
      <form
        onSubmit={handleSubmit}
        className="bg-white/80 backdrop-blur-md shadow-lg rounded-2xl p-4 w-full max-w-md mt-15"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-900">
          Create an Account
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center bg-red-50 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
          />
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Choose a strong password"
            required
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 outline-none transition"
          />
          {password && (
            <p className={`text-sm mt-1 font-medium ${getStrengthColor()}`}>
              Strength: {strength}
            </p>
          )}
        </div>

        {/* Role selection */}
        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Role</label>
          <div className="flex gap-4">
            <label
              className={`flex-1 cursor-pointer p-3 rounded-lg border ${
                role === "student"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="student"
                checked={role === "student"}
                onChange={() => setRole("student")}
                className="mr-2"
              />
              <span className="font-medium">Student</span>
              <div className="text-xs text-gray-500">Enroll in courses</div>
            </label>

            <label
              className={`flex-1 cursor-pointer p-3 rounded-lg border ${
                role === "instructor"
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="radio"
                name="role"
                value="instructor"
                checked={role === "instructor"}
                onChange={() => setRole("instructor")}
                className="mr-2"
              />
              <span className="font-medium">Instructor</span>
              <div className="text-xs text-gray-500">Create & manage courses</div>
            </label>
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-700 hover:opacity-90 text-white font-semibold py-3 rounded-lg transition duration-200"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-gray-700 text-sm">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-700 font-semibold hover:underline"
          >
            Login
          </Link>
        </p>
      </form>
      </main>
    </div>
  );
}
