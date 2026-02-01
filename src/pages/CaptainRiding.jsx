import React, { useState, useEffect, useContext, useRef } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
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
          navigate("/captain-home");
          alert("User cancelled the ride.");
        }
      } catch (err) {
        console.error("Polling error", err);
      }
    };

    const interval = setInterval(checkStatus, 5000);
    socket.on("ride-cancelled", () => {
      navigate("/captain-home");
    });

    return () => {
      clearInterval(interval);
      socket.off("ride-cancelled");
    };
  }, [rideData, navigate, socket]);

  useGSAP(() => {
    if (finishRidePanel) {
      gsap.to(finishRidePanelRef.current, {
        y: 0,
        duration: 0.5,
        ease: "power4.out",
      });
    } else {
      gsap.to(finishRidePanelRef.current, {
        y: "100%",
        duration: 0.5,
        ease: "power4.in",
      });
    }
  }, [finishRidePanel]);

  if (!rideData) return <div className="p-10">No active ride found...</div>;

  return (
    <div className="h-screen relative overflow-hidden bg-gray-100">
      <img
        className="w-28 absolute left-5 top-5 z-10  bg-white rounded-4xl  shadow-md my-2"
        src="/logo.png"
        alt="Ola Logo"
      />

      <div className="h-[60%] relative z-0">
        <LiveRouteTracking
          destination={{
            lat: rideData.destination.ltd,
            lng: rideData.destination.lng,
          }}
          isCaptain={true}
        />
      </div>

      <div className="h-[40%] p-6 bg-white rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] relative z-10 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2 pb-1">
          <h4 className="text-xl font-bold text-gray-800">
            {rideData.distance ? (rideData.distance / 1000).toFixed(1) : "2.2"}{" "}
            km to destination
          </h4>
          <div className="bg-green-50 border border-green-100 px-3 py-1 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-green-700">On Trip</span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-b border-gray-100 pb-2 mb-2">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-100">
            <img
              src="/rider.jpg"
              alt="User"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold capitalize text-gray-900">
              {rideData.user.fullname.firstname}
            </h2>
            <p className="text-sm font-semibold text-gray-500">
              {rideData.paymentMethod === "cash"
                ? "Cash Payment"
                : "Online Payment"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex gap-4 items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 bg-red-600 rounded-sm shadow-sm"></div>
            </div>
            <div className="overflow-hidden">
              <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Drop Off
              </h5>
              <h4 className="text-sm font-bold text-gray-900">
                {rideData.destination.location_name}
              </h4>
            </div>
          </div>

          <button
            className="w-full bg-[#9aec00] text-gray-900 font-bold text-lg p-3.5 rounded-xl shadow-md hover:bg-[#8ad300] transition active:scale-[0.98]"
            onClick={(e) => {
              e.stopPropagation();
              setFinishRidePanel(true);
            }}
          >
            Complete Ride
          </button>
        </div>
      </div>

      <div
        ref={finishRidePanelRef}
        className="absolute w-full z-50 bottom-0 translate-y-full bg-white px-3 py-3 rounded-t-3xl shadow-2xl"
      >
        <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
      </div>
    </div>
  );
};

export default CaptainRiding;
