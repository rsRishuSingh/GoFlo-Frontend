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
  // UI SECTION - REDESIGNED TO MATCH APP DESIGN LANGUAGE (BOTTOM SHEET)
  // =========================================================================
  return (
    // Overlay — transparent on mobile (full screen), dark on desktop
    <div className="fixed inset-0 z-50 bg-white sm:bg-black/60 flex items-end sm:items-center justify-center sm:p-4">

      {/* Sheet container: full height on mobile, auto on desktop */}
      <div className="bg-white w-full max-w-md h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:rounded-3xl shadow-2xl flex flex-col relative">

        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">

          {/* ── Static Header ── */}
          <div className="flex-shrink-0 pt-4 px-6 pb-2">

            {/* Drag handle (desktop only) */}
            <div className="hidden sm:flex w-full justify-center mb-4">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Title row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <span className="absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-75 animate-ping" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Request Help</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="h-9 w-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Alert Messages */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-start gap-2 shadow-sm mb-3">
                <i className="ri-error-warning-fill mt-0.5 flex-shrink-0 text-lg" />
                <p className="mt-0.5 leading-snug">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-[#f0fdf4] border border-[#bbf7d0] text-[#15803d] px-4 py-3 rounded-xl text-sm flex items-start gap-2 shadow-sm mb-3">
                <i className="ri-checkbox-circle-fill mt-0.5 flex-shrink-0 text-lg text-green-500" />
                <p className="mt-0.5 font-medium leading-snug">{success}</p>
              </div>
            )}
          </div>

          {/* ── Scrollable Content ── */}
          <div className="flex-1 overflow-y-auto px-6 pb-4">

            {/* Requester/Location Timeline */}
            <div className="flex flex-col gap-y-4 mb-6">

              {/* Requesting As */}
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center mt-1 relative">
                  <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white shadow-sm z-10" />
                  <div className="absolute top-4 w-0.5 h-9 border-l border-dashed border-gray-300" />
                </div>
                <div className="w-full border-b border-gray-100 pb-4">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Requesting as</p>
                  <h3 className="text-base font-bold text-gray-900 leading-none mb-1">
                    {user?.fullname?.firstname || "Ram"} {user?.fullname?.lastname || "Singh"}
                  </h3>
                  <p className="text-sm text-gray-400">{user?.email || "user@email.com"}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-4">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-sm border-2 border-white shadow-sm mt-1 z-10" />
                <div className="w-full">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Your Location</p>
                  <h3 className="text-base font-bold text-gray-900 leading-none mb-1">Current Coordinates</h3>
                  <p className="text-sm text-gray-400 leading-snug">Shared securely with nearby medics only.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="w-full">
              <label htmlFor="help-description" className="block text-sm font-bold text-gray-700 mb-2">
                Describe the emergency <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="help-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Heart attack, fall, unconscious..."
                className="w-full px-4 py-3.5 bg-gray-100 border border-transparent rounded-xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-400 focus:border-red-400 resize-none text-sm text-gray-800 placeholder-gray-400 transition-all duration-200"
                rows="3"
                disabled={loading}
                maxLength={200}
              />
              <p className="text-[11px] text-gray-400 text-right mt-1 font-medium">{description.length}/200</p>
            </div>
          </div>

          {/* ── Static Footer (pinned above keyboard) ── */}
          <div className="flex-shrink-0 px-6 pb-6 pt-3 rounded-3xl bg-white border-t border-gray-100 sm:border-none">
            <div className="flex flex-col gap-3 ">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white font-bold text-lg py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-red-700 active:scale-95 transition-all duration-200 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="ri-send-plane-fill text-xl leading-none" />
                    Send Help Request
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="w-full bg-white border border-gray-200 text-gray-600 font-semibold py-3.5 rounded-xl hover:bg-gray-50 active:scale-95 transition-all duration-200 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default HelpRequestModal;