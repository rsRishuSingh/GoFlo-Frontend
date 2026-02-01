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

    const joinCaptain = () => {
      socket.emit("join", {
        userId: captain._id,
        userType: "captain",
      });
    };

    joinCaptain();

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
      } catch (err) {
        console.error("Session expired, please login again");
        navigate("/captain-login");
      }
    };
    const interval = setInterval(refreshToken, 50 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // 3. Listen for New Rides AND Cancellations
  useEffect(() => {
    // A. Handle New Ride
    socket.on("new-ride", (data) => {
      setRide(data);
      setRidePopupPanel(true);
    });

    // B. Handle Ride Cancellation (Real-time update)
    socket.on("ride-cancelled", (data) => {
      // If the cancelled ride matches the one currently shown
      setRidePopupPanel(false);
      setConfirmRidePopupPanel(false); // Also close confirm panel if open
      setRide(null);
    });

    // Cleanup listeners
    return () => {
      socket.off("new-ride");
      socket.off("ride-cancelled");
    };
  }, [socket]);

  // 4. Confirm Ride Logic
  // Inside CaptainHome.jsx

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

      const message =
        error.response?.data?.message || "Ride is no longer available.";
      alert(message);

      setRidePopupPanel(false);
      setConfirmRidePopupPanel(false);
      setRide(null); 
    }
  }
  // 5. Animations
  useGSAP(
    function () {
      if (ridePopupPanel) {
        gsap.to(ridePopupPanelRef.current, {
          y: 0,
          duration: 0.5,
          ease: "power4.out",
        });
      } else {
        gsap.to(ridePopupPanelRef.current, {
          y: "100%",
          duration: 0.5,
          ease: "power4.in",
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
      <div className=" absolute p-6 top-0 flex items-center justify-between w-full z-10">
        <img
          className="w-24  bg-white rounded-4xl p-2 shadow-md"
          src="https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1280px-Ola_Cabs_logo.svg.png"
          alt="Ola Logo"
        />
        <Link
          to="/captain-logout"
          className="h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md"
        >
          <i className="text-xl  font-medium ri-logout-box-r-line"></i>
        </Link>
      </div>

      <div className="h-[55%] relative z-0">
        <LiveTracking />
      </div>

      <div className="h-[45%]  p-6 bg-white rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] relative z-10">
        <CaptainDetails />
      </div>

      <div
        ref={ridePopupPanelRef}
        className="absolute w-full z-20 bottom-0 translate-y-full bg-white px-3 py-5 pt-5 rounded-t-3xl shadow-2xl"
      >
        <RidePopUp
          ride={ride}
          setRide={setRide}
          setRidePopupPanel={setRidePopupPanel}
          setConfirmRidePopupPanel={setConfirmRidePopupPanel}
          confirmRide={confirmRide}
        />
      </div>

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
};;

export default CaptainHome;
