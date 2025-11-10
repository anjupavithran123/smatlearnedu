import React, { useState } from "react";
import API from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [strength, setStrength] = useState(""); // password strength indicator
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

  // ✅ Dynamic color for strength
  const getStrengthColor = () => {
    if (strength === "Weak") return "text-red-500";
    if (strength === "Medium") return "text-yellow-500";
    if (strength === "Strong") return "text-green-600";
    return "text-gray-400";
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-2xl rounded-2xl p-8 w-full max-w-md border border-gray-100"
      >
        <h2 className="text-3xl font-bold mb-6 text-center text-orange-600">
          Create an Account
        </h2>

        {error && (
          <div className="mb-4 text-red-600 text-sm text-center bg-red-50 py-2 rounded-md">
            {error}
          </div>
        )}

        {/* Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Full name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
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
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
          />
        </div>

        {/* Password + strength meter */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="Choose a strong password"
            required
            className="w-full border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-orange-400 focus:border-orange-400 outline-none transition"
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
                  ? "border-orange-500 bg-orange-50"
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
                  ? "border-orange-500 bg-orange-50"
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
          className="w-full bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-semibold py-3 rounded-lg transition duration-200"
        >
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p className="mt-4 text-center text-gray-600 text-sm">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-orange-500 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>
      </form>
    </div>
  );
}
