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
    // Logic to auto-close panel or auto-focus next field could go here
  };

  return (
    <div>
      {suggestions.map((elem, idx) => (
        <div
          key={idx}
          onClick={() => handleSuggestionClick(elem)}
          className="flex gap-4 border-2 p-3 border-gray-50 active:border-black rounded-xl items-center my-2 justify-start hover:bg-gray-100 cursor-pointer transition-colors"
        >
          <h2 className="bg-gray-100 h-8 flex items-center justify-center w-12 rounded-full">
            <i className="ri-map-pin-fill text-lg"></i>
          </h2>
          <h4 className="font-medium text-gray-800">{elem}</h4>
        </div>
      ))}
    </div>
  );
};

export default LocationSearchPanel;
