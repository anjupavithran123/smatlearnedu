// src/pages/Course.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaChevronLeft, FaLock, FaPlay, FaCheckCircle } from "react-icons/fa";
import API from "../lib/api";
import useCourseProgress from "../hooks/useCourseProgress";
import PurchaseButton from "../components/PurchaseButton";

/* prettier: small, styled progress bar */
const CourseProgressBar = ({ percent }) => (
  <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
    <div
      className="h-3 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 shadow-sm"
      style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
    />
  </div>
);

export default function Course() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [marking, setMarking] = useState(false);

  const { progress, fetchProgress, markComplete } = useCourseProgress(courseId);
  const makeVideoItemId = useCallback((index) => `video:${courseId}:${index}`, [courseId]);

  const displayPrice = useMemo(() => {
    if (!course || !course.price) return "Free";
    try {
      return (course.price / 100).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
      });
    } catch {
      return `${course.price}`;
    }
  }, [course]);

  const parseVideoLink = (url) => {
    if (!url) return { type: "unknown", idOrUrl: "" };

    const ytMatch = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/
    );
    if (ytMatch) return { type: "youtube", idOrUrl: ytMatch[1] };

    const lower = url.toLowerCase();
    if (/\.(mp4|webm|ogg)(\?.*)?$/.test(lower)) return { type: "video", idOrUrl: url };
    if (/^https?:\/\//.test(url)) return { type: "external", idOrUrl: url };

    return { type: "unknown", idOrUrl: url };
  };

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/courses/${courseId}`);
        const c = res.data.course || {};
        const enrolledFlag = res.data.isEnrolled ?? !!c.isEnrolled ?? false;

        if (cancelled) return;
        setCourse(c);
        setIsEnrolled(Boolean(enrolledFlag));

        const links = Array.isArray(c.videoLinks) ? c.videoLinks.filter(Boolean) : [];
        await fetchProgress(links.length);

        const completedItems = (progress && progress.completedItems) || [];
        const firstNotDone = links.findIndex((_, i) => !completedItems.includes(makeVideoItemId(i)));
        const startIndex = firstNotDone >= 0 ? firstNotDone : 0;
        setCurrentVideoIndex(startIndex);
      } catch (err) {
        if (cancelled) return;
        setError(err.response?.data?.message || err.message || "Could not load course");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchCourse();
    return () => {
      cancelled = true;
    };
    // note: fetchProgress/progress intentionally not in deps to avoid loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleEnroll = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");
      await API.post(`/courses/${courseId}/enroll`);
      alert("Enrolled successfully");
      setIsEnrolled(true);
      setCourse((prev) => ({ ...prev, isEnrolled: true }));
      await fetchProgress(course?.videoLinks?.length || 0);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Enroll failed");
    }
  };

  const handlePayAndEnroll = async () => {
    if (!course) return;
    try {
      const token = localStorage.getItem("token");
      if (!token) return navigate("/login");

      const res = await API.post(`/payments/courses/${courseId}/create-order`);
      const { order } = res.data;
      if (!order) throw new Error("No order returned from server");

      if (!window.Razorpay) {
        alert("Payment provider not loaded. Try again later.");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "",
        amount: order.amount,
        currency: order.currency,
        name: "Smart_Learn",
        description: course.title,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verify = await API.post(`/payments/verify-payment`, {
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature,
              courseId,
            });
            if (verify.data?.success) {
              alert("Payment successful! You are enrolled.");
              setIsEnrolled(true);
              setCourse((prev) => ({ ...prev, isEnrolled: true }));
              await fetchProgress(course.videoLinks?.length || 0);
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            alert("Payment verification failed.");
          }
        },
        prefill: { name: "", email: "" },
        theme: { color: "#f97316" }, // orange theme
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Payment failed");
    }
  };

  const handleVideoComplete = async (index) => {
    if (!course) return;
    if (course.price > 0 && !isEnrolled) {
      alert("Purchase the course to mark progress.");
      return;
    }

    const itemId = makeVideoItemId(index);
    const totalItems = course.videoLinks?.length || 0;
    if (marking) return;
    setMarking(true);
    try {
      await markComplete(itemId, totalItems);
      await fetchProgress(totalItems);
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Could not mark complete");
    } finally {
      setMarking(false);
    }
  };

  const MainPlayer = ({ url, index }) => {
    if (!url) return null;
    const parsed = parseVideoLink(url);

    if (parsed.type === "youtube") {
      return (
        <div className="relative pb-[56.25%] h-0 mb-6 rounded-lg overflow-hidden shadow">
          <iframe
            title={`course-video-${index}`}
            src={`https://www.youtube.com/embed/${parsed.idOrUrl}`}
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>
      );
    }
    if (parsed.type === "video") {
      return (
        <video
          controls
          className="w-full rounded-lg shadow mb-6"
          onEnded={() => handleVideoComplete(index)}
        >
          <source src={parsed.idOrUrl} />
          Your browser does not support the video tag.
        </video>
      );
    }
    return (
      <div className="mb-6">
        <p className="text-sm text-gray-500">Cannot preview this video automatically.</p>
        <a href={url} target="_blank" rel="noreferrer" className="text-orange-500 hover:underline">
          Open video
        </a>
      </div>
    );
  };

  if (loading) return <div className="p-8 text-gray-600 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-red-600 text-center">{error}</div>;
  if (!course) return <div className="p-8 text-gray-600 text-center">Course not found</div>;

  const links = Array.isArray(course.videoLinks) ? course.videoLinks.filter(Boolean) : [];
  const completedItems = progress?.completedItems || [];
  const currentItemId = makeVideoItemId(currentVideoIndex);
  const totalVideos = links.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white p-6">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-lg">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white shadow">
              <FaPlay className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{course.title}</h1>
              <div className="text-sm text-gray-500 mt-1">
                By <span className="font-medium text-gray-700">{course.instructor || "Unknown"}</span> •{" "}
                <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                  {displayPrice}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              type="button"
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              aria-label="Back"
            >
              <FaChevronLeft />
            </button>

            {/* Primary CTA(s) */}
            {course.price > 0 ? (
              isEnrolled ? (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-100 rounded-full text-amber-700 font-semibold">
                  <FaCheckCircle /> Purchased
                </div>
              ) : (
                <div className="flex gap-2">
                  <PurchaseButton
                    courseId={courseId}
                    courseTitle={course.title}
                    coursePrice={course.price}
                    onSuccess={async () => {
                      setIsEnrolled(true);
                      setCourse((prev) => ({ ...prev, isEnrolled: true }));
                      await fetchProgress(totalVideos);
                    }}
                  />
                  <button
                    onClick={() => handlePayAndEnroll()}
                    type="button"
                    className="px-4 py-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-600 hover:shadow transition"
                  >
                    Quick pay
                  </button>
                </div>
              )
            ) : (
              <button
                onClick={handleEnroll}
                type="button"
                className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white shadow-md transition"
              >
                Enroll now
              </button>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-gray-700">Course progress</div>
            <div className="text-sm text-gray-500">{progress?.percentComplete ?? 0}%</div>
          </div>
          <CourseProgressBar percent={progress?.percentComplete ?? 0} />
        </div>

        {/* Player / Locked overlay */}
        {course.price > 0 && !isEnrolled ? (
          <div className="relative rounded-lg overflow-hidden mb-6">
            <div aria-hidden className="filter blur-sm pointer-events-none select-none">
              {links.length > 0 ? (
                <MainPlayer url={links[currentVideoIndex]} index={currentVideoIndex} />
              ) : (
                <div className="mb-6 text-gray-500">No videos to preview.</div>
              )}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/95 p-6 rounded-xl shadow-2xl text-center max-w-md">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-100 text-orange-600 mx-auto mb-3">
                  <FaLock />
                </div>
                <h3 className="text-lg font-semibold mb-2">Locked Content</h3>
                <p className="text-sm text-gray-600 mb-4">This course is paid. Purchase to unlock full access to all videos and track your progress.</p>
                <div className="flex justify-center gap-3">
                  <PurchaseButton
                    courseId={courseId}
                    courseTitle={course.title}
                    coursePrice={course.price}
                    onSuccess={async () => {
                      setIsEnrolled(true);
                      setCourse((prev) => ({ ...prev, isEnrolled: true }));
                      await fetchProgress(totalVideos);
                    }}
                  />
                  <button onClick={() => handlePayAndEnroll()} className="px-3 py-2 text-sm underline text-orange-600">
                    Quick pay
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : links.length > 0 ? (
          <MainPlayer url={links[currentVideoIndex]} index={currentVideoIndex} />
        ) : (
          <div className="mb-6 text-gray-500">No videos to preview.</div>
        )}

        {/* Mark complete */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => handleVideoComplete(currentVideoIndex)}
            disabled={
              marking ||
              (course.price > 0 && !isEnrolled) ||
              completedItems.includes(currentItemId)
            }
            className={`px-4 py-2 rounded-lg shadow-sm transition font-medium ${
              completedItems.includes(currentItemId)
                ? "bg-gray-200 text-gray-600 cursor-default"
                : "bg-orange-500 hover:bg-orange-600 text-white"
            }`}
          >
            {marking ? "Saving..." : completedItems.includes(currentItemId) ? "Completed" : "Mark this video as complete"}
          </button>

          <div className="text-sm text-gray-500">
            {completedItems.length}/{totalVideos} completed
          </div>
        </div>

        {/* Video list / thumbnails */}
        {links.length > 1 && (
          <div className="mb-6">
            <h3 className="font-medium mb-3 text-gray-800">Videos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {links.map((l, idx) => {
                const parsed = parseVideoLink(l);
                const thumb =
                  parsed.type === "youtube"
                    ? `https://img.youtube.com/vi/${parsed.idOrUrl}/hqdefault.jpg`
                    : null;
                const isLocked = course.price > 0 && !isEnrolled;
                const active = idx === currentVideoIndex;

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (isLocked) {
                        alert("Purchase the course to access this video.");
                        return;
                      }
                      setCurrentVideoIndex(idx);
                    }}
                    type="button"
                    className={`flex items-center gap-3 p-3 border rounded-lg text-left transition ${
                      active ? "border-orange-400 bg-orange-50 shadow-sm" : "hover:shadow-sm"
                    } ${isLocked ? "opacity-70" : ""}`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={`thumb-${idx}`}
                        className="w-28 h-16 object-cover rounded"
                      />
                    ) : (
                      <div className="w-28 h-16 flex items-center justify-center bg-gray-100 rounded text-xs text-gray-600">
                        Preview
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="font-medium text-gray-800">Video {idx + 1}</div>
                      <div className="text-sm text-gray-500 truncate" style={{ maxWidth: 420 }}>{l}</div>
                      <div className="mt-1 text-xs">
                        {completedItems.includes(makeVideoItemId(idx)) ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <FaCheckCircle /> Completed
                          </span>
                        ) : isLocked ? (
                          <span className="inline-flex items-center gap-1 text-orange-500">
                            <FaLock /> Locked
                          </span>
                        ) : (
                          <span className="text-sm text-gray-500">Preview available</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="prose max-w-none mb-6">
          <p className="text-gray-700 leading-relaxed">{course.description}</p>
        </div>
      </div>
    </div>
  );
}
