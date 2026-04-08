import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Clock, AlertTriangle } from "lucide-react";
import "remixicon/fonts/remixicon.css";

// Client-side haversine distance (no API needed)
function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HelpAcceptancePanel = ({
  helpRequest,
  onAccept,
  onDecline,
  isLoading,
}) => {
  // =========================================================================
  // LOGIC SECTION - STRICTLY UNTOUCHED
  // =========================================================================
  const [timeRemaining, setTimeRemaining] = useState(240); // 4 minutes
  const [userLocation, setUserLocation] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (!helpRequest) return;
    setTimeRemaining(240); // reset when a new request arrives
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onDecline?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [helpRequest?.helpRequestId]); // reset only when ID changes, not on every re-render

  // Get current user location to compute distance to requester
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 },
    );
  }, []);

  if (!helpRequest) return null;

  const requesterLat =
    helpRequest.requesterLocation?.lat ??
    helpRequest.requesterLocation?.coordinates?.[1] ??
    null;
  const requesterLng =
    helpRequest.requesterLocation?.lng ??
    helpRequest.requesterLocation?.coordinates?.[0] ??
    null;

  // Distance to requester
  const distanceKm = useMemo(() => {
    if (!userLocation || requesterLat === null || requesterLng === null) return null;
    return haversineKm(userLocation.lat, userLocation.lng, requesterLat, requesterLng);
  }, [userLocation, requesterLat, requesterLng]);

  const formatDistance = (km) => {
    if (km === null) return null;
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const urgencyLevel =
    timeRemaining > 120 ? "low" : timeRemaining > 60 ? "medium" : "high";

  const hasDescription = helpRequest.description && helpRequest.description.trim() !== "";

  // =========================================================================
  // UI SECTION - REDESIGNED TO MATCH APP DESIGN LANGUAGE
  // =========================================================================

  const timerBg = {
    low: "bg-blue-50 text-blue-700 border-blue-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    high: "bg-red-50 text-red-600 border-red-200",
  }[urgencyLevel];

  return (
    <div>

      {/* Drag Handle */}
      <h5 className="text-center w-[93%] absolute top-0">
        <i className="text-5xl text-gray-400 ri-separator" />
      </h5>

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-4 px-2">
        <div className="flex items-center gap-2.5">
          {/* Pulsing red dot */}
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">SOS Request</h3>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-bold tabular-nums ${timerBg}`}>
          <Clock className="w-3.5 h-3.5" />
          {formatTime(timeRemaining)}
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 shadow-sm border border-gray-100 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-full bg-red-100 border-2 border-red-200 flex items-center justify-center flex-shrink-0">
            <i className="ri-user-heart-line text-red-500 text-lg" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Patient</p>
            <h2 className="text-base font-bold capitalize text-gray-900 leading-tight">{helpRequest.requesterName}</h2>
          </div>
        </div>
        {distanceKm !== null && (
          <div className="text-right">
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">Distance</p>
            <p className="text-base font-bold text-red-600 leading-tight">{formatDistance(distanceKm)}</p>
          </div>
        )}
      </div>

      {/* Timeline: Location & Issue */}
      <div className="flex flex-col gap-y-3 px-2 mb-4">
        {/* Location */}
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center mt-1 relative">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm z-10" />
            {hasDescription && (
              <div className="absolute top-4 w-0.5 h-9 border-l border-dashed border-gray-400" />
            )}
          </div>
          <div className={`w-full ${hasDescription ? "border-b border-gray-100 pb-3" : ""}`}>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Patient Location</p>
            <p className="text-sm font-semibold text-gray-800 leading-snug font-mono">
              {requesterLat !== null ? Number(requesterLat).toFixed(5) : "—"},&nbsp;
              {requesterLng !== null ? Number(requesterLng).toFixed(5) : "—"}
            </p>
          </div>
        </div>

        {/* Description */}
        {hasDescription && (
          <div className="flex items-start gap-4">
            <div className="w-2.5 h-2.5 bg-amber-400 rounded-sm border-2 border-white shadow-sm mt-1 z-10" />
            <div className="w-full">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Reported Issue</p>
              <p className="text-sm font-medium text-gray-700 leading-snug">{helpRequest.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Urgency Warning */}
      {urgencyLevel === "high" && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 mb-4 text-sm text-red-600 font-bold flex items-center gap-2 animate-pulse">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Decision needed immediately!
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={() => onAccept?.()}
          disabled={isLoading}
          className="w-full bg-[#9aec00] text-gray-950 font-bold text-lg p-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:bg-[#7ec200] active:scale-95 disabled:opacity-50 disabled:bg-gray-300"
        >
          <Check className="w-5 h-5 stroke-[2.5]" />
          {isLoading ? "Accepting..." : "Accept & Respond"}
        </button>

        <button
          onClick={() => onDecline?.()}
          disabled={isLoading}
          className="w-full bg-white border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-50 active:scale-95 disabled:opacity-50 text-sm"
        >
          <X className="w-4 h-4 stroke-[2]" />
          Ignore
        </button>
      </div>
    </div>
  );
};

export default HelpAcceptancePanel;