import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { GoogleMap, DirectionsRenderer, Marker } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const mapStyles = [
  {
    featureType: "poi",
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
];

const defaultMapOptions = {
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
  captainLocation,
}) => {
  const [currentPosition, setCurrentPosition] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [isAutoPanning, setIsAutoPanning] = useState(true);

  const mapRef = useRef(null);

  // 1. UPDATE POSITION STATE
  useEffect(() => {
    // A. Captain GPS Logic
    if (isCaptain) {
      const updateGPS = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
            const { latitude, longitude } = pos.coords;
            setCurrentPosition({ lat: latitude, lng: longitude });
          });
        }
      };
      updateGPS();
      const interval = setInterval(updateGPS, 4000);
      return () => clearInterval(interval);
    }

    // B. User Polling Logic
    if (!isCaptain && captainLocation) {
      setCurrentPosition(captainLocation);
    }
  }, [isCaptain, captainLocation]);

  // 2. SMOOTH CAMERA MOVEMENT
  useEffect(() => {
    if (currentPosition && mapRef.current && isAutoPanning) {
      mapRef.current.panTo(currentPosition);
    }
  }, [currentPosition, isAutoPanning]);

  // 3. FETCH ROUTE (Once)
  useEffect(() => {
    if (directionsResponse) return;
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
          } else {
            console.error("Route failed:", status);
          }
        },
      );
    }
  }, [currentPosition, destination, directionsResponse]);

  // 4. Handle User Interaction
  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
    // Detect drag to stop auto-panning
    map.addListener("dragstart", () => {
      setIsAutoPanning(false);
    });
  }, []);

  const reCenterMap = () => {
    setIsAutoPanning(true);
    if (currentPosition && mapRef.current) {
      mapRef.current.panTo(currentPosition);
    }
  };

  const directionsOptions = useMemo(
    () => ({
      directions: directionsResponse,
      suppressMarkers: true,
      preserveViewport: true,
      polylineOptions: {
        strokeColor: "#ff0000",
        strokeWeight: 5,
      },
    }),
    [directionsResponse],
  );

  const initialCenter = useMemo(() => {
    return currentPosition || { lat: 28.6139, lng: 77.209 };
  }, []);

  return (
    <div className="relative w-full h-full">
      <GoogleMap
        mapContainerStyle={containerStyle}
        defaultCenter={initialCenter}
        zoom={16}
        options={defaultMapOptions}
        onLoad={onMapLoad}
      >
        {currentPosition && (
          <Marker
            position={currentPosition}
            icon={{
              url: "/carTracker.png",
              scaledSize: { width: 50, height: 50 },
              anchor: { x: 25, y: 25 },
            }}
          />
        )}

        {directionsResponse && (
          <DirectionsRenderer options={directionsOptions} />
        )}

        {destination && <Marker position={destination} />}
      </GoogleMap>

      {/* Re-Center Button */}
      {!isAutoPanning && (
        <button
          onClick={reCenterMap}
          className="absolute bottom-24 right-4 bg-white p-3 rounded-full shadow-lg z-5 text-black font-bold flex items-center justify-center"
          title="Re-center"
        >
          <i className="ri-focus-3-line text-xl"></i>
        </button>
      )}
    </div>
  );
};

export default LiveRouteTracking;
