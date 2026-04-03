import React, { useState, useEffect } from "react";
import { MapPin, Phone, Clock, XCircle, CheckCircle } from "lucide-react";

const HelpAcceptancePanel = ({
  helpRequest,
  onAccept,
  onDecline,
  isLoading,
}) => {
  const [showDetails, setShowDetails] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutes

  useEffect(() => {
    if (!helpRequest) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDecline?.(); // Auto-decline on timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [helpRequest, onDecline]);

  if (!helpRequest) return null;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getUrgencyLevel = () => {
    if (timeRemaining > 120) return "low"; // > 2 mins
    if (timeRemaining > 60) return "medium"; // 1-2 mins
    return "high"; // < 1 min
  };

  const urgencyLevel = getUrgencyLevel();
  const urgencyColor = {
    low: "bg-blue-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  }[urgencyLevel];

  return (
    <div
      className={`fixed bottom-4 right-4 w-96 rounded-lg shadow-2xl overflow-hidden ${urgencyColor} bg-opacity-10 border-2 ${urgencyColor} border-opacity-50 z-50`}
    >
      <div
        className={`${urgencyColor} text-white px-4 py-3 flex items-center justify-between`}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <h3 className="font-bold text-lg">🆘 Help Request!</h3>
        </div>
        <div className="text-2xl font-bold">{formatTime(timeRemaining)}</div>
      </div>

      <div className="bg-white p-4 space-y-3">
        {/* Requester Info */}
        <div className="border-b pb-3">
          <p className="text-sm text-gray-600">From</p>
          <p className="text-lg font-semibold text-gray-800">
            {helpRequest.requesterName}
          </p>
        </div>

        {/* Location Info */}
        <div className="flex items-start gap-2">
          <MapPin className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-600">Location</p>
            <p className="text-gray-800 font-medium">
              {helpRequest.requesterLocation?.coordinates?.[1]?.toFixed(4)},
              {helpRequest.requesterLocation?.coordinates?.[0]?.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Acceptance Count */}
        <div className="bg-blue-50 px-3 py-2 rounded">
          <p className="text-sm text-gray-600">Others Accepting</p>
          <p className="text-lg font-bold text-blue-600">
            {helpRequest.acceptorsCount || 0} people
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onAccept?.()}
            disabled={isLoading}
            className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <CheckCircle className="w-5 h-5" />
            {isLoading ? "Accepting..." : "Accept"}
          </button>
          <button
            onClick={() => onDecline?.()}
            disabled={isLoading}
            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <XCircle className="w-5 h-5" />
            Decline
          </button>
        </div>

        {/* Urgency Indicator */}
        {urgencyLevel === "high" && (
          <div className="bg-red-50 border-l-4 border-red-500 px-3 py-2 rounded">
            <p className="text-sm text-red-600 font-semibold">
              ⚠️ Urgent - Decision needed soon!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpAcceptancePanel;
