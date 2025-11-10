import React, { useEffect, useState, useMemo } from "react";
import API from "../lib/api";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function InstructorDashboard() {
  const [summary, setSummary] = useState({});
  const [stats, setStats] = useState({ labels: [], sales: [], revenue: [] });
  const [rangeDays, setRangeDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async (range = rangeDays) => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, statsRes] = await Promise.all([
        API.get("/instructor/dashboard"),
        API.get(`/instructor/stats?range=${range}`),
      ]);
      setSummary(summaryRes.data ?? {});
      setStats(statsRes.data ?? { labels: [], sales: [], revenue: [] });
    } catch (err) {
      console.error("Instructor dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(rangeDays);
  }, [rangeDays]);

  const salesChartData = useMemo(() => {
    const labels = stats.labels || [];
    return {
      labels,
      datasets: [
        {
          label: "Sales (count)",
          data: stats.sales || [],
          type: "bar",
          yAxisID: "y-sales",
          backgroundColor: "rgba(59, 130, 246, 0.9)",
          borderRadius: 6,
        },
      ],
    };
  }, [stats]);

  const revenueChartData = useMemo(() => {
    const labels = stats.labels || [];
    return {
      labels,
      datasets: [
        {
          label: "Revenue (INR)",
          data: stats.revenue || [],
          fill: true,
          borderColor: "rgba(16, 185, 129, 1)",
          backgroundColor: "rgba(16, 185, 129, 0.12)",
          tension: 0.25,
          pointRadius: 3,
          yAxisID: "y-revenue",
        },
      ],
    };
  }, [stats]);

  const commonOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: false },
      tooltip: { mode: 'index', intersect: false },
    },
    interaction: { mode: 'index', intersect: false },
  };

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">Instructor Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">Quick insights on students, courses, sales & revenue</p>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <label className="text-sm text-gray-600">Range</label>
            <div className="inline-flex items-center space-x-2 bg-white border rounded-lg p-1 shadow-sm">
              <select
                value={rangeDays}
                onChange={(e) => setRangeDays(Number(e.target.value))}
                className="appearance-none px-3 py-2 text-sm bg-transparent outline-none"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={90}>90 days</option>
              </select>
              <button
                onClick={() => fetchData(rangeDays)}
                className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm shadow"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Loading / Error */}
        {loading ? (
          <div className="p-8 bg-white rounded-xl shadow-md text-center text-gray-600">Loading dashboard...</div>
        ) : error ? (
          <div className="p-6 bg-red-50 text-red-700 rounded-xl shadow-sm">{error}</div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {[
                { label: 'Students', value: summary?.usersCount ?? '—', color: 'indigo' },
                { label: 'Your Courses', value: summary?.coursesCount ?? '—', color: 'yellow' },
                { label: 'Sales', value: summary?.salesCount ?? '—', color: 'green' },
                { label: 'Revenue', value: `₹${Number(summary?.revenueTotal ?? 0).toFixed(2)}`, color: 'pink' },
              ].map((item, idx) => (
                <div key={idx} className={`bg-white/80 backdrop-blur-sm p-5 rounded-xl shadow hover:shadow-lg transition border-l-4 border-${item.color}-500`}>
                  <div className="text-sm text-gray-500">{item.label}</div>
                  <div className="mt-2 text-2xl font-bold text-gray-900">{item.value}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Sales (count)</h3>
                  <div className="text-sm text-gray-500">{stats?.labels?.length ?? 0} points</div>
                </div>
                <div className="h-64">
                  <Bar
                    options={{
                      ...commonOptions,
                      scales: {
                        x: { stacked: false },
                        "y-sales": { position: "left", beginAtZero: true },
                      },
                    }}
                    data={salesChartData}
                  />
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-md p-5 rounded-xl shadow">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Revenue (INR)</h3>
                  <div className="text-sm text-gray-500">{stats?.labels?.length ?? 0} points</div>
                </div>
                <div className="h-64">
                  <Line
                    options={{
                      ...commonOptions,
                      scales: {
                        x: { display: true },
                        "y-revenue": { position: "left", beginAtZero: true },
                      },
                    }}
                    data={revenueChartData}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600 text-center">Data shown for the last <span className="font-medium text-gray-800">{rangeDays} days</span>.</div>
          </>
        )}
      </div>
    </div>
  );
}