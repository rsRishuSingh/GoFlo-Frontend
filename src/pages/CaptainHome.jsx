import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import CaptainDetails from "../components/CaptainDetails";
import RidePopUp from "../components/RidePopUp";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import ConfirmRidePopUp from "../components/ConfirmRidePopUp";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import axios from "axios";
import LiveTracking from "../components/LiveTracking";

const CaptainHome = () => {
  const [ridePopupPanel, setRidePopupPanel] = useState(false);
  const [confirmRidePopupPanel, setConfirmRidePopupPanel] = useState(false);
  const [ride, setRide] = useState(null);

  const ridePopupPanelRef = useRef(null);
  const confirmRidePopupPanelRef = useRef(null);

  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  // 1. Socket Connection & Location Updates
  useEffect(() => {
    if (!captain?._id) return;

    // A. Join Logic
    const joinCaptain = () => {
      socket.emit("join", {
        userId: captain._id,
        userType: "captain",
      });
    };

    // Emit immediately on mount
    joinCaptain();

    // B. Location Logic
    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude,
            },
            activeRideId: null,
          });
        });
      }
    };

    const locationInterval = setInterval(updateLocation, 10000);
    updateLocation();

    // C. Reconnection Handling (Crucial for stability)
    // If the connection drops, we MUST re-join to update the socketId in DB
    socket.on("connect", joinCaptain);
    socket.on("reconnect", joinCaptain);

    return () => {
      clearInterval(locationInterval);
      socket.off("connect", joinCaptain);
      socket.off("reconnect", joinCaptain);
    };
  }, [captain, socket]);

  // 2. Token Refresh Logic
  useEffect(() => {
    const refreshToken = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/captains/refresh-token`,
          {},
          { withCredentials: true },
        );
        localStorage.setItem("captainToken", response.data.captainToken);
        console.log("Captain token refreshed", response.data.captainToken);
      } catch (err) {
        console.error("Session expired, please login again");
        navigate("/captain-login");
      }
    };
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // 3. Listen for New Rides
  useEffect(() => {
    socket.on("new-ride", (data) => {
      console.log("New ride received:", data);
      setRide(data);
      setRidePopupPanel(true);
    });

    // Cleanup listener on unmount
    return () => {
      socket.off("new-ride");
    };
  }, [socket]);

  // 4. Confirm Ride Logic
  async function confirmRide() {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/confirm`,
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
          },
        },
      );

      if (response.status === 200) {
        setRidePopupPanel(false);
        setConfirmRidePopupPanel(true);
      }
    } catch (error) {
      console.error("Error confirming ride:", error);
    }
  }

  // 5. Animations
  useGSAP(
    function () {
      if (ridePopupPanel) {
        gsap.to(ridePopupPanelRef.current, {
          transform: "translateY(0)",
        });
      } else {
        gsap.to(ridePopupPanelRef.current, {
          transform: "translateY(100%)",
        });
      }
    },
    [ridePopupPanel],
  );

  useGSAP(
    function () {
      if (confirmRidePopupPanel) {
        gsap.to(confirmRidePopupPanelRef.current, {
          transform: "translateY(0)",
        });
      } else {
        gsap.to(confirmRidePopupPanelRef.current, {
          transform: "translateY(100%)",
        });
      }
    },
    [confirmRidePopupPanel],
  );

  return (
    <div className="h-screen overflow-hidden relative">
      {/* Header */}
      <div className="absolute p-6 top-0 flex items-center justify-between w-full z-10">
        <img
          className="w-16"
          src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
          alt="Uber Logo"
        />
        <Link
          to="/captain-logout"
          className="h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md"
        >
          <i className="text-lg font-medium ri-logout-box-r-line"></i>
        </Link>
      </div>

      {/* Map Background */}
      <div className="h-3/5 relative z-0">
        <LiveTracking />
      </div>

      {/* Captain Details Panel */}
      <div className="h-2/5 p-6 bg-white rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] relative z-10">
        <CaptainDetails />
      </div>

      {/* Ride Request Popup (Slide Up) */}
      <div
        ref={ridePopupPanelRef}
        className="absolute w-full z-20 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 rounded-t-3xl shadow-2xl"
      >
        <RidePopUp
          ride={ride}
          setRidePopupPanel={setRidePopupPanel}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          confirmRide={confirmRide}
        />
      </div>

      {/* Confirm Ride Popup (Slide Up) */}
      <div
        ref={confirmRidePopupPanelRef}
        className="absolute w-full h-screen z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 rounded-t-3xl"
      >
        <ConfirmRidePopUp
          ride={ride}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          setRidePopupPanel={setRidePopupPanel}
        />
      </div>
    </div>
  );
};

export default CaptainHome;
