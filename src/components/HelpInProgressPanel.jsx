import React, { useState, useEffect } from "react";
import { MapPin, Phone, Navigation, Check, X, AlertCircle } from "lucide-react";

const HelpInProgressPanel = ({
  helpRequest,
  onComplete,
  onCancel,
  medicLocation,
  isLoading,
  isUserView = false, // true for user, false for medic
}) => {
  const [eta, setEta] = useState(null);
  const [acceptorCount, setAcceptorCount] = useState(0);
  const [nearestETA, setNearestETA] = useState(null);

  useEffect(() => {
    if (!helpRequest) return;

    // Calculate acceptor count and nearest ETA
    const activeAcceptors =
      helpRequest.acceptors?.filter((a) => a.status === "accepted") || [];
    setAcceptorCount(activeAcceptors.length);

    if (activeAcceptors.length > 0) {
      const nearest = activeAcceptors.reduce((prev, current) =>
        prev.estimatedTimeToArrive < current.estimatedTimeToArrive
          ? prev
          : current,
      );
      setNearestETA(nearest.estimatedTimeToArrive);
      setEta(nearest.estimatedTimeToArrive);
    }
  }, [helpRequest]);

  if (!helpRequest) return null;

  const formatETA = (seconds) => {
    if (!seconds) return "Calculating...";
    const mins = Math.ceil(seconds / 60);
    return `${mins} min${mins > 1 ? "s" : ""}`;
  };

  const hasArrived = helpRequest.acceptors?.some((a) => a.status === "arrived");
  const isCancelled = helpRequest.status === "cancelled";

  if (isUserView) {
    // User's view - seeing medics coming to them
    return (
      <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl overflow-hidden border-2 border-blue-500 z-50">
        <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">🚑 Help On The Way</h3>
            <p className="text-sm opacity-90">
              {acceptorCount} medic{acceptorCount !== 1 ? "s" : ""} responding
            </p>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* Nearest ETA */}
          {nearestETA && (
            <div className="bg-linear-to-r from-blue-50 to-blue-100 px-4 py-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Nearest Medic ETA</p>
                <Navigation className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatETA(nearestETA)}
              </p>
            </div>
          )}

          {/* Status Indicators */}
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Medics Accepted</span>
              <span className="font-bold text-lg">{acceptorCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-600">Status</span>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  hasArrived
                    ? "bg-green-200 text-green-800"
                    : "bg-yellow-200 text-yellow-800"
                }`}
              >
                {hasArrived ? "✓ Arrived" : "🚗 En Route"}
              </span>
            </div>
          </div>

          {/* Alert if no acceptors */}
          {acceptorCount === 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 px-3 py-2 rounded">
              <p className="text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4 inline mr-2" />
                Waiting for medics to accept your request...
              </p>
            </div>
          )}

          {/* Cancel Button */}
          <button
            onClick={() => onCancel?.()}
            disabled={isLoading || isCancelled}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <X className="w-5 h-5" />
            {isCancelled ? "Cancelled" : "Cancel Request"}
          </button>

          {/* Complete Button - appears when medic arrived */}
          {hasArrived && (
            <button
              onClick={() => onComplete?.()}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Check className="w-5 h-5" />
              Complete Request
            </button>
          )}
        </div>
      </div>
    );
  } else {
    // Medic's view - showing navigation to patient
    return (
      <div className="fixed bottom-4 right-4 w-96 bg-white rounded-lg shadow-2xl overflow-hidden border-2 border-green-500 z-50">
        <div className="bg-green-500 text-white px-4 py-3 flex items-center justify-between">
          <h3 className="font-bold text-lg">📍 Navigating to Patient</h3>
          <Navigation className="w-5 h-5 animate-spin" />
        </div>

        <div className="p-4 space-y-3">
          {/* Patient Location */}
          <div className="bg-gray-50 px-4 py-3 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-5 h-5 text-red-500" />
              <p className="text-sm text-gray-600">Patient Location</p>
            </div>
            <p className="text-gray-800 font-mono text-sm">
              {helpRequest.requesterLocation?.coordinates?.[1]?.toFixed(6)},
              {helpRequest.requesterLocation?.coordinates?.[0]?.toFixed(6)}
            </p>
          </div>

          {/* ETA to Patient */}
          <div className="bg-linear-to-r from-green-50 to-green-100 px-4 py-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">ETA to Patient</p>
            <p className="text-3xl font-bold text-green-600">
              {eta ? formatETA(eta) : "Calculating..."}
            </p>
          </div>

          {/* Status */}
          <div className="bg-blue-50 px-4 py-2 rounded">
            <p className="text-sm text-gray-600">Other Medics</p>
            <p className="text-lg font-bold text-blue-600">
              {acceptorCount - 1} others responding
            </p>
          </div>

          {/* Arrival Info */}
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">
              When you arrive within 200m, click the button below
            </p>
            <button
              onClick={() => onComplete?.()}
              disabled={isLoading}
              className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Check className="w-5 h-5" />
              {isLoading ? "Marking..." : "I've Arrived"}
            </button>
          </div>

          {/* Cancel Acceptance */}
          <button
            onClick={() => onCancel?.()}
            disabled={isLoading}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition text-sm"
          >
            <X className="w-5 h-5" />
            Cancel Acceptance
          </button>
        </div>
      </div>
    );
  }
};

export default HelpInProgressPanel;
