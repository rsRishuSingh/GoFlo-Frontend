import React, { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import axios from "axios";
import "remixicon/fonts/remixicon.css";
import LocationSearchPanel from "../components/LocationSearchPanel";
import VehiclePanel from "../components/VehiclePanel";
import ConfirmRide from "../components/ConfirmRide";
import LookingForDriver from "../components/LookingForDriver";
import WaitingForDriver from "../components/WaitingForDriver";
import { SocketContext } from "../context/SocketContext";
import { useContext } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import LiveTracking from "../components/LiveTracking";

const UserHome = () => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);

  const panelRef = useRef(null);
  const panelCloseRef = useRef(null);
  const panelWrapperRef = useRef(null);

  const vehiclePanelRef = useRef(null);
  const [vehiclePanel, setVehiclePanel] = useState(false);

  const confirmRidePanelRef = useRef(null);
  const [confirmRidePanel, setConfirmRidePanel] = useState(false);

  const vehicleFoundRef = useRef(null);
  const [vehicleFound, setVehicleFound] = useState(false);

  const waitingForDriverRef = useRef(null);
  const [waitingForDriver, setWaitingForDriver] = useState(false);

  const [pickupSuggestions, setPickupSuggestions] = useState([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState([]);

  const [activeField, setActiveField] = useState(null);
  const [fare, setFare] = useState({});
  const [vehicleType, setVehicleType] = useState(null);
  const [ride, setRide] = useState(null);

  // New state to store coordinates to avoid re-fetching
  const [rideCoordinates, setRideCoordinates] = useState(null);

  const navigate = useNavigate();

  const { socket } = useContext(SocketContext);
  const { user } = useContext(UserDataContext);

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

  const handlePickupChange = async (e) => {
    setPickup(e.target.value);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        {
          params: { input: e.target.value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );
      setPickupSuggestions(response.data);
    } catch {}
  };

  const handleDestinationChange = async (e) => {
    setDestination(e.target.value);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-suggestions`,
        {
          params: { input: e.target.value },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );
      setDestinationSuggestions(response.data);
    } catch {}
  };

  const submitHandler = (e) => {
    e.preventDefault();
  };

  /* ---------- GSAP animations ---------- */

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

  const slide = (ref, open) => {
    gsap.to(ref.current, {
      y: open ? "0%" : "100%",
      duration: 0.3,
      ease: "power3.out",
    });
  };

  useGSAP(() => slide(vehiclePanelRef, vehiclePanel), [vehiclePanel]);
  useGSAP(
    () => slide(confirmRidePanelRef, confirmRidePanel),
    [confirmRidePanel],
  );
  useGSAP(() => slide(vehicleFoundRef, vehicleFound), [vehicleFound]);
  useGSAP(
    () => slide(waitingForDriverRef, waitingForDriver),
    [waitingForDriver],
  );

  async function findTrip() {
    try {
      const pickupCoords = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`,
        {
          params: { address: pickup },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );

      const destinationCoords = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/maps/get-coordinates`,
        {
          params: { address: destination },
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );

      // Construct data using 'ltd' as per your backend requirement
      const originData = {
        location_name: pickup,
        ltd: pickupCoords.data.ltd, // Map service likely returns 'latitude'
        lng: pickupCoords.data.lng,
      };

      const destinationData = {
        location_name: destination,
        ltd: destinationCoords.data.ltd,
        lng: destinationCoords.data.lng,
      };

      // Store coordinates for createRide
      setRideCoordinates({ origin: originData, destination: destinationData });

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/get-fare`,
        { origin: originData, destination: destinationData },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );

      setFare(response.data);
      setVehiclePanel(true);
      setPanelOpen(false);
    } catch (error) {
      console.error("Error finding trip:", error);
      if (error.response) {
        alert(error.response.data.message || "Error calculating fare");
      }
    }
  }

  async function createRide() {
    // Reuse stored coordinates to avoid double API calls
    if (!rideCoordinates) {
      alert("Invalid ride data. Please search again.");
      return;
    }

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/create`,
        {
          origin: rideCoordinates.origin,
          destination: rideCoordinates.destination,
          vehicleType,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );
    } catch (error) {
      console.error("Error creating ride:", error);
      alert("Error creating ride. Please try again.");
    }
  }

  return (
    <div className="h-screen relative w-full overflow-hidden">
      <img
        className="w-16 absolute left-5 top-5 z-10"
        src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
        alt="Uber Logo"
      />

      <div className="h-[70%] w-full z-0">
        <LiveTracking />
      </div>

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

          <form className="relative py-3" onSubmit={submitHandler}>
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
            className="bg-black text-white px-4 py-2 rounded-lg w-full"
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

      {/* ---------- FIXED PANELS (CENTERED WRAPPER) ---------- */}

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
          />,
        ],
        [
          waitingForDriverRef,
          <WaitingForDriver
            ride={ride}
            setVehicleFound={setVehicleFound}
            setWaitingForDriver={setWaitingForDriver}
            waitingForDriver={waitingForDriver}
          />,
        ],
      ].map(([ref, Component], idx) => (
        <div
          key={idx}
          className="fixed inset-x-0 bottom-0 z-20 flex justify-center pointer-events-none"
        >
          <div
            ref={ref}
            className="pointer-events-auto w-full max-w-md translate-y-full
                        bg-white px-3 py-6 pt-12 rounded-t-3xl shadow-2xl"
          >
            {Component}
          </div>
        </div>
      ))}
    </div>
  );
};

export default UserHome;
