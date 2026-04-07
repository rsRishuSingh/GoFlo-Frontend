import React, {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import helpService from "../services/helpService";
import { showGlobalAlert } from "../components/AlertModal";

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
  const [user, setUser] = useState({
    email: "",
    _id: null,
    fullname: { firstname: "", lastname: "" },
  });

  // ── Help Request States ──────────────────────────────────────────────────────
  // The request the requester sent (used by requester's in-progress panel)
  const [activeHelpRequest, setActiveHelpRequest] = useState(null);
  // Current status object {status, helpRequestId, acceptorCount, nearestETA, eta, medicArrived}
  const [helpRequestStatus, setHelpRequestStatus] = useState(null);
  // Incoming request shown to a nearby medic in the acceptance panel
  const [incomingHelpRequest, setIncomingHelpRequest] = useState(null);
  // True ONLY on the device that sent the help request
  const [isHelpRequester, setIsHelpRequester] = useState(false);
  // Latest live location of the nearest/any medic (for requester's map)
  const [medicCurrentLocation, setMedicCurrentLocation] = useState(null);

  // Socket reference
  const socketRef = useRef(null);

  // ── Deduplication: prevent the same helpRequestId from triggering the
  //    acceptance panel more than once (guards against FCM + socket + URL params) ──
  const seenHelpRequestIds = useRef(new Set());

  // ── Recovery: On mount, check localStorage for an active help request ────────
  // When requester was involved in a request and reloads, we restore their state.
  useEffect(() => {
    const stored = localStorage.getItem("activeHelpRequestId");
    const storedIsRequester = localStorage.getItem("isHelpRequester") === "true";

    if (!stored) return;

    // Fetch from backend to confirm it's still active
    (async () => {
      try {
        const res = await helpService.getHelpRequestStatus(stored);
        const data = res?.data;
        if (!data) return;

        if (["completed", "cancelled"].includes(data.status)) {
          // Stale — clean up
          localStorage.removeItem("activeHelpRequestId");
          localStorage.removeItem("isHelpRequester");
          return;
        }

        // Restore state
        const activeAcceptors = data.acceptors?.filter(a => a.status === "accepted") || [];
        const minETA = activeAcceptors.length > 0
          ? activeAcceptors.reduce((min, a) => Math.min(min, a.eta ?? Infinity), Infinity)
          : null;

        setActiveHelpRequest({
          helpRequestId: data.helpRequestId,
          requesterId: data.requesterId,
          requesterName: data.requesterName,
          requesterLocation: data.requesterLocation,
          description: data.description || "",
          acceptors: data.acceptors || [],
          status: data.status,
        });

        setHelpRequestStatus({
          status: "in-progress",
          helpRequestId: data.helpRequestId,
          acceptorCount: activeAcceptors.length,
          nearestETA: minETA === Infinity ? null : minETA,
          eta: minETA === Infinity ? null : minETA,
        });

        if (storedIsRequester) {
          setIsHelpRequester(true);
        }

        console.log(`[Help Recovery] Restored active help request ${stored}, status: ${data.status}`);
      } catch (err) {
        console.warn("[Help Recovery] Failed to restore help request:", err);
        localStorage.removeItem("activeHelpRequestId");
        localStorage.removeItem("isHelpRequester");
      }
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Persist active request to localStorage whenever it changes ───────────────
  useEffect(() => {
    if (activeHelpRequest?.helpRequestId) {
      localStorage.setItem("activeHelpRequest", JSON.stringify({
        helpRequestId: activeHelpRequest.helpRequestId,
        isRequester: isHelpRequester,
      }));
      localStorage.setItem("activeHelpRequestId", activeHelpRequest.helpRequestId.toString());
      localStorage.setItem("isHelpRequester", isHelpRequester ? "true" : "false");
    } else {
      localStorage.removeItem("activeHelpRequestId");
      localStorage.removeItem("isHelpRequester");
      localStorage.removeItem("activeHelpRequest");
    }
  }, [activeHelpRequest?.helpRequestId, isHelpRequester]);

  // ── Update user location ──────────────────────────────────────────────────────
  const updateUserLocation = useCallback(
    (lat, lng, socket) => {
      if (!socket) return;
      socket.emit("update-location-user", {
        userId: user._id,
        location: { lat, lng },
      });
    },
    [user._id],
  );

  // ── Accept help request (medic) ───────────────────────────────────────────────
  const pendingAcceptRef = useRef(null);

  const acceptHelpRequest = useCallback(
    async (helpRequest, socket) => {
      if (!helpRequest || !socket) return;

      try {
        // Two-stage GPS fallback
        const getLocationWithFallback = () =>
          new Promise((resolve) => {
            if (!navigator.geolocation) return resolve({ lat: 0, lng: 0 });

            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
              () => {
                navigator.geolocation.getCurrentPosition(
                  (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                  () => resolve({ lat: 0, lng: 0 }),
                  { enableHighAccuracy: false, timeout: 4000, maximumAge: 30000 },
                );
              },
              { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 },
            );
          });

        const currentLocation = await getLocationWithFallback();

        // Store pending — actual state update happens on help:joined-request-room
        pendingAcceptRef.current = helpRequest;

        // Hide acceptance panel immediately (prevent double-click)
        setIncomingHelpRequest(null);
        setHelpRequestStatus({
          status: "accepting",
          helpRequestId: helpRequest.helpRequestId,
        });

        socket.emit("help:accept", {
          userId: user._id,
          userName: `${user.fullname.firstname} ${user.fullname.lastname || ""}`.trim(),
          helpRequestId: helpRequest.helpRequestId,
          currentLocation,
        });
      } catch (error) {
        console.error("Error accepting help request:", error);
        pendingAcceptRef.current = null;
        setIncomingHelpRequest(helpRequest);
        setHelpRequestStatus(null);
      }
    },
    [user._id, user.fullname],
  );

  // ── Decline help request (medic) ──────────────────────────────────────────────
  const declineHelpRequest = useCallback((helpRequestId, socket) => {
    // Add to local seen set so we don't show it again
    if (helpRequestId) {
      seenHelpRequestIds.current.add(helpRequestId.toString());
    }
    setIncomingHelpRequest(null);

    // Tell backend to add this user to ignoredBy (stops re-broadcasts to them)
    if (socket && helpRequestId && socketRef.current?._id) {
      socket.emit("help:decline", {
        userId: socketRef.current._id,
        helpRequestId,
      });
    }
  }, []);

  // ── Cancel help request (requester) ──────────────────────────────────────────
  const cancelHelpRequest = useCallback(
    (helpRequestId, socket, reason) => {
      if (!socket || !helpRequestId) return;

      // Primary path: socket (instant real-time notification to all medics)
      socket.emit("help:cancel-request", {
        helpRequestId,
        userId: user._id,
        reason: reason || "User cancelled",
      });

      // Secondary path: REST (ensures DB update even if socket drops)
      helpService.cancelHelpRequest(helpRequestId, reason).catch(err =>
        console.warn("REST cancel fallback failed:", err)
      );
    },
    [user._id],
  );

  // ── Complete help request (requester) ─────────────────────────────────────────
  const completeHelpRequest = useCallback(
    (helpRequestId, socket) => {
      if (!socket || !helpRequestId) return;
      socket.emit("help:complete-request", { helpRequestId, userId: user._id });
    },
    [user._id],
  );

  // ── Clear all help state ──────────────────────────────────────────────────────
  const clearHelpState = useCallback(() => {
    setActiveHelpRequest(null);
    setHelpRequestStatus(null);
    setIncomingHelpRequest(null);
    setIsHelpRequester(false);
    setMedicCurrentLocation(null);
    seenHelpRequestIds.current = new Set();
  }, []);

  // ── Setup socket listeners ────────────────────────────────────────────────────
  const setupHelpSocketListeners = useCallback((socket, userId) => {
    socketRef.current = { socket, _id: userId };

    // ── Incoming request to a nearby MEDIC ──────────────────────────────────
    socket.on("help:request-received", (data) => {
      console.log("[Help] Request received:", data.helpRequestId);

      // Skip if this user is the requester
      if (data.requesterId?.toString() === userId?.toString()) return;

      // Deduplication: if already seen this requestId, skip re-render
      const id = data.helpRequestId?.toString();
      if (!id) return;

      // Always update the incoming request (even if same id, allows status refresh)
      // but don't re-set if already in-progress as an acceptor
      if (seenHelpRequestIds.current.has(id)) {
        console.log("[Help] Duplicate request-received skipped:", id);
        return;
      }

      seenHelpRequestIds.current.add(id);

      setIncomingHelpRequest({
        helpRequestId: data.helpRequestId,
        requesterId: data.requesterId,
        requesterName: data.requesterName,
        description: data.description || "",
        requesterLocation: {
          // Backend sends {lat, lng} object in the broadcast
          lat: data.requesterLocation?.lat ?? data.requesterLocation?.coordinates?.[1],
          lng: data.requesterLocation?.lng ?? data.requesterLocation?.coordinates?.[0],
          coordinates: [
            data.requesterLocation?.lng ?? data.requesterLocation?.coordinates?.[0],
            data.requesterLocation?.lat ?? data.requesterLocation?.coordinates?.[1],
          ],
        },
      });
    });

    // ── Requester: a medic accepted ──────────────────────────────────────────
    socket.on("help:accepted", (data) => {
      console.log("[Help] Accepted by medic:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        status: "in-progress",
        helpRequestId: data.helpRequestId || prev?.helpRequestId,
        acceptorCount: data.acceptorCount,
        nearestETA: data.nearestETA,
        eta: data.nearestETA,
      }));
      setActiveHelpRequest((prev) => ({
        ...prev,
        status: "in-progress",
        helpRequestId: data.helpRequestId || prev?.helpRequestId,
        acceptorCount: data.acceptorCount,
        // Preserve requesterLocation — never overwrite with acceptor location
      }));
    });

    // ── Medic: server confirmed acceptance (join room) ───────────────────────
    socket.on("help:joined-request-room", (data) => {
      console.log("[Help] Joined request room:", data);
      const confirmed = pendingAcceptRef.current;
      pendingAcceptRef.current = null;

      if (confirmed) {
        const requesterLocation = data.requesterLocation
          ? {
              lat: data.requesterLocation.lat,
              lng: data.requesterLocation.lng,
              coordinates: [data.requesterLocation.lng, data.requesterLocation.lat],
            }
          : confirmed.requesterLocation;

        setActiveHelpRequest({
          ...confirmed,
          requesterLocation,
          description: data.description || confirmed.description || "",
        });
        setHelpRequestStatus({
          status: "in-progress",
          helpRequestId: data.helpRequestId || confirmed.helpRequestId,
          acceptorCount: 1,
          nearestETA: data.eta ?? null,
          eta: data.eta ?? null,
        });
      } else {
        // Already in-progress — update ETA
        setHelpRequestStatus((prev) => ({
          ...prev,
          eta: data.eta,
          nearestETA: data.eta,
        }));
      }
    });

    // ── Recovery snapshot (after join-help-pending) ──────────────────────────
    socket.on("help:request-status-snapshot", (data) => {
      console.log("[Help] Status snapshot received:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        status: "in-progress",
        helpRequestId: data.helpRequestId,
        acceptorCount: data.acceptorCount,
        nearestETA: data.minETA,
        eta: data.minETA,
      }));
    });

    // ── Request no longer active (after join-help-pending for dead request) ──
    socket.on("help:request-no-longer-active", (data) => {
      console.log("[Help] Request no longer active:", data);
      clearHelpState();
    });

    // ── help:error ─────────────────────────────────────────────────────────
    socket.on("help:error", (err) => {
      console.error("[Help] Socket error:", err);
      if (pendingAcceptRef.current) {
        pendingAcceptRef.current = null;
        setIncomingHelpRequest(null);
        setHelpRequestStatus(null);
        setActiveHelpRequest(null);
        showGlobalAlert({ message: err?.message || "Help request is no longer available.", title: "Request Unavailable", type: "warning" });
      }
    });

    // ── Acceptor cancelled ───────────────────────────────────────────────────
    socket.on("help:acceptor-cancelled", (data) => {
      console.log("[Help] Acceptor cancelled:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        acceptorCount: data.remainingAcceptors,
      }));
    });

    // ── No acceptors left ────────────────────────────────────────────────────
    socket.on("help:no-acceptors-left", () => {
      setHelpRequestStatus((prev) => ({
        ...prev,
        acceptorCount: 0,
        nearestETA: null,
        eta: null,
      }));
    });

    // ── Medic arrived (requester receives) ───────────────────────────────────
    socket.on("help:medic-arrived", (data) => {
      console.log("[Help] Medic arrived:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        medicArrived: true,
        arrivedMedic: data,
      }));
      setActiveHelpRequest((prev) => {
        if (!prev) return prev;
        const existingAcceptors = prev.acceptors || [];
        const updated = existingAcceptors.map((a) =>
          a.userId?.toString() === data.medicId?.toString()
            ? { ...a, status: "arrived" }
            : a
        );
        if (existingAcceptors.length === 0) {
          updated.push({ userId: data.medicId, userName: data.medicName, status: "arrived" });
        }
        return { ...prev, acceptors: updated };
      });
    });

    // ── ETA updated ──────────────────────────────────────────────────────────
    socket.on("help:eta-updated", (data) => {
      setHelpRequestStatus((prev) => ({
        ...prev,
        nearestETA: data.minETA,
        eta: data.minETA,
        acceptorCount: data.acceptorCount ?? prev?.acceptorCount,
      }));
    });

    // ── Medic live location (for requester's map) ────────────────────────────
    socket.on("help:medic-location-updated", (data) => {
      if (data?.location) {
        setMedicCurrentLocation({ lat: data.location.lat, lng: data.location.lng });
      }
    });

    // ── Request completed ────────────────────────────────────────────────────
    socket.on("help:request-completed", () => {
      console.log("[Help] Request completed");
      clearHelpState();
    });

    // ── Request cancelled by requester ───────────────────────────────────────
    socket.on("help:request-cancelled-by-user", () => {
      console.log("[Help] Request cancelled by user");
      clearHelpState();
    });

    // ── Request expired (4-min timeout) ─────────────────────────────────────
    socket.on("help:request-expired", () => {
      console.log("[Help] Request expired");
      clearHelpState();
    });
  }, [clearHelpState]);

  // ── Cleanup socket listeners ──────────────────────────────────────────────────
  const cleanupHelpSocketListeners = useCallback((socket) => {
    if (!socket) return;
    const events = [
      "help:request-received",
      "help:accepted",
      "help:joined-request-room",
      "help:request-status-snapshot",
      "help:request-no-longer-active",
      "help:error",
      "help:acceptor-cancelled",
      "help:no-acceptors-left",
      "help:medic-arrived",
      "help:eta-updated",
      "help:medic-location-updated",
      "help:request-completed",
      "help:request-cancelled-by-user",
      "help:request-expired",
    ];
    events.forEach((e) => socket.off(e));
  }, []);

  const value = {
    user,
    setUser,
    // Help Request
    activeHelpRequest,
    setActiveHelpRequest,
    helpRequestStatus,
    setHelpRequestStatus,
    incomingHelpRequest,
    setIncomingHelpRequest,
    isHelpRequester,
    setIsHelpRequester,
    medicCurrentLocation,
    setMedicCurrentLocation,
    // Deduplication ref — shared with UserHome for FCM/SW notification dedup
    seenHelpRequestIds,
    // Methods
    updateUserLocation,
    acceptHelpRequest,
    declineHelpRequest,
    cancelHelpRequest,
    completeHelpRequest,
    clearHelpState,
    setupHelpSocketListeners,
    cleanupHelpSocketListeners,
    socketRef,
  };

  return (
    <UserDataContext.Provider value={value}>
      {children}
    </UserDataContext.Provider>
  );
};

export default UserContext;
