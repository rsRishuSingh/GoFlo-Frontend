import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import axios from "axios";
import "remixicon/fonts/remixicon.css";

// Components
import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import LiveTracking from "../components/LiveTracking";
import LiveRouteTracking from "../components/LiveRouteTracking";
import HelpButton from "../components/HelpButton";
import HelpRequestModal from "../components/HelpRequestModal";
import HelpAcceptancePanel from "../components/HelpAcceptancePanel";
import HelpInProgressPanel from "../components/HelpInProgressPanel";

// Context
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";
import { useAlert } from "../components/AlertModal";

// Firebase Service
import { initFCM, listenToMessages } from "../services/firebaseService";

const UserHome = () => {
  // --- State ---
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  const [fare, setFare] = useState({});
  const [vehicleType, setVehicleType] = useState(null);
  const [ride, setRide] = useState(null);
  const [rideCoordinates, setRideCoordinates] = useState(null);
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // --- Panel States ---
  const [panelOpen, setPanelOpen] = useState(false);
  const [vehiclePanel, setVehiclePanel] = useState(false);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);
  const [vehicleFound, setVehicleFound] = useState(false);
  const [waitingForDriver, setWaitingForDriver] = useState(false);

  // --- Refs ---
  const panelRef = useRef(null);
  const panelCloseRef = useRef(null);
  const panelWrapperRef = useRef(null);
  const vehiclePanelRef = useRef(null);
  const confirmRidePanelRef = useRef(null);
  const vehicleFoundRef = useRef(null);
  const waitingForDriverRef = useRef(null);
  const helpAcceptancePanelRef = useRef(null);
  const helpInProgressPanelRef = useRef(null);

  // --- Hooks ---
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const {
    user,
    incomingHelpRequest,
    setIncomingHelpRequest,
    activeHelpRequest,
    setActiveHelpRequest,
    helpRequestStatus,
    setHelpRequestStatus,
    isHelpRequester,
    setIsHelpRequester,
    medicCurrentLocation,
    acceptHelpRequest,
    declineHelpRequest,
    cancelHelpRequest,
    completeHelpRequest,
    clearHelpState,
    setupHelpSocketListeners,
    cleanupHelpSocketListeners,
    seenHelpRequestIds,
  } = useContext(UserDataContext);
  const { alertError, alertWarning, alertInfo } = useAlert();

  // --- Side Effects ---

  // 0. Firebase Cloud Messaging
  useEffect(() => {
    if (!user?._id) return;
    const initializeFirebase = async () => {
      try {
        const token = await initFCM("user");
        if (token) console.log("Firebase initialized with token:", token);
      } catch (error) {
        console.error("Error initializing Firebase:", error);
      }
    };
    initializeFirebase();
  }, [user?._id]);

  // 1. FCM foreground messages → show acceptance panel
  useEffect(() => {
    listenToMessages((notification) => {
      if (notification?.data?.action !== "open_help_request") return;

      const helpRequestId = notification.data.help_request_id;
      if (!helpRequestId) return;

      // Deduplication: don't show same request twice
      if (seenHelpRequestIds?.current?.has(helpRequestId)) return;

      setIncomingHelpRequest({
        helpRequestId,
        requesterId: notification.data.requester_id || null,
        requesterName: notification.data.requester_name,
        description: notification.data.description || "",
        requesterLocation: {
          lat: parseFloat(notification.data.requester_location_lat),
          lng: parseFloat(notification.data.requester_location_lng),
          coordinates: [
            parseFloat(notification.data.requester_location_lng),
            parseFloat(notification.data.requester_location_lat),
          ],
        },
      });
    });
  }, [setIncomingHelpRequest, seenHelpRequestIds]);

  // 2. Service-worker push-click messages (app was opened by notification click)
  useEffect(() => {
    const handleSwMessage = (event) => {
      if (!event?.data) return;
      const { action, data } = event.data;
      if (action !== "accept_help" && action !== "open_help_request") return;

      const helpRequestId = data.help_request_id;
      if (!helpRequestId) return;
      if (seenHelpRequestIds?.current?.has(helpRequestId)) return;

      setIncomingHelpRequest({
        helpRequestId,
        requesterId: data.requester_id || null,
        requesterName: data.requester_name,
        description: data.description || "",
        requesterLocation: {
          lat: parseFloat(data.requester_location_lat),
          lng: parseFloat(data.requester_location_lng),
          coordinates: [
            parseFloat(data.requester_location_lng),
            parseFloat(data.requester_location_lat),
          ],
        },
      });
    };

    navigator.serviceWorker?.addEventListener("message", handleSwMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", handleSwMessage);
  }, [setIncomingHelpRequest, seenHelpRequestIds]);

  // 3. URL params (app opened from notification click when previously closed)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") !== "accept_help") return;

    const helpRequestId = params.get("help_request_id");
    if (!helpRequestId) return;
    if (seenHelpRequestIds?.current?.has(helpRequestId)) return;

    setIncomingHelpRequest({
      helpRequestId,
      requesterId: params.get("requester_id") || null,
      requesterName: params.get("requester_name"),
      description: params.get("description") || "",
      requesterLocation: {
        lat: parseFloat(params.get("requester_location_lat")) || 0,
        lng: parseFloat(params.get("requester_location_lng")) || 0,
        coordinates: [
          parseFloat(params.get("requester_location_lng")) || 0,
          parseFloat(params.get("requester_location_lat")) || 0,
        ],
      },
    });

    window.history.replaceState({}, document.title, window.location.pathname);
  }, [setIncomingHelpRequest, seenHelpRequestIds]);

  // 4. Continuous location tracking
  useEffect(() => {
    if (!user?._id || !socket) return;

    const updateLocation = () => {
      navigator.geolocation?.getCurrentPosition(
        (position) => {
          socket.emit("update-location-user", {
            userId: user._id,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
        },
        (err) => console.warn("Location update error:", err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    };

    const locationInterval = setInterval(updateLocation, 10000);
    updateLocation();
    return () => clearInterval(locationInterval);
  }, [user?._id, socket]);

  // --- Helpers ---
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("userToken")}`,
  });

  const getCurrentPosition = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) reject(new Error("Geolocation not supported"));
      else
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
    });

  // --- Socket setup ---
  useEffect(() => {
    if (!user?._id || !socket) return;

    socket.emit("join", { userType: "user", userId: user._id });
    console.log("User joined socket room:", user._id);

    setupHelpSocketListeners(socket, user._id);

    const handleRideConfirmed = (rideData) => {
      setVehicleFound(false);
      setVehiclePanel(false);
      setWaitingForDriver(true);
      setRide(rideData);
    };

    const handleRideStarted = (rideData) => {
      setWaitingForDriver(false);
      setPickup("");
      setDestination("");
      navigate("/user-riding", { state: { ride: rideData } });
    };

    socket.on("ride-confirmed", handleRideConfirmed);
    socket.on("ride-started", handleRideStarted);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);
      socket.off("ride-started", handleRideStarted);
      cleanupHelpSocketListeners(socket);
    };
  }, [user?._id, socket, navigate, setupHelpSocketListeners, cleanupHelpSocketListeners]);

  // JOIN RIDE ROOM
  useEffect(() => {
    if (waitingForDriver && ride?._id) {
      socket.emit("join-ride", { rideId: ride._id });
    }
  }, [waitingForDriver, ride, socket]);

  // POLLING: Waiting for Driver
  useEffect(() => {
    if (!waitingForDriver || !ride?._id) return;

    const fetchRideStatus = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/users/${ride._id}`,
          { headers: getAuthHeaders() },
        );

        if (response.data.status === "ongoing") {
          setWaitingForDriver(false);
          setPickup("");
          setDestination("");
          navigate("/user-riding", { state: { ride: response.data } });
          return;
        }

        if (response.data.status === "cancelled") {
          setWaitingForDriver(false);
          setVehicleFound(false);
          setRide(null);
          if (response.data.cancellationReason !== "User cancelled") {
            alertWarning("Your ride was cancelled by the captain.", "Ride Cancelled");
          }
          return;
        }

        setRide(response.data);
      } catch (err) {
        console.error("Error polling ride status:", err);
      }
    };

    const interval = setInterval(fetchRideStatus, 4000);
    fetchRideStatus();
    return () => clearInterval(interval);
  }, [waitingForDriver, ride?._id, navigate]);

  // POLLING: Looking for Driver
  useEffect(() => {
    if (!vehicleFound || !ride?._id) return;

    const checkAcceptance = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/users/${ride._id}`,
          { headers: getAuthHeaders() },
        );

        if (response.data.status === "accepted") {
          setVehicleFound(false);
          setWaitingForDriver(true);
          setRide(response.data);
        } else if (response.data.status === "cancelled") {
          setVehicleFound(false);
          setRide(null);
          if (response.data.cancellationReason !== "User cancelled") {
            alertWarning("Ride request cancelled by captain/system.", "Ride Cancelled");
          }
        }
      } catch (err) {
        console.error("Error polling acceptance:", err);
      }
    };

    const interval = setInterval(checkAcceptance, 4000);
    return () => clearInterval(interval);
  }, [vehicleFound, ride?._id]);

  // TIMEOUT: 3 minutes — standard ride looking for a captain
  useEffect(() => {
    if (!vehicleFound || !ride?._id || vehicleType === "ambulance") return;

    const timer = setTimeout(async () => {
      // Cancel the ride on the backend
      try {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
          { rideId: ride._id },
          { headers: getAuthHeaders() },
        );
      } catch (err) {
        console.error("[Timeout] Failed to cancel ride:", err);
      }
      setVehicleFound(false);
      setWaitingForDriver(false);
      setRide(null);
      setPanelOpen(false);
      alertWarning("No captain available nearby. Please try again.", "Captain Not Available");
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearTimeout(timer);
  }, [vehicleFound, ride?._id, vehicleType]);

  // TIMEOUT: 3 minutes — emergency (SOS ambulance) looking for a captain
  useEffect(() => {
    if (!vehicleFound || !ride?._id || vehicleType !== "ambulance") return;

    const timer = setTimeout(async () => {
      try {
        await axios.post(
          `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
          { rideId: ride._id },
          { headers: getAuthHeaders() },
        );
      } catch (err) {
        console.error("[Timeout] Failed to cancel emergency ride:", err);
      }
      setVehicleFound(false);
      setWaitingForDriver(false);
      setRide(null);
      setPanelOpen(false);
      alertWarning("No ambulance captain available right now. Please call emergency services.", "Captain Not Available");
    }, 3 * 60 * 1000); // 3 minutes

    return () => clearTimeout(timer);
  }, [vehicleFound, ride?._id, vehicleType]);

  // TIMEOUT: 10 minutes — waiting for a medic to accept a help request
  useEffect(() => {
    // Only start when this user IS the requester AND request is in-progress with no acceptors yet
    if (!isHelpRequester || !helpRequestStatus?.helpRequestId) return;
    // If a medic already accepted (acceptorCount > 0), don't start/keep the timer
    if ((helpRequestStatus.acceptorCount ?? 0) > 0) return;

    const helpRequestId = helpRequestStatus.helpRequestId;

    const timer = setTimeout(async () => {
      // Cancel the help request
      cancelHelpRequest(helpRequestId, socket, "Timeout — no medic accepted");
      clearHelpState();
      alertWarning("No medics accepted your request. Please call emergency services or try again.", "No Medics Available");
      navigate("/");
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearTimeout(timer);
  }, [isHelpRequester, helpRequestStatus?.helpRequestId, helpRequestStatus?.acceptorCount]);

  // --- Suggestions ---
  const fetchSuggestions = async (input) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        { params: { input }, headers: getAuthHeaders() },
      );
      return response.data;
    } catch {
      return [];
    }
  };

  const handlePickupChange = async (e) => {
    setPickup(e.target.value);
    setPickupSuggestions(await fetchSuggestions(e.target.value));
  };

  const handleDestinationChange = async (e) => {
    setDestination(e.target.value);
    setDestinationSuggestions(await fetchSuggestions(e.target.value));
  };

  const findTrip = async () => {
    try {
      const [pickupRes, destRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
          params: { address: pickup },
          headers: getAuthHeaders(),
        }),
        axios.get(`${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`, {
          params: { address: destination },
          headers: getAuthHeaders(),
        }),
      ]);

      const originData = { location_name: pickup, ltd: pickupRes.data.ltd, lng: pickupRes.data.lng };
      const destinationData = { location_name: destination, ltd: destRes.data.ltd, lng: destRes.data.lng };

      setRideCoordinates({ origin: originData, destination: destinationData });

      const fareResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        { origin: originData, destination: destinationData },
        { headers: getAuthHeaders() },
      );

      setFare(fareResponse.data);
      setVehiclePanel(true);
      setPanelOpen(false);
    } catch (error) {
      console.error("Error finding trip:", error);
      if (error.response) {
        alertError(error.response.data.message || "Error calculating fare", "Could Not Get Fare");
        navigate("/user-login");
      }
    }
  };

  const createRide = async () => {
    if (!rideCoordinates) { alertError("Invalid ride data. Please search again.", "Invalid Data"); return; }
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        { origin: rideCoordinates.origin, destination: rideCoordinates.destination, vehicleType },
        { headers: getAuthHeaders() },
      );
      setRide(response.data);
      setVehicleFound(true);
      setConfirmRidePanel(false);
    } catch (error) {
      console.error("Error creating ride:", error);
      alertError("Error creating ride. Please try again.", "Ride Error");
      navigate("/user-riding");
    }
  };

  const cancelRide = async () => {
    if (!ride?._id) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        { rideId: ride._id },
        { headers: getAuthHeaders() },
      );
      setVehicleFound(false);
      setWaitingForDriver(false);
      setRide(null);
      setPanelOpen(false);
    } catch (error) {
      console.error("Error cancelling ride:", error);
      alertError("Failed to cancel ride", "Cancel Failed");
      navigate("/user-login");
    }
  };

  const getAddressFromCoordinates = async (ltd, lng) => {
    const addressResponse = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/maps/get-address`,
      { params: { ltd, lng }, headers: getAuthHeaders() },
    );
    return addressResponse.data.address;
  };

  const handleUseCurrentLocation = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);
      setPickup(address);
    } catch (error) {
      console.error("Error setting current location:", error);
      alertError("Unable to fetch your location. Please enable GPS.", "Location Error");
      navigate("/user-login");
    }
  };

  const handleEmergencyRide = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const hospitalResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-nearest-hospital`,
        { params: { ltd: latitude, lng: longitude }, headers: getAuthHeaders() },
      );
      const hospital = hospitalResponse.data;
      const location_name = await getAddressFromCoordinates(latitude, longitude);
      const originData = { location_name, ltd: latitude, lng: longitude };

      const rideResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        { origin: originData, destination: hospital, vehicleType: "ambulance", isEmergency: true },
        { headers: getAuthHeaders() },
      );

      if (rideResponse.status === 201) {
        setPickup(originData.location_name);
        setDestination(hospital.location_name);
        setVehicleType("ambulance");
        setFare({ ambulance: rideResponse.data.fare });
        setRide(rideResponse.data);
        setVehicleFound(true);
        setPanelOpen(false);
        setVehiclePanel(false);
      }
    } catch (error) {
      console.error("SOS Error:", error);
      alertError("Failed to initiate emergency ride.", "SOS Error");
      navigate("/user-login");
    }
  };

  // --- Animations ---
  useGSAP(() => {
    if (panelOpen) {
      gsap.to(panelWrapperRef.current, { height: "100%" });
      gsap.to(panelRef.current, { height: "70%", padding: 24 });
      gsap.to(panelCloseRef.current, { opacity: 1 });
    } else {
      gsap.to(panelWrapperRef.current, { height: "35%" });
      gsap.to(panelRef.current, { height: "0%", padding: 0 });
      gsap.to(panelCloseRef.current, { opacity: 0 });
    }
  }, [panelOpen]);

  const slidePanel = (ref, isOpen) => {
    gsap.to(ref.current, { y: isOpen ? "0%" : "100%", duration: 0.3, ease: "power3.out" });
  };

  useGSAP(() => slidePanel(vehiclePanelRef, vehiclePanel), [vehiclePanel]);
  useGSAP(() => slidePanel(confirmRidePanelRef, confirmRidePanel), [confirmRidePanel]);
  useGSAP(() => slidePanel(vehicleFoundRef, vehicleFound), [vehicleFound]);
  useGSAP(() => slidePanel(waitingForDriverRef, waitingForDriver), [waitingForDriver]);
  useGSAP(() => slidePanel(helpAcceptancePanelRef, !!incomingHelpRequest), [incomingHelpRequest]);
  useGSAP(() => slidePanel(helpInProgressPanelRef, helpRequestStatus?.status === "in-progress"), [helpRequestStatus?.status]);

  // --- Map decision ---
  const captainLocation = ride?.captain?.location?.coordinates
    ? { lat: ride.captain.location.coordinates[1], lng: ride.captain.location.coordinates[0] }
    : null;

  const rideMapDestination = useMemo(() => {
    if (ride?.origin) return { lat: ride.origin.ltd, lng: ride.origin.lng };
    return null;
  }, [ride?.origin?.ltd, ride?.origin?.lng]);

  // HELP FLOW MAP: Requester sees nearest medic's location; Medic sees requester's location
  const helpIsActive = helpRequestStatus?.status === "in-progress";

  const helpMedicDestination = useMemo(() => {
    // Medic navigates TO the requester
    if (!helpIsActive || isHelpRequester || !activeHelpRequest?.requesterLocation) return null;
    const loc = activeHelpRequest.requesterLocation;
    return {
      lat: loc.lat ?? loc.coordinates?.[1],
      lng: loc.lng ?? loc.coordinates?.[0],
    };
  }, [helpIsActive, isHelpRequester, activeHelpRequest?.requesterLocation]);

  const helpRequesterMedicPosition = useMemo(() => {
    // Requester sees the nearest medic's live location (updated via socket)
    if (!helpIsActive || !isHelpRequester || !medicCurrentLocation) return null;
    return medicCurrentLocation;
  }, [helpIsActive, isHelpRequester, medicCurrentLocation]);

  const isFindTripDisabled = pickup.length < 3 || destination.length < 3;

  // Pre-check requester status before accepting
  const handleAcceptWithCheck = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/help/request/${incomingHelpRequest.helpRequestId}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("userToken")}` } },
      );
      const json = await res.json();
      const status = json?.data?.status ?? json?.status;
      if (status && status !== "pending") {
        setIncomingHelpRequest(null);
        alertWarning(`This request is no longer available (${status}).`, "Request Unavailable");
        return;
      }
    } catch {
      // Proceed anyway — backend will reject via help:error if stale
    }
    acceptHelpRequest(incomingHelpRequest, socket);
  };

  return (
    <div className="h-screen relative w-full overflow-hidden">
      <div className="absolute left-5 top-5 z-10">
        <img className="w-28 bg-white rounded-4xl shadow-md my-2" src="/logo.png" alt="Logo" />
        <Link
          to="/user-logout"
          className="h-10 w-10 mt-5 bg-white flex items-center justify-center rounded-full shadow-md"
        >
          <i className="text-xl font-medium ri-logout-box-line" />
        </Link>
      </div>

      {/* MAP — priority: help(medic nav) > help(requester nav) > ride > default */}
      <div className="h-[70%] w-full z-0">
        {helpIsActive && !isHelpRequester && helpMedicDestination ? (
          // MEDIC: navigate to requester's location
          <LiveRouteTracking
            destination={helpMedicDestination}
            isCaptain={true}
          />
        ) : helpIsActive && isHelpRequester && helpRequesterMedicPosition ? (
          // REQUESTER: show nearest medic's live position as destination
          <LiveRouteTracking
            destination={helpRequesterMedicPosition}
            isCaptain={false}
            captainLocation={helpRequesterMedicPosition}
          />
        ) : waitingForDriver && ride && rideMapDestination ? (
          // Ride in progress
          <LiveRouteTracking
            destination={rideMapDestination}
            isCaptain={false}
            rideId={ride._id}
            captainLocation={captainLocation}
          />
        ) : (
          <LiveTracking />
        )}
      </div>

      {/* Help Button and Modal */}
      <HelpButton onClick={() => setHelpModalOpen(true)} />
      <HelpRequestModal
        isOpen={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        user={user}
        socket={socket}
        onSuccess={(data) => {
          setIsHelpRequester(true);
          if (data?.helpRequestId) {
            setHelpRequestStatus({
              status: "in-progress",
              helpRequestId: data.helpRequestId,
              acceptorCount: 0,
            });
            setActiveHelpRequest({
              helpRequestId: data.helpRequestId,
              requesterId: user?._id,
              requesterName: `${user?.fullname?.firstname} ${user?.fullname?.lastname || ""}`.trim(),
              requesterLocation: data.location
                ? { lat: data.location.lat, lng: data.location.lng, coordinates: [data.location.lng, data.location.lat] }
                : null,
              acceptors: [],
              description: "",
            });
          }
        }}
      />

      {/* SOS Emergency Ride */}
      <button
        onClick={handleEmergencyRide}
        className="absolute top-[10%] right-5 z-5 bg-[#e6f11a] text-black h-11 w-11 rounded-full shadow-2xl flex items-center justify-center cursor-pointer animate-pulse active:scale-90 transition-all"
      >
        <div className="flex flex-col items-center">
          <i className="ri-alarm-warning-fill text-lg" />
          <span className="text-[8px] font-bold uppercase">SOS</span>
        </div>
      </button>

      <button
        onClick={handleUseCurrentLocation}
        className="absolute bottom-[37%] right-5 z-5 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
      >
        <i className="ri-crosshair-2-line text-2xl" />
      </button>

      {/* Bottom panel */}
      <div
        ref={panelWrapperRef}
        className="flex flex-col h-[35%] absolute bottom-0 w-full z-10 bg-white"
      >
        <div className="p-6 bg-white rounded-t-3xl relative">
          <h5
            ref={panelCloseRef}
            onClick={() => setPanelOpen(false)}
            className="absolute opacity-0 right-6 top-6 text-2xl cursor-pointer z-10"
          >
            <i className="ri-arrow-down-wide-line" />
          </h5>

          <h3 className="my-2 relative font-bold">
            <span className="text-2xl">
              Hi{" "}
              {user?.fullname?.firstname
                ? user.fullname.firstname.charAt(0).toUpperCase() + user.fullname.firstname.slice(1)
                : "There"}
              ,{" "}
            </span>
            <span className="text-2xl">
              Book a Ride{" "}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="rgba(170,234,54,1)" className="w-7 h-7 inline">
                <path d="M2 5L9 2L15 5L21.303 2.2987C21.5569 2.18992 21.8508 2.30749 21.9596 2.56131C21.9862 2.62355 22 2.69056 22 2.75827V19L15 22L9 19L2.69696 21.7013C2.44314 21.8101 2.14921 21.6925 2.04043 21.4387C2.01375 21.3765 2 21.3094 2 21.2417V5Z" />
              </svg>
            </span>
          </h3>

          <form className="relative py-3" onSubmit={(e) => e.preventDefault()}>
            <div className="absolute h-18 w-1 top-1/2 -translate-y-1/2 left-5 bg-gray-800 rounded-full" />
            <input
              onClick={() => { setPanelOpen(true); setActiveField("pickup"); }}
              value={pickup}
              onChange={handlePickupChange}
              className="bg-gray-100 px-12 py-2 text-base rounded-lg w-full"
              placeholder="Add a pick-up location"
            />
            <input
              onClick={() => { setPanelOpen(true); setActiveField("destination"); }}
              value={destination}
              onChange={handleDestinationChange}
              className="bg-gray-100 px-12 py-2 text-base rounded-lg w-full my-4"
              placeholder="Enter your destination"
            />
          </form>
          <button
            onClick={findTrip}
            disabled={isFindTripDisabled}
            className={`${
              isFindTripDisabled
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#9aec00] text-gray-950 cursor-pointer"
            } font-bold px-4 py-3 rounded-2xl w-full text-lg transition-colors duration-200`}
          >
            Find Ride
          </button>
        </div>
        <div ref={panelRef} className="bg-white h-0 overflow-hidden">
          <LocationSearchPanel
            suggestions={activeField === "pickup" ? pickupSuggestions : destinationSuggestions}
            setPanelOpen={setPanelOpen}
            setVehiclePanel={setVehiclePanel}
            setPickup={setPickup}
            setDestination={setDestination}
            activeField={activeField}
          />
        </div>
      </div>

      {/* Help Acceptance Panel — slide-up from bottom */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none">
        <div ref={helpAcceptancePanelRef} className="pointer-events-auto w-full max-w-md translate-y-full bg-white px-3 py-6 pt-12 rounded-t-3xl shadow-2xl">
          {incomingHelpRequest && (
            <HelpAcceptancePanel
              key={incomingHelpRequest.helpRequestId}
              helpRequest={incomingHelpRequest}
              onAccept={handleAcceptWithCheck}
              onDecline={() =>
                declineHelpRequest(incomingHelpRequest.helpRequestId, socket)
              }
              isLoading={helpRequestStatus?.status === "accepting"}
            />
          )}
        </div>
      </div>

      {/* Help In-Progress Panel — slide-up from bottom */}
      <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none">
        <div ref={helpInProgressPanelRef} className="pointer-events-auto w-full max-w-md translate-y-full bg-white px-3 py-6 pt-12 rounded-t-3xl shadow-2xl">
          {helpRequestStatus?.status === "in-progress" && (
            <HelpInProgressPanel
              key={helpRequestStatus.helpRequestId}
              helpRequest={incomingHelpRequest || activeHelpRequest}
              isUserView={isHelpRequester}
              acceptorCountProp={helpRequestStatus.acceptorCount}
              nearestETAProp={helpRequestStatus.nearestETA ?? helpRequestStatus.eta}
              medicArrivedProp={helpRequestStatus.medicArrived}
              helpRequestId={helpRequestStatus.helpRequestId}
              socket={socket}
              userId={user?._id}
              onComplete={() => {
                const helpRequestId = helpRequestStatus.helpRequestId;
                if (!helpRequestId || !socket) return;
                if (isHelpRequester) {
                  completeHelpRequest(helpRequestId, socket);
                } else {
                  // Medic marks arrived → notify backend, then return to home screen
                  socket.emit("help:medic-arrived", { medicId: user._id, helpRequestId });
                  clearHelpState();
                }
              }}
              onCancel={() => {
                const helpRequestId = helpRequestStatus.helpRequestId;
                if (helpRequestId && socket) {
                  if (!isHelpRequester) {
                    // Medic cancels their acceptance
                    socket.emit("help:cancel-accepted", { medicId: user._id, helpRequestId });
                  } else {
                    // Requester cancels the whole request
                    cancelHelpRequest(helpRequestId, socket, "User cancelled");
                  }
                }
                clearHelpState();
              }}
            />
          )}
        </div>
      </div>

      {/* Slide-up panels (vehicle, confirm, looking, waiting) */}
      {[
        [vehiclePanelRef, <VehiclePanel selectVehicle={setVehicleType} fare={fare} setConfirmRidePanel={setConfirmRidePanel} setVehiclePanel={setVehiclePanel} />],
        [confirmRidePanelRef, <ConfirmRide createRide={createRide} pickup={pickup} destination={destination} fare={fare} vehicleType={vehicleType} setConfirmRidePanel={setConfirmRidePanel} setVehicleFound={setVehicleFound} />],
        [vehicleFoundRef, <LookingForDriver pickup={pickup} destination={destination} fare={fare} vehicleType={vehicleType} setVehicleFound={setVehicleFound} cancelRide={cancelRide} />],
        [waitingForDriverRef, <WaitingForDriver ride={ride} setVehicleFound={setVehicleFound} setWaitingForDriver={setWaitingForDriver} waitingForDriver={waitingForDriver} cancelRide={cancelRide} />],
      ].map(([ref, Component], idx) => (
        <div key={idx} className="fixed inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none">
          <div ref={ref} className="pointer-events-auto w-full max-w-md translate-y-full bg-white px-3 py-6 pt-12 rounded-t-3xl shadow-2xl">
            {Component}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserHome;
