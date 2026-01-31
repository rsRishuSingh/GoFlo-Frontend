import React, { useState, useEffect, useRef } from "react";
import { GoogleMap } from "@react-google-maps/api"; // ❌ Remove Marker import

const containerStyle = {
  width: "100%",
  height: "100%",
  position: "relative",
  display: "flex",
  touchAction: "none",
};

const mapOptions = {
  //  your Map ID here (from Google Cloud Console)
  mapId: `${import.meta.env.VITE_GOOGLE_MAPS_ID}`,

  draggable: true,
  scrollwheel: false,
  zoomControl: false,
  fullscreenControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  gestureHandling: "greedy",
  disableDoubleClickZoom: false,
  clickableIcons: false,
  keyboardShortcuts: false,
  disableDefaultUI: true,
};

const LiveTracking = () => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [map, setMap] = useState(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null); // Ref to hold the AdvancedMarkerElement
  const [isLocationLoaded, setIsLocationLoaded] = useState(false);

  // Get user location
  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newPosition = { lat: latitude, lng: longitude };
          setCurrentPosition(newPosition);
          setIsLocationLoaded(true);

          if (map) {
            map.setCenter(newPosition);
            map.setZoom(17);
          }
        },
        (error) => {
          console.warn("Geolocation error:", error);
          setIsLocationLoaded(true);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
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
  };

  // --- NEW: Handle Advanced Marker ---
  useEffect(() => {
    if (map && currentPosition && window.google) {
      // 1. Clean up old marker if it exists
      if (markerRef.current) {
        markerRef.current.map = null;
      }

      // 2. Create new AdvancedMarkerElement
      const { AdvancedMarkerElement } = window.google.maps.marker;

      markerRef.current = new AdvancedMarkerElement({
        map,
        position: currentPosition,
        title: "Your Location",
      });
    }

    // Cleanup on unmount
    return () => {
      if (markerRef.current) markerRef.current.map = null;
    };
  }, [map, currentPosition]);

  useEffect(() => {
    if (mapRef.current && isLocationLoaded && currentPosition) {
      mapRef.current.setCenter(currentPosition);
      mapRef.current.setZoom(17);
    }
  }, [isLocationLoaded, currentPosition]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentPosition}
      zoom={15}
      onLoad={handleMapLoad}
      options={mapOptions}
    >
    </GoogleMap>
  );
};

export default LiveTracking;
