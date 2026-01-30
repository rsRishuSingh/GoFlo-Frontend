import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import LiveRouteTracking from "../components/LiveRouteTracking";

const UserRiding = () => {
  const [payMessage, setPayMessage] = useState("Pay via Coupon");
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

  // We use a function inside useState to load from localStorage BEFORE the first render.
  // This prevents the component from being "null" for a split second on refresh.
  const [ride, setRide] = useState(() => {
    if (location.state?.ride) {
      localStorage.setItem("currentRide", JSON.stringify(location.state.ride));
      return location.state.ride;
    } else {
      const savedRide = localStorage.getItem("currentRide");
      return savedRide ? JSON.parse(savedRide) : null;
    }
  });

  // 2. FORCE SOCKET JOIN ON REFRESH
  useEffect(() => {
    if (ride && socket) {
      // Immediately tell the server we are part of this ride
      socket.emit("join-ride", { rideId: ride._id });
    }
  }, [ride, socket]);

  // 3. LISTEN FOR RIDE END
  useEffect(() => {
    if (socket) {
      socket.on("ride-ended", () => {
        localStorage.removeItem("currentRide");
        navigate("/user-home");
      });
    }
    return () => {
      if (socket) socket.off("ride-ended");
    };
  }, [socket, navigate]);

  // If data is still missing, redirect to home
  if (!ride) {
    navigate('/user-home');
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  const destinationCoords = {
    lat: ride?.destination?.ltd || 28.6139,
    lng: ride?.destination?.lng || 77.209,
  };

  return (
    <div className="h-screen">
      <Link
        to="/user-home"
        className="fixed right-2 top-2 h-10 w-10 bg-white flex items-center justify-center rounded-full shadow-md z-10"
      >
        <i className="text-lg font-medium ri-home-5-line"></i>
      </Link>

      <div className="h-1/2">
        <LiveRouteTracking
          destination={destinationCoords}
          isCaptain={false}
          rideId={ride._id}
        />
      </div>

      <div className="h-1/2 p-4">
        <div className="flex items-center justify-between">
          <img
            className="h-12"
            src="https://swyft.pl/wp-content/uploads/2023/05/how-many-people-can-a-uberx-take.jpg"
            alt=""
          />
          <div className="text-right">
            <h2 className="text-lg font-medium capitalize">
              {ride.captain.fullname.firstname}
            </h2>
            <h4 className="text-xl font-semibold -mt-1 -mb-1">
              {ride.captain.vehicleDetails.vehicleNumber}
            </h4>
            <p className="text-sm text-gray-600 capitalize">
              {ride.captain.vehicleDetails.color}{" "}
              {ride.captain.vehicleDetails.vehicleType}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-between flex-col items-center">
          <div className="w-full mt-5">
            <div className="flex items-center gap-5 p-3 border-b-2">
              <i className="text-lg ri-map-pin-2-fill"></i>
              <div>
                <h3 className="text-lg font-medium">Destination</h3>
                <p className="text-sm -mt-1 text-gray-600">
                  {ride.destination.location_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-5 p-3">
              <i className="ri-currency-line"></i>
              <div>
                <h3 className="text-lg font-medium">₹{ride.fare} </h3>
                <p className="text-sm -mt-1 text-gray-600">Cash</p>
              </div>
            </div>
          </div>
        </div>
        <button
          className="w-full mt-5 bg-green-600 text-white font-semibold p-2 rounded-lg"
          onClick={() => setPayMessage("Paid via Coupon")}
        >
          {payMessage}
        </button>
      </div>
    </div>
  );
};

export default UserRiding;
