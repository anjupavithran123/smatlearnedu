// src/components/PurchaseButton.jsx
import React, { useState } from "react";
import API from "../lib/api";
import { useNavigate } from "react-router-dom";

/**
 * PurchaseButton
 * props:
 *  - courseId (string)
 *  - courseTitle (string)
 *  - coursePrice (number) // price in paise (optional; UI display only)
 *  - onSuccess (fn) optional callback after verification
 */
export default function PurchaseButton({ courseId, courseTitle, coursePrice = 0, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // support either env name: VITE_RAZORPAY_KEY_ID or VITE_RAZORPAY_KEY (some examples used different names)
  const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RAZORPAY_KEY || "";

  const loadRazorpayScript = () =>
    new Promise((resolve, reject) => {
      // If already available, resolve immediately
      if (window.Razorpay) return resolve(true);
      // Avoid adding duplicate script tags
      const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existing) {
        existing.addEventListener("load", () => (window.Razorpay ? resolve(true) : reject(new Error("Razorpay failed to initialize"))));
        existing.addEventListener("error", () => reject(new Error("Razorpay SDK failed to load")));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => (window.Razorpay ? resolve(true) : reject(new Error("Razorpay failed to initialize")));
      script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
      document.body.appendChild(script);
    });

  // Try to parse user from localStorage for prefill (optional)
  const getPrefill = () => {
    try {
      const userRaw = localStorage.getItem("user");
      if (!userRaw) return { name: "", email: "" };
      const user = JSON.parse(userRaw);
      return { name: user.name || "", email: user.email || "" };
    } catch {
      return { name: "", email: "" };
    }
  };

  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      // require login
      const token = localStorage.getItem("token");
      if (!token) {
        setLoading(false);
        navigate("/login");
        return;
      }

      if (!RAZORPAY_KEY_ID) {
        throw new Error("Missing Razorpay public key. Add VITE_RAZORPAY_KEY_ID (or VITE_RAZORPAY_KEY) to your .env");
      }

      // 1) ask backend to create order for this course (backend uses DB price)
      // DO NOT pass price from frontend
      const resp = await API.post(`/payments/courses/${courseId}/create-order`);
      const { order } = resp.data || {};
      if (!order || !(order.id || order.id === 0)) {
        throw new Error("Invalid order received from server");
      }

      // 2) load Razorpay SDK
      await loadRazorpayScript();
      if (!window.Razorpay) throw new Error("Razorpay SDK failed to load");

      const prefill = getPrefill();

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount, // razorpay expects paise integer
        currency: order.currency || "INR",
        name: "Your Platform Name",
        description: courseTitle || "Course purchase",
        order_id: order.id,
        handler: async (response) => {
          try {
            // 3) Verify payment on server
            const verify = await API.post(`/payments/verify-payment`, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              courseId,
            });

            if (verify.data?.success) {
              if (typeof onSuccess === "function") {
                try {
                  onSuccess(verify.data);
                } catch (cbErr) {
                  console.error("PurchaseButton onSuccess callback error:", cbErr);
                }
              }
              // caller will typically refresh state; we show a short alert
              alert("Payment successful and verified!");
            } else {
              const msg = verify.data?.message || "Payment verification failed on server.";
              setError(msg);
            }
          } catch (e) {
            console.error("Verification error:", e);
            setError(e.response?.data?.message || e.message || "Server verification failed.");
          }
        },
        prefill,
        theme: { color: "#0b5ed7" },
      };

      const rzp = new window.Razorpay(options);

      // handle payment failed
      rzp.on && rzp.on("payment.failed", (err) => {
        console.error("Payment failed", err);
        setError(err.error?.description || err.error?.reason || "Payment failed");
      });

      rzp.open();
    } catch (err) {
      console.error("PurchaseButton error:", err);
      setError(err.message || "Could not initiate payment");
    } finally {
      setLoading(false);
    }
  };

  // display price if provided (assume paise)
  const displayPrice =
    typeof coursePrice === "number" && coursePrice > 0 ? `₹${(coursePrice / 100).toFixed(2)}` : null;

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg disabled:opacity-60"
      >
        {loading ? "Processing..." : displayPrice ? `Pay ${displayPrice} & Enroll` : "Pay & Enroll"}
      </button>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
