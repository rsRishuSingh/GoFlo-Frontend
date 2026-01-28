import React, { useState, useEffect, useRef } from "react";
import { LoadScript, GoogleMap, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
  position: "relative",
  display: "flex",
};

const defaultCenter = {
  lat: 28.6139,
  lng: 77.209,
};

const mapOptions = {
  draggable: true,
  scrollwheel: true,
  zoomControl: true,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  gestureHandling: "greedy", // Allow dragging without keyboard modifier
  disableDoubleClickZoom: false,
  clickableIcons: true,
  keyboardShortcuts: true,
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
  ],
};

const LiveTracking = () => {
  const [currentPosition, setCurrentPosition] = useState(defaultCenter);
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);

  // Get user location on map load (user gesture)
  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { ltd, lng } = position.coords;
          const newPosition = { lat: ltd, lng: lng };
          setCurrentPosition(newPosition);
          setIsLocationLoaded(true);

          // Center map if it's already loaded
          if (mapRef.current) {
            mapRef.current.setCenter(newPosition);
            mapRef.current.setZoom(17);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setIsLocationLoaded(true); // Still mark as loaded to use default
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        },
      );
    }
  };

  const handleMapLoad = (mapInstance) => {
    mapRef.current = mapInstance;
    setMap(mapInstance);

    // Trigger a resize event to ensure map renders correctly
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    // Request geolocation when map loads (counts as user gesture)
    getLocation();

    // If location is already loaded, center the map
    if (isLocationLoaded) {
      mapInstance.setCenter(currentPosition);
      mapInstance.setZoom(17);
    }
  };

  // Center map when location is loaded
  useEffect(() => {
    if (mapRef.current && isLocationLoaded && currentPosition) {
      mapRef.current.setCenter(currentPosition);
      mapRef.current.setZoom(17);
    }
  }, [isLocationLoaded, currentPosition]);

  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={currentPosition}
        zoom={15}
        onLoad={handleMapLoad}
        options={mapOptions}
      >
        <Marker position={currentPosition} />
      </GoogleMap>
    </LoadScript>
  );
};

export default LiveTracking;
