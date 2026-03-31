import React from "react";

const LookingForDriver = (props) => {
  const vehicleImages = {
    car: "/olaCar.png",
    ambulance: "/olaAmbulance.png",
    auto: "/olaAuto.png",
  };

  return (
    <div>
      <h5 className=" text-center w-[93%] absolute top-0">
        <i className="text-5xl text-gray-400 ri-separator"></i>
      </h5>
      <div className="flex items-center justify-between my-3 px-2">
        <h3 className="text-2xl font-semibold ">Looking for a Driver </h3>
        <div className="flex gap-1 mx-1 mt-2">
          <span className="h-2.5 w-2.5 bg-[#9aec00] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="h-2.5 w-2.5 bg-[#9aec00] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="h-2.5 w-2.5 bg-[#9aec00] rounded-full animate-bounce"></span>
        </div>
      </div>

      <div className="flex gap-2 justify-between flex-col items-center">
        <img
          className="w-36 mix-blend-multiply"
          src={vehicleImages[props.vehicleType] || vehicleImages["car"]}
          alt="Vehicle"
        />

        <div className="flex flex-col gap-y-2 mt-4 px-2">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1 mt-1 relative">
              <div className="w-3 h-3 bg-green-600 rounded-full border-2 border-white shadow-sm"></div>
              <div className="absolute top-4 w-0.5 h-15 bg-gray-300 border-l border-dashed border-gray-500"></div>
            </div>
            <div className="w-full border-b border-gray-100 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">Pickup</h3>
              <p className="text-sm text-gray-500 leading-snug">
                {props.pickup}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center gap-1 mt-1">
              <div className="w-3 h-3 bg-red-600 rounded-sm border-2 border-white shadow-sm"></div>
            </div>
            <div className="w-full">
              <h3 className="text-lg font-semibold text-gray-900">
                Destination
              </h3>
              <p className="text-sm text-gray-500 leading-snug">
                {props.destination}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 w-full mb-2">
        <button
          onClick={() => {
            props.cancelRide();
          }}
          className="w-full bg-red-50 border border-red-100 text-red-600 font-bold p-3 rounded-xl hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
        >
          <i className="ri-close-line mr-2"></i>
          Cancel Request
        </button>
      </div>
    </div>
  );
};

export default LookingForDriver;
