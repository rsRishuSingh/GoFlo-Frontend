import React from "react";

const ConfirmRide = (props) => {
  
  const vehicleImages = {
    car: "/olaCar.png",
    moto: "/olaBike.png",
    auto: "/olaAuto.png",
  };

  return (
    <div>
      <h5
        className="p-1 text-center w-[93%] absolute top-0 cursor-pointer"
        onClick={() => {
          props.setConfirmRidePanel(false);
        }}
      >
        <i className="text-3xl text-gray-300 ri-arrow-down-wide-line"></i>
      </h5>
      <h3 className="text-2xl font-semibold">Confirm your Ride</h3>

      <div className="flex gap-2 justify-between flex-col items-center">
        <img
          className="w-40"
          src={vehicleImages[props.vehicleType]}
          alt="Vehicle"
        />

        <div className="w-full mt-1">
          <div className="flex items-center gap-x-5 gap-y-3 p-3 border-b-2">
            <i className="ri-map-pin-user-fill text-lg text-green-600"></i>
            <div>
              <h3 className="text-lg font-medium">Pickup</h3>
              <p className="text-sm  text-gray-600">
                {props.pickup?.location_name || props.pickup}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-x-5 gap-y-3 p-3 border-b-2">
            <i className="ri-map-pin-2-fill text-lg text-red-600"></i>
            <div>
              <h3 className="text-lg font-medium">Destination</h3>
              <p className="text-sm text-gray-600">
                {props.destination?.location_name || props.destination}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-x-5 gap-y-3 p-3">
            <i className="ri-currency-line text-lg text-yellow-600"></i>
            <div>
              <h3 className="text-lg font-medium">
                ₹{props.fare[props.vehicleType]}
              </h3>
              <p className="text-sm  text-gray-600">Cash</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            props.setVehicleFound(true);
            props.setConfirmRidePanel(false);
            props.createRide();
          }}
          className=" bg-[#9aec00] text-gray-950 font-bold w-full mt-5 px-2 py-3 rounded-4xl shadow-md cursor-pointer"
        >
          Confirm
        </button>
      </div>
    </div>
  );
};

export default ConfirmRide;
