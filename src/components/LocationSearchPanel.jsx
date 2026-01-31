import React from "react";

const LocationSearchPanel = ({
  suggestions,
  setVehiclePanel,
  setPanelOpen,
  setPickup,
  setDestination,
  activeField,
}) => {
  const handleSuggestionClick = (suggestion) => {
    if (activeField === "pickup") {
      setPickup(suggestion);
    } else if (activeField === "destination") {
      setDestination(suggestion);
    }
  };

  return (
    <div>
      {suggestions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <img
            src="/noSuggestions.svg" 
            alt="No suggestions found"
            className="w-1/2 opacity-50 object-contain"
          />
          <p className="text-gray-400 mt-2 text-sm">
            Enter a location to search
          </p>
        </div>
      ) : (
        suggestions.map((elem, idx) => (
          <div
            key={idx}
            onClick={() => handleSuggestionClick(elem)}
            className="flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <div className="bg-gray-100 h-10 w-10 flex items-center justify-center rounded-full shrink-0">
            
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="rgba(24,24,24,1)"
              >
                <path d="M18.364 17.364L12 23.7279L5.63604 17.364C2.12132 13.8492 2.12132 8.15076 5.63604 4.63604C9.15076 1.12132 14.8492 1.12132 18.364 4.63604C21.8787 8.15076 21.8787 13.8492 18.364 17.364ZM12 15C14.2091 15 16 13.2091 16 11C16 8.79086 14.2091 7 12 7C9.79086 7 8 8.79086 8 11C8 13.2091 9.79086 15 12 15ZM12 13C10.8954 13 10 12.1046 10 11C10 9.89543 10.8954 9 12 9C13.1046 9 14 9.89543 14 11C14 12.1046 13.1046 13 12 13Z"></path>
              </svg>
            </div>
            <div className="font-medium text-gray-800">{elem}</div>
          </div>
        ))
      )}
    </div>
  );
};

export default LocationSearchPanel;
