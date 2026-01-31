import React, { useRef, useState, useEffect, useContext } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { SocketContext } from "../context/SocketContext";
import LiveRouteTracking from "../components/LiveRouteTracking";
import axios from "axios"; // Ensure axios is imported

const UserRiding = () => {
  const [payMessage, setPayMessage] = useState("Pay via Coupon");
  const location = useLocation();
  const navigate = useNavigate();
  const { socket } = useContext(SocketContext);

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

  // 2. ROBUST POLLING MECHANISM (The Alternative Fix)
  // Instead of relying on sockets (which break on refresh), we fetch the
  // latest ride data from the DB every 4 seconds.
  useEffect(() => {
    if (!ride?._id) return;

    const fetchRideUpdate = async () => {
      try {
        // This endpoint returns the ride AND the captain's latest location (via populate)
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/rides/${ride._id}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("userToken")}`,
            },
          },
        );

        const updatedRide = response.data;
        setRide(updatedRide); // Update state with new location/status

        // Check if ride is finished
        if (updatedRide.status === "completed") {
          localStorage.removeItem("currentRide");
          navigate("/user-home");
        }
      } catch (error) {
        console.error("Error fetching ride update:", error);
      }
    };

    // Poll every 4 seconds
    const intervalId = setInterval(fetchRideUpdate, 4000);

    // Initial fetch to sync immediately on load
    fetchRideUpdate();

    return () => clearInterval(intervalId);
  }, [ride?._id, navigate]);

  // 3. Keep Socket for "Events" (Optional Backup)
  // We still emit join-ride just in case, but we don't depend on it for location anymore.
  useEffect(() => {
    if (socket && ride?._id) {
      socket.emit("join-ride", { rideId: ride._id });
    }
  }, [socket, ride]);

  if (!ride) {
    navigate("/user-home");
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  // 4. Extract Location Logic
  // The polling updates 'ride', which contains 'captain.location'.
  // We pass this live location to the map component.

  // NOTE: Ensure your captain model has location.coordinates format correct
  const captainLocation = ride.captain?.location?.coordinates
    ? {
        lat: ride.captain.location.coordinates[1],
        lng: ride.captain.location.coordinates[0],
      }
    : null; // Fallback if location missing

  const destinationCoords = {
    lat: ride?.destination?.ltd || 28.6139,
    lng: ride?.destination?.lng || 77.209,
  };

  return (
    <div className="h-screen relative">
      <button className="absolute right-2 top-2 h-10 w-10 bg-white p-2 flex items-center justify-center rounded-full shadow-md z-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="rgba(255,0,0,1)"
        >
          <path d="M22 17.0022C21.999 19.8731 19.9816 22.2726 17.2872 22.8616L16.6492 20.9476C17.8532 20.7511 18.8765 20.0171 19.4649 19H17C15.8954 19 15 18.1046 15 17V13C15 11.8954 15.8954 11 17 11H19.9381C19.446 7.05369 16.0796 4 12 4C7.92038 4 4.55399 7.05369 4.06189 11H7C8.10457 11 9 11.8954 9 13V17C9 18.1046 8.10457 19 7 19H4C2.89543 19 2 18.1046 2 17V12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12V12.9987V13V17V17.0013V17.0022Z"></path>
        </svg>
      </button>

      <div className="h-1/2">
        <LiveRouteTracking
          destination={destinationCoords}
          isCaptain={false}
          rideId={ride._id}
          // Pass the polled location directly to the map
          captainLocation={captainLocation}
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
