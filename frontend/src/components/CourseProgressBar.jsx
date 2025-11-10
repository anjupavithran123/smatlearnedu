import React from "react";

export default function CourseProgressBar({ percent = 0, small = false }) {
  const containerClass = small ? "h-2" : "h-4";
  return (
    <div className="w-full">
      <div className={`bg-gray-200 rounded ${containerClass} overflow-hidden`}>
        <div
          className="bg-blue-600 h-full text-xs text-white flex items-center justify-center"
          style={{ width: `${Math.max(0, Math.min(100, percent))}%` }}
        >
          {!small && <span className="px-2">{percent}%</span>}
        </div>
      </div>
    </div>
  );
}
