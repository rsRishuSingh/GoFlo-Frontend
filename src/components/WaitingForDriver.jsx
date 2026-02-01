import React from "react";

const WaitingForDriver = (props) => {
  const vehicleImages = {
    car: "/olaCar.png",
    moto: "/olaBike.png",
    auto: "/olaAuto.png",
  };

  const vehicleType = props.ride?.captain?.vehicleDetails?.vehicleType || "car";
  const vehicleImageSrc = vehicleImages[vehicleType] || vehicleImages["car"];

  return (
    <div >
      <h5 className=" text-center w-[93%] absolute top-0">
        <i className="text-5xl text-gray-400 ri-separator"></i>
      </h5>

      <div className="flex items-center justify-between mt-2 mb-2 px-2">
        <h3 className="text-xl font-semibold text-gray-900">
          Driver is arriving
        </h3>
        <div className="bg-black text-white px-3 py-1 rounded-md shadow-sm">
          <span className="text-xs font-normal text-gray-300 mr-1">OTP</span>
          <span className="text-lg font-bold font-mono">
            {props.ride?.otp || "----"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 shadow-sm border border-gray-100">
        <div className="flex flex-col items-center gap-1 w-1/3 border-r border-gray-200 pr-2">
          <img
            className="h-12 object-contain mix-blend-multiply"
            src={vehicleImageSrc}
            alt="vehicle"
          />
          <p className="text-xs text-gray-500 capitalize">{vehicleType}</p>
        </div>
        <div className="flex flex-col items-center w-1/3 px-2">
          <h4 className="text-lg font-bold text-gray-900">
            {props.ride?.captain?.vehicleDetails?.vehicleNumber || "KA15XX"}
          </h4>
          <p className="text-xs text-gray-500">Vehicle Number</p>
        </div>

        <div className="flex flex-col items-center w-1/3 border-l border-gray-200 pl-2">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 mb-1">
            <img
              src="/rider.jpg"
              alt="driver"
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xs font-bold capitalize text-gray-800 truncate max-w-20">
            {props.ride?.captain?.fullname?.firstname || "Driver"}
          </h2>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-2 mt-4">
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 mt-1">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
            <div className="w-0.5 h-8 bg-gray-200"></div>
            <div className="w-2 h-2 bg-red-600 rounded-full"></div>
          </div>
          <div className="flex flex-col gap-3 w-full">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {props.ride?.origin?.location_name}
              </h3>
              <p className="text-xs text-gray-500">Pickup Location</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {props.ride?.destination?.location_name}
              </h3>
              <p className="text-xs text-gray-500">Destination</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 px-2">
        <div>
          <p className="text-gray-500 text-xs">Total Fare</p>
          <h2 className="text-xl font-bold text-green-700">
            ₹{props.ride?.fare}
          </h2>
        </div>

        {/* 2. Added Dedicated Cancel Button */}
        <button
          onClick={props.cancelRide}
          className="bg-red-100 text-red-700 font-semibold px-4 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors"
        >
          Cancel Ride
        </button>
      </div>
    </div>
  );
};

export default WaitingForDriver;
