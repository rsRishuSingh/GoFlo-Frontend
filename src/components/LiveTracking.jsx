import React, { useState, useEffect, useRef } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api"; // Remove LoadScript

const containerStyle = {
  width: "100%",
  height: "100%",
  position: "relative",
  display: "flex",
  // CSS Fix for "Passive Event Listener" warnings:
  touchAction: "none",
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
  gestureHandling: "greedy",
  disableDoubleClickZoom: false,
  clickableIcons: true,
  keyboardShortcuts: true,
  // touchAction: "none" <-- Remove this from options, it belongs in containerStyle
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
          const { latitude, longitude } = position.coords;
          const newPosition = { lat: latitude, lng: longitude };
          setCurrentPosition(newPosition);
          setIsLocationLoaded(true);

          if (mapRef.current) {
            mapRef.current.setCenter(newPosition);
            mapRef.current.setZoom(17);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setIsLocationLoaded(true);
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

    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 100);

    getLocation();

    if (isLocationLoaded) {
      mapInstance.setCenter(currentPosition);
      mapInstance.setZoom(17);
    }
  };

  useEffect(() => {
    if (mapRef.current && isLocationLoaded && currentPosition) {
      mapRef.current.setCenter(currentPosition);
      mapRef.current.setZoom(17);
    }
  }, [isLocationLoaded, currentPosition]);

  return (
    // Removed <LoadScript> wrapper (it is now in App.jsx)
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentPosition}
      zoom={15}
      onLoad={handleMapLoad}
      options={mapOptions}
    >
      <Marker position={currentPosition} />
    </GoogleMap>
  );
};

export default LiveTracking;
