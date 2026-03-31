import React, { useContext } from "react";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainDetails = () => {
  const { captain } = useContext(CaptainDataContext);

  // 1. Map vehicle types to your public folder image paths
  const vehicleImages = {
    car: "/olaCar.png",
    ambulance: "/olaAmbulance.png",
    auto: "/olaAuto.png",
  };

  const vehicleType = captain.vehicleDetails?.vehicleType || "car";
  const vehicleImageSrc = vehicleImages[vehicleType] || vehicleImages["car"];

  return (
    <div className="h-full flex flex-col justify-start gap-5">
     
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start gap-3">
          <img
            className="h-16 w-16 rounded-full object-cover border-4 border-gray-100 shadow-sm"
            src="/rider.jpg"
            alt="driver"
          />

          <div>
            <h4 className="text-xl font-bold capitalize text-gray-800">
              {captain.fullname.firstname + " " + captain.fullname.lastname}
            </h4>
            <div className="flex items-center gap-1 mt-0.5">
              <i className="ri-star-fill text-yellow-500 text-sm"></i>
              <span className="text-xs text-gray-500 font-semibold">
                4.9 Rating
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <h4 className="text-2xl font-bold text-green-700">₹295.20</h4>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            Earned Today
          </p>
        </div>
      </div>

      <div className="flex p-4 bg-gray-50 rounded-2xl justify-between gap-2 items-center shadow-sm border border-gray-100">
        <div className="text-center w-1/3 ">
          <i className="text-2xl mb-1 font-light ri-timer-2-line text-green-500"></i>
          <h5 className="text-lg font-bold text-gray-900">10.2</h5>
          <p className="text-xs text-gray-500 font-medium">Hours Online</p>
        </div>

        <div className="h-10 w-px bg-gray-200"></div>

        <div className="text-center w-1/3">
          <i className=" text-2xl mb-1 ri-route-fill text-red-500"></i>
          <h5 className="text-lg font-bold text-gray-900">30 KM</h5>
          <p className="text-xs text-gray-500 font-medium">Total Distance</p>
        </div>

        <div className="h-10 w-px bg-gray-200"></div>

        <div className="text-center w-1/3">
          <i className="text-2xl mb-1 font-light ri-booklet-line text-yellow-500"></i>
          <h5 className="text-lg font-bold text-gray-900">20</h5>
          <p className="text-xs text-gray-500 font-medium">Total Jobs</p>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
          Vehicle Details
        </h4>
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white rounded-full flex items-center justify-center border border-gray-200 overflow-hidden">
              <img
                src={vehicleImageSrc}
                alt="vehicle"
                className="h-full w-full object-contain p-1" // Added padding so image fits nicely
              />
            </div>
            <div>
              <h5 className="text-sm font-bold text-gray-800 capitalize">
                {captain.vehicleDetails?.vehicleType || "Vehicle"}
              </h5>
              <p className="text-xs text-gray-500 capitalize">
                {captain.vehicleDetails?.color || "White"} -{" "}
                {captain.vehicleDetails?.capacity || "4"} Seater
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <h5 className="text-lg font-mono font-bold text-gray-800">
              {captain.vehicleDetails?.vehicleNumber || "KA15XX"}
            </h5>
            <p className="text-[10px] text-gray-400 uppercase">Plate Number</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaptainDetails;
