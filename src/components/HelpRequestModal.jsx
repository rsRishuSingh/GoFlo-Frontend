import React, { useState } from "react";
import "remixicon/fonts/remixicon.css";

const HelpRequestModal = ({ isOpen, onClose, user, socket, onSuccess }) => {
  // =========================================================================
  // LOGIC SECTION - STRICTLY UNTOUCHED
  // =========================================================================
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
    "Content-Type": "application/json",
  });

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
      } else {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
        );
      }
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/help/send-request`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            location: { lat: latitude, lng: longitude },
            description: description.trim() || "",
          }),
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send help request");
      }

      const helpRequestId = data.data?.helpRequestId;

      setSuccess(
        `Help request sent! Notified ${data.data?.notificationsSent ?? 0} nearby medics.`,
      );
      setDescription("");

      onSuccess?.({
        helpRequestId,
        location: { lat: latitude, lng: longitude },
      });

      if (socket && helpRequestId && user?._id) {
        socket.emit("join-help-pending", {
          helpRequestId,
          userId: user._id,
        });
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setSuccess("");
      if (err.code === "PermissionDenied" || err.code === 1) {
        setError("Location permission denied. Please enable location services.");
      } else if (err.message === "Geolocation is not supported") {
        setError("Geolocation is not supported on this device.");
      } else {
        setError(err.message || "Failed to send help request");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // =========================================================================
  // UI SECTION - UPDATED FOR FULL SCREEN & MOBILE KEYBOARD FIX
  // =========================================================================
  return (
    // Outer overlay: gray/black background only shows on desktop (sm) screens
    <div className="fixed inset-0 z-50 bg-white sm:bg-black/60 flex items-end sm:items-center justify-center sm:p-4">

      {/* Inner Container: h-[100dvh] ensures it perfectly fits the screen on mobile, recalculating when keyboard opens */}
      <div className="bg-white w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col relative animate-slide-up sm:animate-none">

        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">

          {/* STATIC HEADER AREA: Won't scroll away */}
          <div className="flex-shrink-0 pt-4 px-6 pb-2">
            {/* Top Handle Indicator (Hidden on full screen mobile, visible on desktop) */}
            <div className="hidden sm:flex w-full justify-center mb-5">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <h3 className="text-[22px] font-bold text-gray-900 tracking-tight">Request Help</h3>
              <div className="flex gap-1.5">
                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                <span className="h-2 w-2 bg-red-500 rounded-full"></span>
              </div>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2 shadow-sm mb-4">
                <i className="ri-error-warning-fill mt-0.5 flex-shrink-0 text-lg" />
                <p className="mt-0.5 leading-snug">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-[#eefcf1] border border-[#d2f4d6] text-[#2e7d32] px-4 py-3 rounded-xl text-sm flex items-start gap-2 shadow-sm mb-4">
                <i className="ri-checkbox-circle-fill mt-0.5 flex-shrink-0 text-lg text-green-600" />
                <p className="mt-0.5 font-medium leading-snug">{success}</p>
              </div>
            )}
          </div>

          {/* SCROLLABLE CONTENT AREA: Pushes up when keyboard appears */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">
            {/* Timeline Info */}
            <div className="flex flex-col gap-y-5 mb-6">
              {/* Requesting As */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center mt-1.5 relative">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full z-10"></div>
                  <div className="absolute top-3 w-[2px] h-[35px] border-l-[2.5px] border-dotted border-gray-300"></div>
                </div>
                <div className="w-full">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Requesting as</h3>
                  <h3 className="text-base font-semibold text-gray-900 leading-none mb-1">
                    {user?.fullname?.firstname || "Ram"} {user?.fullname?.lastname || "Singh"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {user?.email || "new@dtu.ac.in"}
                  </p>
                </div>
              </div>

              {/* Location Info */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center mt-1.5">
                  <div className="w-2.5 h-2.5 bg-red-600 rounded-[2px] z-10"></div>
                </div>
                <div className="w-full">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Location</h3>
                  <h3 className="text-base font-semibold text-gray-900 leading-none mb-1">
                    Current Coordinates
                  </h3>
                  <p className="text-sm text-gray-500 leading-snug">
                    Your location will be shared securely with nearby medics.
                  </p>
                </div>
              </div>
            </div>

            {/* Description Textarea */}
            <div className="w-full pb-2">
              <textarea
                id="help-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What kind of help do you need? (e.g. Heart attack, fall...)"
                className="w-full px-4 py-3.5 bg-[#fafafa] border border-gray-100 rounded-xl focus:outline-none focus:bg-white focus:ring-1 focus:ring-red-400 focus:border-red-400 resize-none text-sm text-gray-800 placeholder-gray-400 transition-all duration-300"
                rows="3"
                disabled={loading}
                maxLength={200}
              />
              <p className="text-[11px] font-medium text-gray-400 text-right mt-1">{description.length}/200</p>
            </div>
          </div>

          {/* STATIC FOOTER AREA: Action Buttons pinned above the keyboard */}
          <div className="flex-shrink-0 px-6 pb-6 pt-3 bg-white border-t border-gray-50 sm:border-none">
            <div className="w-full flex gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 bg-white border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[1.5] bg-[#fff0f0] text-red-600 font-semibold py-3.5 rounded-xl hover:bg-red-50 transition-all duration-300 flex justify-center items-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-fill text-lg leading-none"></i>
                    Send Request
                  </>
                )}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default HelpRequestModal;