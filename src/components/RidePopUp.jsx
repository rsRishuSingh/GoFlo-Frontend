import React, { useState, useEffect } from "react";

const RidePopUp = (props) => {
  const isEmergency = props.ride?.isEmergency;
  const [timeLeft, setTimeLeft] = useState(30); // Initial time 10s

  // Timer Logic
  useEffect(() => {
    if (!props.ride) return;

    setTimeLeft(30);

    const timerId = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          // Time is up!
          clearInterval(timerId);
          props.setRidePopupPanel(false); // Close Panel
          props.setRide(null); // Clear Ride Data
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Cleanup interval on unmount or when ride changes
    return () => clearInterval(timerId);
  }, [props.ride]);

  return (
    <div>
      {/* Drag Handle */}
      <div
        className="absolute top-0 w-full flex justify-center py-2 cursor-pointer"
        onClick={() => {
          props.setRidePopupPanel(false);
        }}
      >
        <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
      </div>

      {/* Header */}
      <div className="mt-6 flex items-center justify-between border-b border-gray-100 pb-2">
        <div className="flex flex-col">
          <h3
            className={`text-2xl font-bold ${
              isEmergency ? "text-red-600 animate-pulse" : "text-gray-900"
            }`}
          >
            {isEmergency ? (
              <span className="flex items-center gap-2">
                <i className="ri-alarm-warning-fill"></i> EMERGENCY
              </span>
            ) : (
              "New Ride!"
            )}
          </h3>
          <span className="text-xs text-gray-400 font-semibold mt-1">
            {props.ride?.distance ? (props.ride.distance / 1000).toFixed(1) : 0}{" "}
            km away
          </span>
        </div>

        {/* TIMER UI */}
        <div className="flex flex-col items-end">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 flex items-center justify-center bg-white shadow-sm relative overflow-hidden">
            <span
              className={`text-lg font-bold ${timeLeft <= 3 ? "text-red-600" : "text-gray-800"}`}
            >
              {timeLeft}
            </span>
            {/* Optional visual progress ring effect could go here */}
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            Auto reject
          </p>
        </div>
      </div>

      {/* User & Fare Details */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl mt-3 shadow-sm border ${
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
              {props.ride?.user?.fullname.firstname +
                " " +
                props.ride?.user?.fullname.lastname}
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
          <span className="text-xs text-gray-500">Est. Earnings</span>
        </div>
      </div>

      {/* Ride Route Trace */}
      <div className="flex flex-col gap-y-2 mt-4 px-2">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 mt-1 relative">
            <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow-sm z-10"></div>
            <div className="absolute top-3 w-0.5 h-16 bg-gray-300 border-l border-dashed border-gray-400"></div>
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
            <div className="w-3 h-3 bg-red-600 rounded-sm border-2 border-white shadow-sm z-10"></div>
          </div>
          <div className="w-full">
            <h3 className="text-lg font-semibold text-gray-900">Destination</h3>
            <p className="text-sm text-gray-500 leading-snug">
              {props.ride?.destination?.location_name}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Est. Time:{" "}
              {props.ride?.duration ? (props.ride.duration / 60).toFixed(0) : 0}{" "}
              mins
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 w-full flex items-center justify-between gap-4">
        <button
          onClick={() => {
            props.setRidePopupPanel(false);
          }}
          className="flex-1 bg-gray-100 text-gray-700 font-bold p-3.5 rounded-xl shadow-sm hover:bg-gray-200 transition-colors border border-gray-200"
        >
          Ignore
        </button>

        <button
          onClick={() => {
            props.confirmRide();
          }}
          className={`flex-1 font-bold p-3.5 rounded-xl shadow-md transition-colors ${
            isEmergency
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-[#9aec00] text-gray-950 hover:bg-[#7ec200]"
          }`}
        >
          {isEmergency ? "Accept Emergency" : "Accept Ride"}
        </button>
      </div>
    </div>
  );
};

export default RidePopUp;
