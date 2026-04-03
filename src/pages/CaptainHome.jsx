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
              lat: position.coords.latitude,
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

  useEffect(() => {
    socket.on("new-ride", (data) => {
      setRide(data);
      setRidePopupPanel(true);
    });

    socket.on("ride-cancelled", (data) => {
      setRidePopupPanel(false);
      setConfirmRidePopupPanel(false);
      setRide(null);
    });

    return () => {
      socket.off("new-ride");
      socket.off("ride-cancelled");
    };
  }, [socket]);

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
      <img
        className="absolute top-6 left-6 z-10 w-28 bg-white rounded-4xl shadow-md"
        src="/logo.png"
        alt="Ola Logo"
      />
      <Link
        to="/captain-logout"
        className="absolute top-24 left-6 z-10 h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md"
      >
        <i className="text-xl font-medium ri-logout-box-r-line"></i>
      </Link>

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
};

export default CaptainHome;
