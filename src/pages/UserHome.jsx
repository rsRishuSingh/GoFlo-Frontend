import React, { useEffect, useRef, useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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

// Context
import { SocketContext } from "../context/SocketContext";
import { UserDataContext } from "../context/UserContext";

const UserHome = () => {
  // --- State Management ---
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);
  const [activeField, setActiveField] = useState(null);

  const [fare, setFare] = useState({});
  const [vehicleType, setVehicleType] = useState(null);
  const [ride, setRide] = useState(null);
  const [rideCoordinates, setRideCoordinates] = useState(null);

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

  // --- Hooks ---
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);

  // --- Helpers ---
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

  // --- API Handlers ---

  // Cancel Ride Handler
  const cancelRide = async () => {
    if (!ride?._id) return;
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        { rideId: ride._id },
        { headers: getAuthHeaders() },
      );
      // Reset States
      setVehicleFound(false);
      setWaitingForDriver(false);
      setRide(null);
      setPanelOpen(false);
    } catch (error) {
      console.error("Error cancelling ride:", error);
      alert("Failed to cancel ride");
    }
  };

  // --- Side Effects ---

  // 1. Socket Connection & Events
  useEffect(() => {
    if (!user?._id) return;

    socket.emit("join", { userType: "user", userId: user._id });
    console.log("User joined socket room:", user._id);

    const handleRideConfirmed = (rideData) => {
      setVehicleFound(false);
      setWaitingForDriver(true);
      setRide(rideData);
    };

    const handleRideStarted = (rideData) => {
      setWaitingForDriver(false);
      navigate("/user-riding", { state: { ride: rideData } });
    };

    socket.on("ride-confirmed", handleRideConfirmed);
    socket.on("ride-started", handleRideStarted);

    return () => {
      socket.off("ride-confirmed", handleRideConfirmed);
      socket.off("ride-started", handleRideStarted);
    };
  }, [user, socket, navigate]);

  // 2. JOIN RIDE ROOM
  useEffect(() => {
    if (waitingForDriver && ride?._id) {
      socket.emit("join-ride", { rideId: ride._id });
    }
  }, [waitingForDriver, ride, socket]);

  // 3. POLLING: Waiting for Driver (Live Location & Status)
  useEffect(() => {
    if (waitingForDriver && ride?._id) {
      const fetchRideStatus = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/rides/users/${ride._id}`,
            { headers: getAuthHeaders() },
          );

          // FIX: Check if ride has started (fallback if socket event missed)
          if (response.data.status === "ongoing") {
            setWaitingForDriver(false);
            navigate("/user-riding", { state: { ride: response.data } });
            return;
          }

          // Check for cancellation by Captain
          if (response.data.status === "cancelled") {
            setWaitingForDriver(false);
            setVehicleFound(false);
            setRide(null);
            alert("Your ride was cancelled by the captain.");
            return;
          }

          setRide(response.data);
        } catch (err) {
          console.error("Error polling ride status:", err);
        }
      };

      // Poll every 4 seconds
      const interval = setInterval(fetchRideStatus, 4000);
      fetchRideStatus(); // Initial call

      return () => clearInterval(interval);
    }
  }, [waitingForDriver, ride?._id, navigate]);

  // 4. POLLING: Looking for Driver (Waiting for Accept)
  useEffect(() => {
    if (vehicleFound && ride?._id) {
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
          }

          if (response.data.status === "cancelled") {
            setVehicleFound(false);
            setRide(null);
            alert("Ride request cancelled.");
          }
        } catch (err) {
          console.error("Error polling acceptance:", err);
        }
      };

      const interval = setInterval(checkAcceptance, 4000);
      return () => clearInterval(interval);
    }
  }, [vehicleFound, ride?._id]);

  // 5. Token Refresh Interval
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/users/refresh-token`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem("userToken", response.data.userToken);
      } catch (err) {
        console.error("Session expired, please login again");
        navigate("/user-login");
      }
    };
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // --- Suggestions & Geocoding Handlers ---
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
    const suggestions = await fetchSuggestions(e.target.value);
    setPickupSuggestions(suggestions);
  };

  const handleDestinationChange = async (e) => {
    setDestination(e.target.value);
    const suggestions = await fetchSuggestions(e.target.value);
    setDestinationSuggestions(suggestions);
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

      const originData = {
        location_name: pickup,
        ltd: pickupRes.data.ltd,
        lng: pickupRes.data.lng,
      };

      const destinationData = {
        location_name: destination,
        ltd: destRes.data.ltd,
        lng: destRes.data.lng,
      };

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
        alert(error.response.data.message || "Error calculating fare");
      }
    }
  };

  const createRide = async () => {
    if (!rideCoordinates) {
      return alert("Invalid ride data. Please search again.");
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          origin: rideCoordinates.origin,
          destination: rideCoordinates.destination,
          vehicleType,
        },
        { headers: getAuthHeaders() },
      );

      setRide(response.data);
      setVehicleFound(true);
      setConfirmRidePanel(false);
    } catch (error) {
      console.error("Error creating ride:", error);
      alert("Error creating ride. Please try again.");
    }
  };

  const getAddressFromCoordinates = async (ltd, lng) => {
    const addressResponse = await axios.get(
      `${import.meta.env.VITE_BASE_URL}/maps/get-address`,
      {
        params: { ltd, lng },
        headers: getAuthHeaders(),
      },
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
      alert("Unable to fetch your location");
    }
  };

  const handleEmergencyRide = async () => {
    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      const hospitalResponse = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-nearest-hospital`,
        {
          params: { ltd: latitude, lng: longitude },
          headers: getAuthHeaders(),
        },
      );
      const hospital = hospitalResponse.data;
      const location_name = await getAddressFromCoordinates(
        latitude,
        longitude,
      );

      const originData = { location_name, ltd: latitude, lng: longitude };

      const rideResponse = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          origin: originData,
          destination: hospital,
          vehicleType: "car",
          isEmergency: true,
        },
        { headers: getAuthHeaders() },
      );

      if (rideResponse.status === 201) {
        setPickup("Current Location");
        setDestination(hospital.location_name);
        setVehicleType("car");
        setFare({ car: rideResponse.data.fare });

        setRide(rideResponse.data);
        setVehicleFound(true);
        setPanelOpen(false);
        setVehiclePanel(false);
      }
    } catch (error) {
      console.error("SOS Error:", error);
      alert("Failed to initiate emergency ride.");
    }
  };

  // --- Animations ---
  useGSAP(() => {
    if (panelOpen) {
      gsap.to(panelWrapperRef.current, { height: "100%" });
      gsap.to(panelRef.current, { height: "70%", padding: 24 });
      gsap.to(panelCloseRef.current, { opacity: 1 });
    } else {
      gsap.to(panelWrapperRef.current, { height: "30%" });
      gsap.to(panelRef.current, { height: "0%", padding: 0 });
      gsap.to(panelCloseRef.current, { opacity: 0 });
    }
  }, [panelOpen]);

  const slidePanel = (ref, isOpen) => {
    gsap.to(ref.current, {
      y: isOpen ? "0%" : "100%",
      duration: 0.3,
      ease: "power3.out",
    });
  };

  useGSAP(() => slidePanel(vehiclePanelRef, vehiclePanel), [vehiclePanel]);
  useGSAP(
    () => slidePanel(confirmRidePanelRef, confirmRidePanel),
    [confirmRidePanel],
  );
  useGSAP(() => slidePanel(vehicleFoundRef, vehicleFound), [vehicleFound]);
  useGSAP(
    () => slidePanel(waitingForDriverRef, waitingForDriver),
    [waitingForDriver],
  );

  const captainLocation = ride?.captain?.location?.coordinates
    ? {
        lat: ride.captain.location.coordinates[1],
        lng: ride.captain.location.coordinates[0],
      }
    : null;

  const mapDestination = useMemo(() => {
    if (ride && ride.origin) {
      return {
        lat: ride.origin.ltd,
        lng: ride.origin.lng,
      };
    }
    return null;
  }, [ride?.origin?.ltd, ride?.origin?.lng]);

  return (
    <div className="h-screen relative w-full overflow-hidden">
      <img
        className="w-16 absolute left-5 top-5 z-10"
        src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
        alt="Uber Logo"
      />

      <div className="h-[70%] w-full z-0">
        {/* CONDITIONALLY RENDER MAPS */}
        {waitingForDriver && ride && mapDestination ? (
          <LiveRouteTracking
            destination={mapDestination}
            isCaptain={false}
            rideId={ride._id}
            captainLocation={captainLocation}
          />
        ) : (
          <LiveTracking />
        )}
      </div>

      <button
        onClick={handleEmergencyRide}
        className="absolute top-[2%] right-5 z-5 bg-red-600 text-white h-13 w-13 rounded-full shadow-2xl flex items-center justify-center animate-pulse border-4 border-white active:scale-90 transition-all cursor-pointer"
      >
        <div className="flex flex-col items-center">
          <i className="ri-alarm-warning-fill text-lg"></i>
          <span className="text-[10px] font-bold uppercase">SOS</span>
        </div>
      </button>

      <button
        onClick={handleUseCurrentLocation}
        className="absolute bottom-[32%] right-5 z-5 h-10 w-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
      >
        <i className="ri-crosshair-fill text-xl text-gray-700"></i>
      </button>

      <div
        ref={panelWrapperRef}
        className="flex flex-col h-[30%] absolute bottom-0 w-full z-10 bg-white"
      >
        <div className="p-6 bg-white rounded-t-3xl shadow-lg relative">
          <h5
            ref={panelCloseRef}
            onClick={() => setPanelOpen(false)}
            className="absolute opacity-0 right-6 top-6 text-2xl cursor-pointer"
          >
            <i className="ri-arrow-down-wide-line"></i>
          </h5>
          <h4 className="text-2xl font-semibold">Find a trip</h4>
          <form className="relative py-3" onSubmit={(e) => e.preventDefault()}>
            <div className="absolute h-16 w-1 top-1/2 -translate-y-1/2 left-5 bg-gray-700 rounded-full" />
            <input
              onClick={() => {
                setPanelOpen(true);
                setActiveField("pickup");
              }}
              value={pickup}
              onChange={handlePickupChange}
              className="bg-gray-100 px-12 py-2 text-lg rounded-lg w-full"
              placeholder="Add a pick-up location"
            />
            <input
              onClick={() => {
                setPanelOpen(true);
                setActiveField("destination");
              }}
              value={destination}
              onChange={handleDestinationChange}
              className="bg-gray-100 px-12 py-2 text-lg rounded-lg w-full mt-3"
              placeholder="Enter your destination"
            />
          </form>
          <button
            onClick={findTrip}
            className="bg-black text-white px-4 py-2 rounded-lg w-full cursor-pointer"
          >
            Find Trip
          </button>
        </div>
        <div ref={panelRef} className="bg-white h-0 overflow-hidden">
          <LocationSearchPanel
            suggestions={
              activeField === "pickup"
                ? pickupSuggestions
                : destinationSuggestions
            }
            setPanelOpen={setPanelOpen}
            setVehiclePanel={setVehiclePanel}
            setPickup={setPickup}
            setDestination={setDestination}
            activeField={activeField}
          />
        </div>
      </div>

      {[
        [
          vehiclePanelRef,
          <VehiclePanel
            selectVehicle={setVehicleType}
            fare={fare}
            setConfirmRidePanel={setConfirmRidePanel}
            setVehiclePanel={setVehiclePanel}
          />,
        ],
        [
          confirmRidePanelRef,
          <ConfirmRide
            createRide={createRide}
            pickup={pickup}
            destination={destination}
            fare={fare}
            vehicleType={vehicleType}
            setConfirmRidePanel={setConfirmRidePanel}
            setVehicleFound={setVehicleFound}
          />,
        ],
        [
          vehicleFoundRef,
          <LookingForDriver
            pickup={pickup}
            destination={destination}
            fare={fare}
            vehicleType={vehicleType}
            setVehicleFound={setVehicleFound}
            // PASS CANCEL FUNCTION
            cancelRide={cancelRide}
          />,
        ],
        [
          waitingForDriverRef,
          <WaitingForDriver
            ride={ride}
            setVehicleFound={setVehicleFound}
            setWaitingForDriver={setWaitingForDriver}
            waitingForDriver={waitingForDriver}
            // PASS CANCEL FUNCTION
            cancelRide={cancelRide}
          />,
        ],
      ].map(([ref, Component], idx) => (
        <div
          key={idx}
          className="fixed inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none"
        >
          <div
            ref={ref}
            className="pointer-events-auto w-full max-w-md translate-y-full bg-white px-3 py-6 pt-12 rounded-t-3xl shadow-2xl"
          >
            {Component}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserHome;
