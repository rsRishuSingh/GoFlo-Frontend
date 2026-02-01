import React from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FinishRide = (props) => {
  const navigate = useNavigate();

  async function endRide() {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/end-ride`,
        {
          rideId: props.ride._id,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
          },
        },
      );

      if (response.status === 200) {
        navigate("/captain-home");
      }
    } catch (error) {
      console.error("Error ending ride:", error);
    }
  }

  return (
    <div className="h-full relative">
      <div
        className=" w-full flex justify-center  cursor-pointer"
        onClick={() => {
          props.setFinishRidePanel(false);
        }}
      >
        <i className="text-3xl text-gray-300 ri-arrow-down-wide-line"></i>
      </div>

      <div className="mt-1 flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-2xl font-bold text-gray-900">Finish Ride</h3>
        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
          Running
        </span>
      </div>

      {/* User Info Card */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-100 rounded-xl mt-2 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md">
            <img
              className="w-full h-full object-cover"
              src="/rider.jpg"
              alt="User Avatar"
            />
          </div>
          <div>
            <h2 className="text-lg font-bold capitalize text-gray-900">
              {props.ride?.user?.fullname?.firstname}
            </h2>
            <p className="text-sm font-semibold text-gray-500">
              {props.ride?.distance
                ? (props.ride.distance / 1000).toFixed(1)
                : "0"}{" "}
              km trip
            </p>
          </div>
        </div>
        <div className="text-right">
          <h5 className="text-xl font-bold text-gray-900">
            ₹{props.ride?.fare}
          </h5>
          <span className="text-xs text-gray-500">Cash</span>
        </div>
      </div>

      {/* Ride Trace */}
      <div className="flex flex-col gap-y-2 mt-2 px-2">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 mt-1 relative">
            <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow-sm"></div>
            <div className="absolute top-4 w-0.5 h-16 bg-gray-300 border-l border-dashed border-gray-500"></div>{" "}
          </div>
          <div className="w-full border-b border-gray-100 pb-3">
            <h3 className="text-lg font-semibold text-gray-900">Pickup</h3>
            <p className="text-sm text-gray-500 leading-snug">
              {props.ride?.origin?.location_name}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-y-2 gap-x-4">
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="w-3 h-3 bg-red-600 rounded-sm border-2 border-white shadow-sm"></div>
          </div>
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-900">Destination</h3>
            <p className="text-sm text-gray-500 leading-snug">
              {props.ride?.destination?.location_name}
            </p>
          </div>
        </div>
      </div>

      {/* Complete Button */}
      <div className="mt-5 w-full">
        <button
          onClick={endRide}
          className="w-full text-lg flex justify-center bg-[#9aec00] text-gray-900 font-bold p-4 rounded-xl shadow-md hover:bg-[#8ad300] transition active:scale-[0.98]"
        >
          Complete Ride
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          Clicking this will end the trip and process payment.
        </p>
      </div>
    </div>
  );
};

export default FinishRide;
