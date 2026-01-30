import React, { useState, useEffect, useRef, useContext } from "react";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";
import { SocketContext } from "../context/SocketContext";

const containerStyle = {
  width: "100%",
  height: "100%",
};

// 🎨 Ola-like Style
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

const LiveRouteTracking = ({ destination, isCaptain = false, rideId }) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const mapRef = useRef(null);
  const { socket } = useContext(SocketContext);

  // 1. Live Location & Socket Logic
  useEffect(() => {
    let interval;

    // --- CAPTAIN LOGIC (Send Data) ---
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

    // --- USER LOGIC (Receive Data) ---
    else {
      if (rideId) {
        console.log("Searching for ride room:", rideId);

        // A. Initial Join
        socket.emit("join-ride", { rideId });

        // B. Handle Reconnection (The Fix for Freezing)
        const handleReconnect = () => {
          console.log("Socket reconnected! Re-joining ride room:", rideId);
          socket.emit("join-ride", { rideId });
        };

        // C. Handle Incoming Location Data
        const handleLocationUpdate = (data) => {
          if (data && data.location) {
            // console.log("📍 Location update received:", data.location); // Uncomment to debug
            setCurrentPosition({
              lat: data.location.ltd,
              lng: data.location.lng,
            });
          }
        };

        // Attach Listeners
        socket.on("connect", handleReconnect);
        socket.on("captain-location-update", handleLocationUpdate);

        // Cleanup
        return () => {
          socket.off("connect", handleReconnect);
          socket.off("captain-location-update", handleLocationUpdate);
        };
      }
    }

    return () => clearInterval(interval);
  }, [isCaptain, rideId, socket]);

  // 2. Route Calculation Logic (Only reruns if destination changes)
  useEffect(() => {
    if (!currentPosition || !destination) return;

    // Avoid recalculating route if we already have one and the captain just moved slightly
    // (Optional optimization: Check distance to end)

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
            url: "/carTracker.png", // Ensure this exists in public/ folder
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
            preserveViewport: true, // PREVENTS flickering zoom reset
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
