import React, { useContext } from "react";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainDetails = () => {
  const { captain } = useContext(CaptainDataContext);

  return (
    <div className="h-full flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <div className="flex items-center justify-start gap-3">
          <img
            className="h-12 w-12 rounded-full object-cover border-2 border-gray-100"
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRdlMd7stpWUCmjpfRjUsQ72xSWikidbgaI1w&s"
            alt="Captain Avatar"
          />
          <div>
            <h4 className="text-lg font-medium capitalize">
              {captain.fullname.firstname + " " + captain.fullname.lastname}
            </h4>
            <p className="text-xs text-gray-500 font-medium">Basic Level</p>
          </div>
        </div>
        <div>
          <h4 className="text-xl font-semibold">₹295.20</h4>
          <p className="text-sm text-gray-600 text-right">Earned</p>
        </div>
      </div>

      <div className="flex p-4 mt-6 bg-gray-50 rounded-xl justify-around gap-5 items-start shadow-inner">
        <div className="text-center">
          <i className="text-3xl mb-2 font-thin ri-timer-2-line text-black"></i>
          <h5 className="text-lg font-medium">10.2</h5>
          <p className="text-xs text-gray-600">Hours Online</p>
        </div>
        <div className="text-center">
          <i className="text-3xl mb-2 font-thin ri-speed-up-line text-black"></i>
          <h5 className="text-lg font-medium">30 KM</h5>
          <p className="text-xs text-gray-600">Total Distance</p>
        </div>
        <div className="text-center">
          <i className="text-3xl mb-2 font-thin ri-booklet-line text-black"></i>
          <h5 className="text-lg font-medium">20</h5>
          <p className="text-xs text-gray-600">Total Jobs</p>
        </div>
      </div>
    </div>
  );
};

export default CaptainDetails;
