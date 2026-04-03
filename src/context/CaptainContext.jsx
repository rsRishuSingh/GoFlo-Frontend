import { createContext, useState, useCallback, useRef } from "react";

export const CaptainDataContext = createContext();

const CaptainContext = ({ children }) => {
  const [captain, setCaptain] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Location Tracking
  const [captainLocation, setCaptainLocation] = useState(null);

  const updateCaptain = (captainData) => {
    setCaptain(captainData);
  };

  // Update captain location
  const updateCaptainLocation = useCallback(
    (lat, lng, socket, activeRideId = null) => {
      if (!socket) return;

      const newLocation = { lat, lng };
      setCaptainLocation(newLocation);

      // Emit location update to socket (will only update DB on >10m movement)
      socket.emit("update-location-captain", {
        userId: captain._id,
        location: { lat, lng },
        activeRideId,
      });
    },
    [captain?._id],
  );

  const value = {
    captain,
    setCaptain,
    isLoading,
    setIsLoading,
    error,
    setError,
    updateCaptain,
    // Location
    captainLocation,
    setCaptainLocation,
    // Methods
    updateCaptainLocation,
  };

  return (
    <CaptainDataContext.Provider value={value}>
      {children}
    </CaptainDataContext.Provider>
  );
};

export default CaptainContext;
