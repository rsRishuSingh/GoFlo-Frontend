import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navigation, Check, X, Clock } from "lucide-react";

// Haversine distance in km
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

const HelpInProgressPanel = ({
  helpRequest,
  onComplete,
  onCancel,
  isLoading,
  isUserView = false,
  acceptorCountProp,
  nearestETAProp,
  medicArrivedProp,
  helpRequestId,
  socket,
  userId,
}) => {
  // =========================================================================
  // LOGIC SECTION - STRICTLY UNTOUCHED
  // =========================================================================
  const [eta, setEta] = useState(null);
  const [acceptorCount, setAcceptorCount] = useState(0);
  const [nearestETA, setNearestETA] = useState(null);

  // Medic-only proximity state
  const [distanceKm, setDistanceKm] = useState(null);
  const lastEmitTime = useRef(0);
  const prevDistanceKm = useRef(null);
  const EMIT_INTERVAL_MS = 8000;

  // ── Sync ETA / acceptorCount from props ──────────────────────────────────────
  useEffect(() => {
    if (!helpRequest) return;

    if (acceptorCountProp !== undefined) {
      setAcceptorCount(acceptorCountProp);
    } else {
      const active = helpRequest.acceptors?.filter((a) => a.status === "accepted") || [];
      setAcceptorCount(active.length);
    }

    if (nearestETAProp !== undefined && nearestETAProp !== null && nearestETAProp >= 0) {
      setNearestETA(nearestETAProp);
      setEta(nearestETAProp);
    } else if (nearestETAProp === null) {
      setNearestETA(null);
      setEta(null);
    } else {
      const active = helpRequest.acceptors?.filter((a) => a.status === "accepted") || [];
      if (active.length > 0) {
        const nearest = active.reduce((prev, cur) =>
          (prev.estimatedTimeToArrive ?? Infinity) < (cur.estimatedTimeToArrive ?? Infinity)
            ? prev
            : cur,
        );
        if (nearest.estimatedTimeToArrive != null) {
          setNearestETA(nearest.estimatedTimeToArrive);
          setEta(nearest.estimatedTimeToArrive);
        }
      }
    }
  }, [helpRequest, acceptorCountProp, nearestETAProp]);

  // ── Medic GPS watchPosition + ETA emit (medic view only) ─────────────────────
  const emitLocation = useCallback(
    (lat, lng) => {
      if (!socket || !helpRequestId || !userId) return;
      const now = Date.now();
      if (now - lastEmitTime.current < EMIT_INTERVAL_MS) return;
      lastEmitTime.current = now;
      socket.emit("help:medic-location-update", {
        medicId: userId,
        helpRequestId,
        location: { lat, lng },
      });
    },
    [socket, helpRequestId, userId],
  );

  useEffect(() => {
    if (isUserView) return;
    if (!navigator.geolocation) return;

    const reqLat =
      helpRequest?.requesterLocation?.lat ??
      helpRequest?.requesterLocation?.coordinates?.[1];
    const reqLng =
      helpRequest?.requesterLocation?.lng ??
      helpRequest?.requesterLocation?.coordinates?.[0];

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        if (reqLat !== undefined && reqLng !== undefined) {
          const d = haversineKm(latitude, longitude, reqLat, reqLng);
          setDistanceKm(d);

          if (d <= 0.2) {
            setEta(0);
            setNearestETA(0);
          }

          // Force-emit on 200m threshold crossing
          const wasOutside = prevDistanceKm.current === null || prevDistanceKm.current > 0.2;
          if (wasOutside && d <= 0.2) lastEmitTime.current = 0;
          prevDistanceKm.current = d;
        }

        emitLocation(latitude, longitude);
      },
      (err) => console.warn("Geolocation watch error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isUserView, helpRequest, emitLocation]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  if (!helpRequest) return null;

  const formatETA = (seconds) => {
    if (seconds === undefined || seconds === null) return "Calculating...";
    const mins = Math.max(0, Math.ceil(seconds / 60));
    return `${mins} min${mins !== 1 ? "s" : ""}`;
  };

  const formatDistance = (km) => {
    if (km === null || km === undefined) return null;
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
  };

  const isWithin200m = distanceKm !== null && distanceKm <= 0.2;

  const hasArrived =
    medicArrivedProp === true ||
    helpRequest.acceptors?.some((a) => a.status === "arrived");

  // =========================================================================
  // UI SECTION - REFINED PROPORTIONS & TYPOGRAPHY
  // =========================================================================

  // ── REQUESTER VIEW (Red Theme) ─────────────────────────────────────────────
  if (isUserView) {
    return (
      <div className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50">

        {/* Header - Sleeker padding and font size */}
        <div className="bg-[#ef4444] px-4 py-4 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[16px] flex items-center gap-1.5 tracking-wide">
              <span className="text-[18px] leading-none">🚑</span> Help Request Active
            </h3>
            <p className="text-[12px] text-red-100 mt-0.5 font-medium">
              {acceptorCount === 0
                ? "Searching for nearby medics..."
                : `${acceptorCount} medic${acceptorCount !== 1 ? "s" : ""} responding`}
            </p>
          </div>
          <Navigation className="w-4 h-4 opacity-90 rotate-45 mr-1" />
        </div>

        <div className="p-4 space-y-4">
          {/* Nearest Medic Box - Lighter background, softer border, proportional text */}
          <div className="bg-[#fffdfd] border border-[#fee2e2] rounded-xl px-4 py-3.5 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ef4444]" />
              <p className="text-[11px] text-[#ef4444] uppercase tracking-wider font-bold">Nearest Medic</p>
            </div>

            <p className="text-[26px] font-bold text-[#b91c1c] leading-tight mb-1 ml-5">
              {nearestETA !== null && nearestETA !== undefined ? formatETA(nearestETA) : "..."}
            </p>

            {nearestETA === 0 ? (
              <p className="text-[12px] text-[#16a34a] font-bold ml-5 flex items-center gap-1">
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Medic is right here!
              </p>
            ) : (
              <p className="text-[12px] text-[#ef4444] font-medium ml-5 opacity-90">
                Medic is on the way
              </p>
            )}
          </div>

          {/* Status Row - Adjusted pill size and spacing */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[13px] text-gray-500 font-medium">Status</span>
            <span
              className={`px-2.5 py-1 rounded-md font-bold text-[11px] flex items-center gap-1.5 ${hasArrived
                  ? "bg-[#dcfce7] text-[#166534]"
                  : acceptorCount === 0
                    ? "bg-[#fef2f2] text-[#ef4444]"
                    : "bg-[#fff0f0] text-[#dc2626]"
                }`}
            >
              {hasArrived ? (
                <><Check className="w-3 h-3 stroke-[3]" /> Arrived</>
              ) : acceptorCount === 0 ? (
                <>🔍 Searching...</>
              ) : (
                <>🚗 En Route</>
              )}
            </span>
          </div>

          {/* Buttons - Tighter vertical rhythm */}
          <div className="space-y-2 pt-1">
            {hasArrived && (
              <button
                onClick={() => onComplete?.()}
                disabled={isLoading}
                className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-[14px] shadow-sm"
              >
                <Check className="w-4 h-4 stroke-[2.5]" />
                Mark as Complete
              </button>
            )}

            <button
              onClick={() => onCancel?.()}
              disabled={isLoading}
              className="w-full bg-white border border-[#fecaca] text-[#dc2626] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-[#fff0f0] text-[14px]"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
              Cancel Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── MEDIC VIEW (Red Theme - Scaled down to match User View proportions) ──────
  return (
    <div className="fixed bottom-4 right-4 sm:bottom-10 sm:right-10 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden z-50">

      {/* Banner */}
      <div className="bg-[#fff0f0] text-[#991b1b] px-5 py-3.5 text-[13px] font-bold flex items-center gap-2">
        <div className="w-2.5 h-2.5 bg-[#ef4444] rounded-full shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
        Ride in Progress - Sharing Live Location
      </div>

      <div className="p-5 space-y-5">

        {/* ETA & Distance Box */}
        {hasArrived ? (
          <div className="bg-[#fff0f0] border border-[#fecaca] rounded-xl px-4 py-4 flex items-center gap-3">
            <Check className="w-5 h-5 text-[#dc2626] stroke-[3]" />
            <p className="text-[#991b1b] font-bold text-[14px]">You've arrived at the patient!</p>
          </div>
        ) : (
          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-4 py-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-1.5 h-1.5 bg-[#dc2626] rounded-full"></div>
              <p className="text-[#dc2626] font-bold text-[13px]">
                Est. Time: {eta !== null && eta !== undefined ? formatETA(eta) : "Calculating..."}
              </p>
            </div>
            <p className="text-[#dc2626] text-[12px] font-medium ml-3.5 mb-1 opacity-90">
              Distance: {formatDistance(distanceKm) ?? "Calculating..."}
            </p>
            {eta === 0 && (
              <p className="text-[#dc2626] text-[12px] font-bold ml-3.5">
                You are very close!
              </p>
            )}
          </div>
        )}

        {/* Patient Location */}
        <div className="px-1">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 bg-[#ef4444] rounded-full"></div>
            <h3 className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Patient Location</h3>
          </div>
          <p className="text-[14px] font-bold text-[#1f2937] ml-3">
            {Number(helpRequest.requesterLocation?.lat ?? helpRequest.requesterLocation?.coordinates?.[1] ?? 0).toFixed(6)},{" "}
            {Number(helpRequest.requesterLocation?.lng ?? helpRequest.requesterLocation?.coordinates?.[0] ?? 0).toFixed(6)}
          </p>
        </div>

        {/* Buttons */}
        <div className="space-y-2 pt-1">
          {!hasArrived && (
            <button
              onClick={() => onComplete?.()}
              disabled={isLoading || !isWithin200m}
              className={`w-full font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-[14px] shadow-sm ${isWithin200m
                  ? "bg-[#ef4444] hover:bg-[#dc2626] text-white"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              {isLoading ? "Marking..." : isWithin200m ? "I've Arrived" : `Get within 200m to arrive`}
            </button>
          )}

          <button
            onClick={() => onCancel?.()}
            disabled={isLoading}
            className="w-full bg-white border border-[#fecaca] text-[#dc2626] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors hover:bg-[#fff0f0] text-[14px]"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
            Cancel Acceptance
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpInProgressPanel;