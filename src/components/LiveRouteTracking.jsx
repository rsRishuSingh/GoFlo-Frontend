import React, { useState, useEffect, useRef, useContext } from "react";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { SocketContext } from "../context/SocketContext";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// 🎨 Ola-like Style (PRESERVED EXACTLY AS REQUESTED)
const mapStyles = [
  {
    featureType: "poi",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#e6e6e6" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e6e6e6" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffeb3b" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#fbc02d" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry.fill",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#aadaff" }],
  },
];

const mapOptions = {
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  disableDefaultUI: true,
  styles: mapStyles,
};

const LiveRouteTracking = ({
  destination,
  isCaptain = false,
  rideId,
  captainLocation,
}) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const mapRef = useRef(null);
  const { socket } = useContext(SocketContext);

  // 1. Polling Synchronization (The Concrete Fix)
  // When the parent component fetches new data from the DB, update the map immediately.
  useEffect(() => {
    if (!isCaptain && captainLocation) {
      setCurrentPosition(captainLocation);
    }
  }, [captainLocation, isCaptain]);

  // 2. Live Location & Socket Logic
  useEffect(() => {
    let interval;

    // --- CAPTAIN LOGIC (Send Data via GPS) ---
    if (isCaptain) {
      const updateLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              setCurrentPosition({ lat: latitude, lng: longitude });
            },
            (error) => console.error("GPS Error:", error),
            { enableHighAccuracy: true },
          );
        }
      };
      updateLocation();
      interval = setInterval(updateLocation, 4000);
    }

    // --- USER LOGIC (Receive Data via Socket - Fallback) ---
    else {
      // Even though we poll, we keep this listener active for real-time updates
      // between the 4-second API calls.
      const handleLocationUpdate = (data) => {
        if (data && data.location) {
          setCurrentPosition({
            lat: data.location.ltd,
            lng: data.location.lng,
          });
        }
      };

      if (socket) {
        socket.on("captain-location-update", handleLocationUpdate);
      }

      return () => {
        if (socket) {
          socket.off("captain-location-update", handleLocationUpdate);
        }
      };
    }

    return () => clearInterval(interval);
  }, [isCaptain, rideId, socket]);

  // 3. Route Calculation Logic
  useEffect(() => {
    if (!currentPosition || !destination) return;

    if (window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route(
        {
          origin: currentPosition,
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirectionsResponse(result);
          }
        },
      );
    }
  }, [currentPosition, destination]);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={currentPosition || { lat: 28.6139, lng: 77.209 }}
      zoom={15}
      options={mapOptions}
      onLoad={(map) => (mapRef.current = map)}
    >
      {currentPosition && (
        <Marker
          position={currentPosition}
          icon={{
            // Ensure this image exists in your public folder or use a URL
            url: "/carTracker.png",
            scaledSize: { width: 50, height: 50 },
            anchor: { x: 25, y: 25 },
          }}
        />
      )}

      {directionsResponse && (
        <DirectionsRenderer
          options={{
            directions: directionsResponse,
            suppressMarkers: true,
            preserveViewport: true,
            polylineOptions: {
              strokeColor: "#ff0000",
              strokeWeight: 4,
            },
          }}
        />
      )}

      {destination && <Marker position={destination} />}
    </GoogleMap>
  );
};

export default LiveRouteTracking;
