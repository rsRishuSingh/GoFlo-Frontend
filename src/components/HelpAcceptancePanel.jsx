import React, { useState, useEffect, useMemo } from "react";
import { Check, X, Clock, AlertTriangle } from "lucide-react";

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

  // =========================================================================
  // UI SECTION - REFINED TO MATCH NEW AESTHETIC
  // =========================================================================

  const headerStyles = {
    low: "bg-[#3b82f6]",    // Blue
    medium: "bg-[#f59e0b]", // Amber
    high: "bg-[#ef4444]",   // Red
  }[urgencyLevel];

  const hasDescription = helpRequest.description && helpRequest.description.trim() !== "";

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50">

      {/* Header Banner */}
      <div className={`${headerStyles} text-white px-4 py-4 flex items-center justify-between transition-colors duration-500`}>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
          <h3 className="font-bold text-[16px] tracking-wide">SOS Request</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-white/20 px-2.5 py-1 rounded-md backdrop-blur-sm">
          <Clock className="w-3.5 h-3.5" />
          <span className="text-[14px] font-bold tabular-nums tracking-wider">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      <div className="p-5">

        {/* Requester Info & Distance Box */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-4 py-3.5 mb-5 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Patient Name</p>
            <p className="text-[16px] font-bold text-[#1f2937] leading-none capitalize">{helpRequest.requesterName}</p>
          </div>
          {distanceKm !== null && (
            <div className="text-right">
              <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-0.5">Distance</p>
              <p className="text-[16px] font-bold text-[#2563eb] leading-none">{formatDistance(distanceKm)}</p>
            </div>
          )}
        </div>

        {/* Timeline: Location & Issue */}
        <div className="px-1 mb-6">
          {/* Location */}
          <div className="flex items-start gap-3">
            <div className="flex flex-col items-center mt-1.5">
              <div className="w-2 h-2 bg-[#ef4444] rounded-full z-10" />
              {hasDescription && (
                <div className="w-[2px] h-[35px] border-l-2 border-dotted border-gray-300 my-1" />
              )}
            </div>
            <div className="pb-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Patient Location</p>
              <p className="text-[14px] font-bold text-gray-800 leading-tight">
                {requesterLat !== null ? Number(requesterLat).toFixed(6) : "—"},{" "}
                {requesterLng !== null ? Number(requesterLng).toFixed(6) : "—"}
              </p>
            </div>
          </div>

          {/* Description */}
          {hasDescription && (
            <div className="flex items-start gap-3 mt-1">
              <div className="w-2 h-2 bg-[#f59e0b] rounded-full mt-1.5 z-10" />
              <div className="w-full">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Reported Issue</p>
                <p className="text-[13px] font-medium text-gray-700 bg-amber-50 px-2.5 py-1.5 rounded-md border border-amber-100/50 leading-snug">
                  {helpRequest.description}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Urgency Warning */}
        {urgencyLevel === "high" && (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-3 py-2.5 mb-4 text-[12px] text-[#dc2626] font-bold flex items-center justify-center gap-2 animate-pulse shadow-sm">
            <AlertTriangle className="w-4 h-4" /> Decision needed immediately!
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => onDecline?.()}
            disabled={isLoading}
            className="flex-1 bg-[#fff0f0] border border-[#fecaca] hover:bg-[#ffe4e4] text-[#dc2626] font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-[14px] disabled:opacity-50"
          >
            <X className="w-4 h-4 stroke-[3]" />
            Ignore
          </button>

          <button
            onClick={() => onAccept?.()}
            disabled={isLoading}
            className="flex-[1.2] bg-[#8add00] hover:bg-[#7bc400] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-[14px] shadow-sm disabled:opacity-50 disabled:bg-gray-300"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            {isLoading ? "Accepting..." : "Accept"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpAcceptancePanel;