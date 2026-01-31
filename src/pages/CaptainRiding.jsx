import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom"; // Added useNavigate
import FinishRide from "../components/FinishRide";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import LiveRouteTracking from "../components/LiveRouteTracking";
import { SocketContext } from "../context/SocketContext";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainRiding = () => {
  const [finishRidePanel, setFinishRidePanel] = useState(false);
  const finishRidePanelRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate(); // Hook to redirect if needed
  const { socket } = useContext(SocketContext);
  const { captain } = useContext(CaptainDataContext);

  // 1. LAZY INITIALIZATION (The Fix)
  // This ensures 'rideData' is loaded from storage immediately on refresh
  const [rideData, setRideData] = useState(() => {
    if (location.state?.ride) {
      // If fresh navigation, save to storage
      localStorage.setItem(
        "captainCurrentRide",
        JSON.stringify(location.state.ride),
      );
      return location.state.ride;
    } else {
      // If refresh, load from storage
      const savedRide = localStorage.getItem("captainCurrentRide");
      return savedRide ? JSON.parse(savedRide) : null;
    }
  });

  // 2. LOCATION EMITTER
  useEffect(() => {
    if (!captain || !rideData) return;

    const updateLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
          socket.emit("update-location-captain", {
            userId: captain._id,
            location: {
              ltd: position.coords.latitude,
              lng: position.coords.longitude,
            },
            // This will now persist correctly after refresh
            activeRideId: rideData._id,
          });
        });
      }
    };

    const interval = setInterval(updateLocation, 4000);
    updateLocation();

    return () => clearInterval(interval);
  }, [captain, socket, rideData]);

  // 3. ANIMATIONS
  useGSAP(
    function () {
      if (finishRidePanel) {
        gsap.to(finishRidePanelRef.current, {
          transform: "translateY(0)",
        });
      } else {
        gsap.to(finishRidePanelRef.current, {
          transform: "translateY(100%)",
        });
      }
    },
    [finishRidePanel],
  );

  // Safety Loading State
  if (!rideData) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading Ride...
      </div>
    );
  }

  const destinationCoords = {
    lat: rideData?.destination?.ltd || 28.6139,
    lng: rideData?.destination?.lng || 77.209,
  };

  return (
    <div className="h-screen relative w-full overflow-hidden">
      <div className="absolute p-6 top-0 flex items-center justify-between w-full z-10">
        <img
          className="w-16"
          src="https://upload.wikimedia.org/wikipedia/commons/c/cc/Uber_logo_2018.png"
          alt=""
        />
        <button className="absolute right-2 top-2 h-10 w-10 bg-white p-2 flex items-center justify-center rounded-full shadow-md z-10">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="rgba(255,0,0,1)"
          >
            <path d="M22 17.0022C21.999 19.8731 19.9816 22.2726 17.2872 22.8616L16.6492 20.9476C17.8532 20.7511 18.8765 20.0171 19.4649 19H17C15.8954 19 15 18.1046 15 17V13C15 11.8954 15.8954 11 17 11H19.9381C19.446 7.05369 16.0796 4 12 4C7.92038 4 4.55399 7.05369 4.06189 11H7C8.10457 11 9 11.8954 9 13V17C9 18.1046 8.10457 19 7 19H4C2.89543 19 2 18.1046 2 17V12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V12.9987V13V17V17.0013V17.0022Z"></path>
          </svg>
        </button>
      </div>

      <div className="h-4/5 w-full relative z-0">
        <LiveRouteTracking
          destination={destinationCoords}
          isCaptain={true}
          rideId={rideData._id} // Pass this so LiveRouteTracking knows the ID
        />
      </div>

      <div
        className="h-1/5 w-full p-6 flex items-center justify-between relative bg-yellow-400 pt-10 shadow-lg z-10"
        onClick={() => {
          setFinishRidePanel(true);
        }}
      >
        <h5
          className="p-1 text-center w-[90%] absolute top-0"
          onClick={() => {}}
        >
          <i className="text-3xl text-gray-800 ri-arrow-up-wide-line"></i>
        </h5>
        <h4 className="text-xl font-semibold">4 KM away</h4>
        <button className="bg-green-600 text-white font-semibold p-3 px-10 rounded-lg">
          Complete Ride
        </button>
      </div>

      <div
        ref={finishRidePanelRef}
        className="absolute w-full h-4/5 z-30 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 rounded-t-3xl"
      >
        <FinishRide ride={rideData} setFinishRidePanel={setFinishRidePanel} />
      </div>
    </div>
  );
};

export default CaptainRiding;
