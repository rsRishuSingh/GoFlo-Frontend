import React, { useState } from "react";
import axios from "axios";
import "remixicon/fonts/remixicon.css";

const HelpRequestModal = ({ isOpen, onClose, user }) => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
  });

  const getCurrentPosition = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
      } else {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      // Get user's current location
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;

      // Send help request to server
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/help/send-request`,
        {
          location: {
            lat: latitude,
            lng: longitude,
          },
          description: description || "",
        },
        { headers: getAuthHeaders() },
      );

      setSuccess(
        `Help request sent! Notified ${response.data.data.notificationsSent} nearby users.`,
      );
      setDescription("");

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      if (err.code === "PermissionDenied") {
        setError(
          "Location permission denied. Please enable location services.",
        );
      } else if (err.message === "Geolocation is not supported") {
        setError("Geolocation is not supported on this device.");
      } else {
        setError(err.response?.data?.message || "Failed to send help request");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Request Help</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Information
            </label>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-semibold text-gray-800">
                {user?.fullname?.firstname} {user?.fullname?.lastname}
              </p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what kind of help you need..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              rows="3"
              disabled={loading}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm text-blue-700">
            <i className="ri-information-line mr-2"></i>
            Your location will be shared with nearby users.
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Sending...
                </>
              ) : (
                <>
                  <i className="ri-send-plane-fill"></i>
                  Send Request
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HelpRequestModal;
