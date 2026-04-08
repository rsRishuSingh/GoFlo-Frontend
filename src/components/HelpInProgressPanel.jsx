import React, { useState, useEffect, useRef, useCallback } from "react";
import { Navigation, Check, X, Clock } from "lucide-react";
import "remixicon/fonts/remixicon.css";

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
  // UI SECTION - REDESIGNED TO MATCH APP DESIGN LANGUAGE
  // =========================================================================

  // ── REQUESTER VIEW ──────────────────────────────────────────────────────────
  if (isUserView) {
    return (
      <div>

        {/* Drag Handle */}
        <h5 className="text-center w-[93%] absolute top-0">
          <i className="text-5xl text-gray-400 ri-separator" />
        </h5>

        {/* Header */}
        <div className="flex items-center justify-between mt-4 mb-4 px-2">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Help Request Active</h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {acceptorCount === 0
                  ? "Searching for nearby medics..."
                  : `${acceptorCount} medic${acceptorCount !== 1 ? "s" : ""} responding`}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${
            hasArrived
              ? "bg-green-50 text-green-700 border-green-200"
              : acceptorCount === 0
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}>
            {hasArrived ? (
              <><Check className="w-3 h-3 stroke-[3]" /> Arrived</>
            ) : acceptorCount === 0 ? (
              <>🔍 Searching</>
            ) : (
              <>🚑 En Route</>
            )}
          </span>
        </div>

        {/* ETA Card */}
        <div className="bg-gray-50 rounded-xl px-4 py-3.5 border border-gray-100 shadow-sm mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-3.5 h-3.5 text-red-500" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nearest Medic ETA</p>
          </div>

          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-gray-900 leading-tight">
              {nearestETA !== null && nearestETA !== undefined ? formatETA(nearestETA) : "..."}
            </p>
            {hasArrived && (
              <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                <Check className="w-4 h-4 stroke-[3]" /> Medic is here!
              </div>
            )}
            {!hasArrived && nearestETA !== null && nearestETA === 0 && (
              <div className="flex items-center gap-1 text-green-600 font-bold text-sm">
                <Check className="w-4 h-4 stroke-[3]" /> Very close!
              </div>
            )}
            {!hasArrived && nearestETA !== null && nearestETA > 0 && (
              <p className="text-sm text-gray-400 font-medium">Medic on the way</p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          {hasArrived && (
            <button
              onClick={() => onComplete?.()}
              disabled={isLoading}
              className="w-full bg-[#9aec00] text-gray-950 font-bold text-lg py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm hover:bg-[#7ec200] active:scale-95 transition-all duration-200 disabled:opacity-50"
            >
              <Check className="w-5 h-5 stroke-[2.5]" />
              Mark as Complete
            </button>
          )}

          <button
            onClick={() => onCancel?.()}
            disabled={isLoading}
            className="w-full bg-white border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-50 active:scale-95 text-sm"
          >
            <X className="w-4 h-4 stroke-[2]" />
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  // ── MEDIC VIEW ──────────────────────────────────────────────────────────────
  return (
    <div>

      {/* Drag Handle */}
      <h5 className="text-center w-[93%] absolute top-0">
        <i className="text-5xl text-gray-400 ri-separator" />
      </h5>

      {/* Header */}
      <div className="flex items-center justify-between mt-4 mb-4 px-2">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="absolute inline-flex h-4 w-4 rounded-full bg-red-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">En Route to Patient</h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">Sharing live location</p>
          </div>
        </div>

        <span className="bg-red-50 border border-red-200 text-red-600 px-2.5 py-1 rounded-lg text-xs font-bold">
          🚑 Active
        </span>
      </div>

      {/* ETA / Arrived Card */}
      {hasArrived ? (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3.5 flex items-center gap-3 mb-4 shadow-sm">
          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <Check className="w-5 h-5 text-green-600 stroke-[3]" />
          </div>
          <div>
            <p className="font-bold text-green-800 text-base">You've arrived!</p>
            <p className="text-xs text-green-600 mt-0.5">Patient location reached</p>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-xl px-4 py-3.5 mb-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ETA to Patient</p>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-3xl font-bold text-gray-900 leading-tight">
              {eta !== null && eta !== undefined ? formatETA(eta) : "Calculating..."}
            </p>
            {distanceKm !== null && (
              <div className="text-right">
                <p className="text-[11px] text-gray-400 uppercase font-bold">Distance</p>
                <p className="text-base font-bold text-gray-700">{formatDistance(distanceKm)}</p>
              </div>
            )}
          </div>
          {eta === 0 && (
            <p className="text-xs font-bold text-amber-600 mt-1">You are very close to the patient!</p>
          )}
        </div>
      )}

      {/* Patient Location */}
      <div className="flex flex-col gap-y-1 px-2 mb-5">
        <div className="flex items-start gap-4">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white shadow-sm mt-1 z-10 flex-shrink-0" />
          <div className="w-full">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Patient Location</p>
            <p className="text-sm font-semibold text-gray-800 font-mono leading-snug">
              {Number(helpRequest.requesterLocation?.lat ?? helpRequest.requesterLocation?.coordinates?.[1] ?? 0).toFixed(5)},&nbsp;
              {Number(helpRequest.requesterLocation?.lng ?? helpRequest.requesterLocation?.coordinates?.[0] ?? 0).toFixed(5)}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-3">
        {!hasArrived && (
          <button
            onClick={() => onComplete?.()}
            disabled={isLoading || !isWithin200m}
            className={`w-full font-bold text-lg py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all duration-200 ${
              isWithin200m
                ? "bg-[#9aec00] text-gray-950 hover:bg-[#7ec200]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            {isLoading
              ? "Marking..."
              : isWithin200m
              ? "I've Arrived"
              : `Get within 200m to arrive`}
          </button>
        )}

        <button
          onClick={() => onCancel?.()}
          disabled={isLoading}
          className="w-full bg-white border border-gray-200 text-gray-500 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 hover:bg-gray-50 active:scale-95 text-sm"
        >
          <X className="w-4 h-4 stroke-[2]" />
          Cancel Acceptance
        </button>
      </div>
    </div>
  );
};

export default HelpInProgressPanel;