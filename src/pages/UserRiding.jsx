import React, { useRef, useState, useEffect, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import LiveRouteTracking from "../components/LiveRouteTracking";
import axios from "axios";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

const UserRiding = () => {
  const [isPaymentPanelOpen, setIsPaymentPanelOpen] = useState(false);
  const paymentPanelRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  // Vehicle Images Map
  const vehicleImages = {
    car: "/olaCar.png",
    moto: "/olaBike.png",
    auto: "/olaAuto.png",
  };

  // 1. Load Initial Ride Data
  const [ride, setRide] = useState(() => {
    if (location.state?.ride) {
      localStorage.setItem("currentRide", JSON.stringify(location.state.ride));
      return location.state.ride;
    } else {
      const savedRide = localStorage.getItem("currentRide");
      return savedRide ? JSON.parse(savedRide) : null;
    }
  });

  // Get Vehicle Image safely
  const vehicleType = ride?.captain?.vehicleDetails?.vehicleType || "car";
  const vehicleImageSrc = vehicleImages[vehicleType] || vehicleImages["car"];

  // 2. POLLING MECHANISM
  useEffect(() => {
    if (!ride?._id) return;

    const fetchRideUpdate = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/users/${ride._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          },
        );

        const updatedRide = response.data;

        if (updatedRide.status === "cancelled") {
          localStorage.removeItem("currentRide");
          navigate("/user-home");
          return;
        }

        setRide(updatedRide);

        if (updatedRide.status === "completed") {
          localStorage.removeItem("currentRide");
          navigate("/user-home"); // Or to a rating screen
        }
      } catch (error) {
        console.error("Error fetching ride update:", error);
      }
    };

    const intervalId = setInterval(fetchRideUpdate, 4000);
    fetchRideUpdate();

    return () => clearInterval(intervalId);
  }, [ride?._id, navigate]);

  // 3. Socket Backup
  useEffect(() => {
    if (socket && ride?._id) {
      socket.emit("join-ride", { rideId: ride._id });
    }
  }, [socket, ride]);

  // CANCEL RIDE FUNCTION
  const cancelRide = async () => {
    if (!window.confirm("Are you sure you want to cancel this active ride?"))
      return;

    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel`,
        { rideId: ride._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("userToken")}`,
          },
        },
      );
      localStorage.removeItem("currentRide");
      navigate("/user-home");
    } catch (error) {
      console.error("Error cancelling ride:", error);
      alert("Could not cancel ride");
    }
  };

  // GSAP Animation for Payment Panel
  useGSAP(() => {
    if (isPaymentPanelOpen) {
      gsap.to(paymentPanelRef.current, {
        y: "0%",
        duration: 0.5,
        ease: "power4.out", // Smoother easing
      });
    } else {
      gsap.to(paymentPanelRef.current, {
        y: "100%",
        duration: 0.5,
        ease: "power4.in",
      });
    }
  }, [isPaymentPanelOpen]);

  if (!ride) {
    navigate("/user-home");
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 4. Extract Location Logic
  const captainLocation = ride.captain?.location?.coordinates
    ? {
        lat: ride.captain.location.coordinates[1],
        lng: ride.captain.location.coordinates[0],
      }
    : null;

  const destinationCoords = {
    lat: ride?.destination?.ltd || 28.6139,
    lng: ride?.destination?.lng || 77.209,
  };

  return (
    <div className="h-screen relative overflow-hidden">
      <img
        className="w-24 absolute left-5 top-5 z-10  bg-white rounded-4xl p-2 shadow-md my-2"
        src="https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1280px-Ola_Cabs_logo.svg.png"
        alt="Ola Logo"
      />

      <div className="h-[60%]">
        <LiveRouteTracking
          destination={destinationCoords}
          isCaptain={false}
          rideId={ride._id}
          captainLocation={captainLocation}
        />
      </div>

      <div className="h-[40%] py-4 px-2 bg-white relative z-10 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.1)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center relative overflow-hidden border border-gray-200">
              <img
                className="h-full object-cover w-full"
                src={vehicleImageSrc}
                alt="vehicle"
              />
            </div>
            <div>
              <h2 className="text-lg font-bold capitalize text-gray-800">
                {ride.captain.fullname.firstname}
              </h2>
              <h4 className="text-xl font-bold text-gray-900 tracking-wide">
                {ride.captain.vehicleDetails.vehicleNumber}
              </h4>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs text-gray-500 font-medium uppercase mb-1">
              OTP
            </p>
            <div className="bg-black text-white px-3 py-1 rounded font-mono font-bold text-lg shadow-sm">
              {ride.otp}
            </div>
          </div>
        </div>

        <div className="w-full bg-green-50 border border-green-100 p-2 rounded-lg flex items-center gap-1 mb-1">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mx-2"></div>
          <p className="text-xs font-semibold text-green-800">
            Ride in Progress - Sharing Live Location
          </p>
        </div>

        <div className="w-full bg-yellow-50 border border-green-100 p-2 rounded-lg flex items-center gap-1 mb-1 justify-start">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mx-2"></div>
          <div>
            <div className="text-xs font-semibold text-yellow-800">
              Est. Time: {ride?.duration ? (ride.duration / 60).toFixed(0) : 0}{" "}
              mins
            </div>
            <div className="text-xs font-semibold text-yellow-800">
              Distance: {ride?.distance ? (ride.distance / 1000).toFixed(1) : 0}{" "}
              km
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 border-t border-gray-100 pt-2 pb-4">
          <div className="flex-1">
            <p className="text-xs text-gray-400 font-medium pb-1">
              DESTINATION
            </p>
            <h3 className="text-sm font-semibold text-gray-800 ">
              {ride.destination.location_name}
            </h3>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400 font-medium">FARE</p>
            <h3 className="text-xl font-bold text-gray-900">₹{ride.fare}</h3>
          </div>
        </div>

        <div className="flex gap-1 mt-1">
          <button
            className="flex-1 bg-[#9aec00] hover:bg-[#8ad300] text-gray-900 font-bold p-3 rounded-xl shadow-sm transition active:scale-[0.98]"
            onClick={() => setIsPaymentPanelOpen(true)}
          >
            Make Payment
          </button>
          <button
            className="w-12 bg-red-50 text-red-600 font-bold rounded-xl flex items-center justify-center border border-red-100 hover:bg-red-100 transition"
            onClick={cancelRide}
            title="Cancel Ride"
          >
            <i className="ri-close-circle-line text-2xl"></i>
          </button>
        </div>
      </div>

      <div
        ref={paymentPanelRef}
        className="absolute w-full z-20 bottom-0 translate-y-full bg-white px-3 py-10 pt-12 rounded-t-3xl shadow-2xl h-[35%]"
      >
        {/* Close Handle */}
        <h5
          className="p-1 text-center w-[93%] absolute top-0 cursor-pointer opacity-50"
          onClick={() => setIsPaymentPanelOpen(false)}
        >
          <i className="ri-arrow-down-wide-line text-3xl"></i>
        </h5>

        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Select Payment Method
        </h3>

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100">
            <i className="ri-money-dollar-circle-fill text-2xl text-green-600"></i>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Cash</h4>
              <p className="text-xs text-gray-500">
                Pay directly to the captain
              </p>
            </div>
            <h4 className="font-bold">₹{ride.fare}</h4>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-100 opacity-60">
            <i className="ri-bank-card-fill text-2xl text-blue-600"></i>
            <div className="flex-1">
              <h4 className="font-bold text-gray-800">Online (Coming Soon)</h4>
              <p className="text-xs text-gray-500">UPI, Cards, Netbanking</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setIsPaymentPanelOpen(false)}
          className="flex-1 bg-[#9aec00] hover:bg-[#8ad300] text-gray-900 font-bold p-3 rounded-xl shadow-sm transition active:scale-[0.98] w-full mt-5"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UserRiding;
