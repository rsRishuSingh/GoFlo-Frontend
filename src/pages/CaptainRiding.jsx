import React, { useState, useEffect, useContext, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";
import LiveRouteTracking from "../components/LiveRouteTracking";
import FinishRide from "../components/FinishRide";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const CaptainRiding = () => {
  const [finishRidePanel, setFinishRidePanel] = useState(false);
  const finishRidePanelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);

  const [rideData, setRideData] = useState(() => {
    if (location.state?.ride) {
      localStorage.setItem(
        "captainCurrentRide",
        JSON.stringify(location.state.ride),
      );
      return location.state.ride;
    }
    const saved = localStorage.getItem("captainCurrentRide");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (!rideData?._id) return;

    const checkStatus = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/captains/${rideData._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
            },
          },
        );
        if (res.data.status === "cancelled") {
          localStorage.removeItem("captainCurrentRide");
          navigate("/captain-home");
          alert("User cancelled the ride.");
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    socket.on("ride-cancelled", () => {
      localStorage.removeItem("captainCurrentRide");
      navigate("/captain-home");
    });

    return () => {
      clearInterval(interval);
      socket.off("ride-cancelled");
    };
  }, [rideData, navigate, socket]);

  useGSAP(() => {
    gsap.to(finishRidePanelRef.current, {
      transform: finishRidePanel ? "translateY(0)" : "translateY(100%)",
    });
  }, [finishRidePanel]);

  if (!rideData) return <div className="p-10">No active ride found...</div>;

  return (
    <div className="h-screen relative overflow-hidden">
      <div className="h-4/5 w-full">
        <LiveRouteTracking
          destination={{
            lat: rideData.destination.ltd,
            lng: rideData.destination.lng,
          }}
          isCaptain={true}
        />
      </div>
      <div
        className="h-1/5 p-6 bg-yellow-400 flex items-center justify-between"
        onClick={() => setFinishRidePanel(true)}
      >
        <h4 className="text-xl font-semibold">On the way to destination</h4>
        <button className="bg-green-600 text-white px-10 py-3 rounded-lg font-bold">
          Finish
        </button>
      </div>
      <div
        ref={finishRidePanelRef}
        className="absolute w-full h-4/5 z-30 bottom-0 bg-white p-10 translate-y-full"
      >
        <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
      </div>
    </div>
  );
};

export default CaptainRiding;
