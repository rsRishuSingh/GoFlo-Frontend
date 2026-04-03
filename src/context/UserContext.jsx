import React, {
  createContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import helpService from "../services/helpService";

export const UserDataContext = createContext();

const UserContext = ({ children }) => {
  const [user, setUser] = useState({
    email: "",
    _id: null,
    fullname: {
      firstname: "",
      lastname: "",
    },
  });

  // Help Request States
  const [activeHelpRequest, setActiveHelpRequest] = useState(null);
  const [helpRequestStatus, setHelpRequestStatus] = useState(null);
  const [incomingHelpRequest, setIncomingHelpRequest] = useState(null);
  const [helpRequestHistory, setHelpRequestHistory] = useState([]);

  // Location Tracking
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyMedics, setNearbyMedics] = useState([]);
  const [medicLocations, setMedicLocations] = useState({}); // { medicId: {lat, lng} }

  // Socket Reference
  const socketRef = useRef(null);

  // Update user location periodically and on significant movement
  const updateUserLocation = useCallback(
    (lat, lng, socket) => {
      if (!socket) return;

      const newLocation = { lat, lng };
      setUserLocation(newLocation);

      // Emit location update to socket (will only update DB on >10m movement)
      socket.emit("update-location-user", {
        userId: user._id,
        location: { lat, lng },
      });
    },
    [user._id],
  );

  // Send help request
  const sendHelpRequest = useCallback(
    async (location, socket) => {
      if (!socket) return;

      socket.emit("help:send-request", {
        userId: user._id,
        requesterName: `${user.fullname.firstname} ${user.fullname.lastname}`,
        location: location,
        radius: 5,
      });
    },
    [user._id, user.fullname],
  );

  // Accept incoming help request (for medic role)
  const acceptHelpRequest = useCallback(
    async (helpRequest, socket) => {
      if (!helpRequest || !socket) return;

      try {
        const currentLocation =
          userLocation ||
          (await new Promise((resolve, reject) => {
            if (!navigator.geolocation) return resolve({ lat: 0, lng: 0 });
            navigator.geolocation.getCurrentPosition(
              (pos) =>
                resolve({
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude,
                }),
              () => resolve({ lat: 0, lng: 0 }),
              { enableHighAccuracy: true },
            );
          }));

        await helpService.acceptHelpRequest(
          helpRequest.helpRequestId,
          currentLocation,
        );
        setIncomingHelpRequest(null);
        setHelpRequestStatus((prev) => ({ ...prev, status: "accepted" }));
      } catch (error) {
        console.error("Error accepting help request:", error);
      }
    },
    [userLocation],
  );

  // Decline incoming help request
  const declineHelpRequest = useCallback(() => {
    setIncomingHelpRequest(null);
  }, []);

  // Cancel help request
  const cancelHelpRequest = useCallback(
    async (helpRequestId, socket, reason) => {
      if (!socket) return;

      socket.emit("help:cancel-request", {
        helpRequestId,
        reason: reason || "User cancelled",
      });
    },
    [],
  );

  // Complete help request
  const completeHelpRequest = useCallback(
    async (helpRequestId, socket) => {
      if (!socket) return;

      socket.emit("help:complete-request", {
        helpRequestId,
        userId: user._id,
      });
    },
    [user._id],
  );

  // Setup socket listeners for help events
  const setupHelpSocketListeners = useCallback((socket) => {
    socketRef.current = socket;

    // Incoming help request notification
    socket.on("help:request-received", (data) => {
      console.log("Incoming help request:", data);
      setIncomingHelpRequest(data);
    });

    // Help request accepted by someone
    socket.on("help:accepted", (data) => {
      console.log("Help request accepted:", data);
      setHelpRequestStatus({
        ...data,
        status: "in-progress",
      });
      setActiveHelpRequest((prev) => ({
        ...prev,
        ...data,
        status: "in-progress",
      }));
    });

    // Acceptor cancelled
    socket.on("help:acceptor-cancelled", (data) => {
      console.log("Acceptor cancelled:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        acceptorCount: data.remainingAcceptors,
      }));
    });

    // No acceptors left
    socket.on("help:no-acceptors-left", (data) => {
      console.log("No acceptors left:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        acceptorCount: 0,
      }));
    });

    // Medic arrived
    socket.on("help:medic-arrived", (data) => {
      console.log("Medic arrived:", data);
      setHelpRequestStatus((prev) => ({
        ...prev,
        medicArrived: true,
        arrivedMedic: data,
      }));
    });

    // Request completed
    socket.on("help:request-completed", (data) => {
      console.log("Request completed:", data);
      setActiveHelpRequest(null);
      setHelpRequestStatus(null);
      setIncomingHelpRequest(null);
    });

    // Request cancelled
    socket.on("help:request-cancelled-by-user", (data) => {
      console.log("Request cancelled by user:", data);
      setIncomingHelpRequest(null);
    });

    // Request expired
    socket.on("help:request-expired", (data) => {
      console.log("Request expired:", data);
      setActiveHelpRequest(null);
      setHelpRequestStatus(null);
    });

    // Medic location update
    socket.on("medic-location-update", (data) => {
      console.log("Medic location update:", data);
      setMedicLocations((prev) => ({
        ...prev,
        [data.medicId]: data.location,
      }));
    });
  }, []);

  // Cleanup socket listeners
  const cleanupHelpSocketListeners = useCallback((socket) => {
    if (!socket) return;
    socket.off("help:request-received");
    socket.off("help:accepted");
    socket.off("help:acceptor-cancelled");
    socket.off("help:no-acceptors-left");
    socket.off("help:medic-arrived");
    socket.off("help:request-completed");
    socket.off("help:request-cancelled-by-user");
    socket.off("help:request-expired");
    socket.off("medic-location-update");
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
    helpRequestHistory,
    setHelpRequestHistory,
    // Location
    userLocation,
    setUserLocation,
    nearbyMedics,
    setNearbyMedics,
    medicLocations,
    setMedicLocations,
    // Methods
    updateUserLocation,
    sendHelpRequest,
    acceptHelpRequest,
    declineHelpRequest,
    cancelHelpRequest,
    completeHelpRequest,
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
