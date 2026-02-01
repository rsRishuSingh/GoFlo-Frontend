import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ConfirmRidePopUp = (props) => {
  const [otp, setOtp] = useState("");
  const navigate = useNavigate();
  const isEmergency = props.ride?.isEmergency;

  const submitHander = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/start-ride`,
        {
          rideId: props.ride._id,
          otp: otp,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
          },
        },
      );

      if (response.status === 200) {
        props.setConfirmRidePopupPanel(false);
        props.setRidePopupPanel(false);
        navigate("/captain-riding", { state: { ride: response.data } });
      }
    } catch (error) {
      console.error("Error starting ride:", error);
      alert(
        error.response?.data?.message || "Invalid OTP or error starting ride.",
      );
    }
  };

  const cancelRide = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/rides/cancel-ride`,
        { rideId: props.ride._id },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("captainToken")}`,
          },
        },
      );

      if (response.status === 200) {
        props.setConfirmRidePopupPanel(false);
        props.setRidePopupPanel(false);
      }
    } catch (error) {
      console.error("Error cancelling ride:", error);
      alert("Could not cancel the ride.");
    }
  };

  return (
    <div className="h-full relative">
      <div className="mt-4 flex items-center justify-between border-b border-gray-100 pb-3">
        <h3
          className={`text-2xl font-bold ${
            isEmergency ? "text-red-600 animate-pulse" : "text-gray-900"
          }`}
        >
          {isEmergency ? (
            <span className="flex items-center gap-2">
              <i className="ri-alarm-warning-fill"></i> EMERGENCY HERE
            </span>
          ) : (
            "Confirm to Start"
          )}
        </h3>
        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold shadow-sm">
          {props.ride?.distance ? (props.ride.distance / 1000).toFixed(1) : 0}{" "}
          km
        </span>
      </div>

      {/* Ride/User Info Card */}
      <div
        className={`flex items-center justify-between p-4 rounded-xl mt-4 shadow-sm border ${
          isEmergency
            ? "bg-red-50 border-red-200"
            : "bg-[#e2e2e2] border-gray-200"
        }`}
      >
        <div className="flex items-center gap-4">
          <img
            className="h-14 w-14 rounded-full object-cover border-2 border-white shadow-md"
            src="/rider.jpg"
            alt="User Avatar"
          />
          <div>
            <h2 className="text-lg font-bold capitalize text-gray-900">
              {props.ride?.user?.fullname.firstname}
            </h2>
            <p
              className={`text-sm font-semibold ${
                isEmergency ? "text-red-600" : "text-gray-500"
              }`}
            >
              {props.ride?.paymentMethod === "cash" ? "Cash Payment" : "Online"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <h5 className="text-xl font-bold text-gray-900">
            ₹{props.ride?.fare}
          </h5>
          <span className="text-xs text-gray-500">Earnings</span>
        </div>
      </div>

      {/* Ride Trace (Pickup -> Dest) */}
      <div className="flex flex-col gap-y-4 mt-6 px-2">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 mt-1 relative">
            <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow-sm"></div>
            <div className="absolute top-4 w-0.5 h-18 bg-gray-300 border-l border-dashed border-gray-500"></div>{" "}
          </div>
          <div className="w-full border-b border-gray-100 pb-3">
            <h3 className="text-lg font-semibold text-gray-900">Pickup</h3>
            <p className="text-sm text-gray-500 leading-snug">
              {props.ride?.origin?.location_name}
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
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

      {/* OTP Form & Actions */}
      <div className="mt-6 w-full">
        <form onSubmit={submitHander}>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            type="text"
            className="bg-gray-100 px-6 py-4 font-mono text-lg rounded-xl w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-400"
            placeholder="Enter 4-digit OTP"
            maxLength="4"
          />

          <div className="flex flex-col gap-3 mt-4">
            <button
              className={`w-full text-lg flex justify-center  font-bold p-3.5 rounded-xl shadow-md transition-colors ${
                isEmergency
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[#9aec00] text-gray-950 hover:bg-[#7ec200]"
              }`}
            >
              Start Ride
            </button>

            <button
              onClick={cancelRide}
              className="w-full bg-white border-2 border-red-500 text-lg text-red-500 font-bold p-3.5 rounded-xl hover:bg-red-50 transition-colors"
            >
              Cancel Ride
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfirmRidePopUp;
