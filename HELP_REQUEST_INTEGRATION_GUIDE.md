# Help Request System - Frontend Integration Guide

## Overview

This guide explains how to integrate the new help request system into existing User and Captain home pages.

## Components Created

### 1. **HelpAcceptancePanel.jsx**

- Shows when a medic/captain receives an incoming help request
- 4-minute countdown timer
- Accept/Decline buttons
- Displays urgency level and acceptor count

### 2. **HelpInProgressPanel.jsx**

- Shows during active help request with medic en route
- Two modes: User view (waiting for medic) and Medic view (navigating to patient)
- Shows ETA, acceptor count, location
- In medic view: shows "I've Arrived" button for 200m proximity

### 3. **helpService.js**

- API wrapper for all help request endpoints
- Handles registration, acceptance, cancellation, completion
- Device token management

## Updated Contexts

### UserContext.jsx

New state and methods:

```javascript
- activeHelpRequest: Current help request ID
- helpRequestStatus: Status with acceptor count and ETA
- incomingHelpRequest: Incoming request from medics
- userLocation: Current user location {lat, lng}
- medicLocations: Map of nearby medics' locations
- updateUserLocation(lat, lng, socket) - Send location updates
- sendHelpRequest(location, socket) - Initiate help request
- cancelHelpRequest(helpRequestId, socket) - Cancel request
- completeHelpRequest(helpRequestId, socket) - Mark complete
- setupHelpSocketListeners(socket) - Setup socket event listeners
```

### CaptainContext.jsx

New state and methods:

```javascript
- activeHelpRequest: Current help request ID
- incomingHelpRequest: Incoming help request data
- helpAcceptanceTimeout: Countdown timer (4 min)
- acceptedHelpRequests: Array of accepted request IDs
- patientLocation: Patient's location {lat, lng}
- medicETA: ETA to patient in seconds
- updateCaptainLocation(lat, lng, socket) - Send location updates
- acceptHelpRequest(helpRequestId, location, socket) - Accept request
- declineHelpRequest(helpRequestId, socket) - Decline request
- cancelAcceptedHelpRequest(helpRequestId, socket) - Cancel acceptance
- markMedicArrived(helpRequestId, socket) - Mark as arrived
- setupHelpSocketListeners(socket) - Setup socket event listeners
```

## Integration Steps

### Step 1: Update UserHome.jsx

```javascript
import { useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/SocketContext";
import { UserDataContext } from "@/context/UserContext";
import HelpButton from "@/components/HelpButton";
import HelpAcceptancePanel from "@/components/HelpAcceptancePanel";
import HelpInProgressPanel from "@/components/HelpInProgressPanel";
import helpService from "@/services/helpService";

const UserHome = () => {
  const { socket } = useContext(SocketContext);
  const {
    user,
    updateUserLocation,
    setupHelpSocketListeners,
    cleanupHelpSocketListeners,
    activeHelpRequest,
    helpRequestStatus,
    sendHelpRequest,
    completeHelpRequest,
    cancelHelpRequest,
  } = useContext(UserDataContext);

  const [isHelpRequesting, setIsHelpRequesting] = useState(false);

  // Setup socket listeners on mount
  useEffect(() => {
    if (socket && user._id) {
      setupHelpSocketListeners(socket);
    }
    return () => {
      if (socket) cleanupHelpSocketListeners(socket);
    };
  }, [socket, user._id, setupHelpSocketListeners, cleanupHelpSocketListeners]);

  // Track user location in real-time
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserLocation(latitude, longitude, socket);
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, updateUserLocation]);

  const handleSendHelpRequest = async () => {
    setIsHelpRequesting(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use Socket.IO for real-time coordination
          sendHelpRequest({ lat: latitude, lng: longitude }, socket);
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsHelpRequesting(false);
        },
      );
    } catch (error) {
      console.error("Error sending help request:", error);
      setIsHelpRequesting(false);
    }
  };

  const handleCompleteRequest = async () => {
    if (activeHelpRequest) {
      try {
        // Also use API for persistence
        await helpService.completeHelpRequest(activeHelpRequest);
        completeHelpRequest(activeHelpRequest, socket);
      } catch (error) {
        console.error("Error completing request:", error);
      }
    }
  };

  const handleCancelRequest = async (reason) => {
    if (activeHelpRequest) {
      try {
        await helpService.cancelHelpRequest(activeHelpRequest, reason);
        cancelHelpRequest(activeHelpRequest, socket, reason);
      } catch (error) {
        console.error("Error cancelling request:", error);
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Existing UserHome content */}
      <div className="flex-1">{/* Your existing map and UI */}</div>

      {/* Help Button in Home UI */}
      <HelpButton
        onClick={handleSendHelpRequest}
        isLoading={isHelpRequesting}
      />

      {/* Show panels based on state */}
      {activeHelpRequest && helpRequestStatus ? (
        <HelpInProgressPanel
          helpRequest={helpRequestStatus}
          onComplete={handleCompleteRequest}
          onCancel={handleCancelRequest}
          isLoading={isHelpRequesting}
          isUserView={true}
        />
      ) : null}
    </div>
  );
};

export default UserHome;
```

### Step 2: Update CaptainHome.jsx / CaptainRiding.jsx

```javascript
import { useContext, useEffect, useState } from "react";
import { SocketContext } from "@/context/SocketContext";
import { CaptainDataContext } from "@/context/CaptainContext";
import HelpAcceptancePanel from "@/components/HelpAcceptancePanel";
import HelpInProgressPanel from "@/components/HelpInProgressPanel";
import helpService from "@/services/helpService";

const CaptainHome = () => {
  const { socket } = useContext(SocketContext);
  const {
    captain,
    updateCaptainLocation,
    setupHelpSocketListeners,
    cleanupHelpSocketListeners,
    incomingHelpRequest,
    activeHelpRequest,
    acceptHelpRequest,
    markMedicArrived,
    cancelAcceptedHelpRequest,
    declineHelpRequest,
  } = useContext(CaptainDataContext);

  const [isAccepting, setIsAccepting] = useState(false);

  // Setup socket listeners on mount
  useEffect(() => {
    if (socket && captain?._id) {
      setupHelpSocketListeners(socket);
    }
    return () => {
      if (socket) cleanupHelpSocketListeners(socket);
    };
  }, [
    socket,
    captain?._id,
    setupHelpSocketListeners,
    cleanupHelpSocketListeners,
  ]);

  // Track captain location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateCaptainLocation(latitude, longitude, socket);
      },
      (error) => console.error("Location error:", error),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [socket, updateCaptainLocation]);

  const handleAcceptHelp = async () => {
    if (!incomingHelpRequest) return;

    setIsAccepting(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          // Use both socket (real-time) and API (persistence)
          acceptHelpRequest(
            incomingHelpRequest.helpRequestId,
            { lat: latitude, lng: longitude },
            socket,
          );

          await helpService.acceptHelpRequest(
            incomingHelpRequest.helpRequestId,
            { lat: latitude, lng: longitude },
          );
        },
        (error) => {
          console.error("Error getting location:", error);
          setIsAccepting(false);
        },
      );
    } catch (error) {
      console.error("Error accepting help:", error);
      setIsAccepting(false);
    }
  };

  const handleDeclineHelp = () => {
    if (incomingHelpRequest) {
      declineHelpRequest(incomingHelpRequest.helpRequestId, socket);
    }
  };

  const handleMedicArrived = async () => {
    if (activeHelpRequest) {
      try {
        markMedicArrived(activeHelpRequest, socket);
        await helpService.markMedicArrived(activeHelpRequest);
      } catch (error) {
        console.error("Error marking arrived:", error);
      }
    }
  };

  const handleCancelAcceptance = async () => {
    if (activeHelpRequest) {
      try {
        cancelAcceptedHelpRequest(activeHelpRequest, socket);
        await helpService.cancelHelpAcceptance(activeHelpRequest);
      } catch (error) {
        console.error("Error cancelling acceptance:", error);
      }
    }
  };

  return (
    <div className="relative w-full h-full">
      {/* Existing CaptainHome content */}
      <div className="flex-1">{/* Your existing map and UI */}</div>

      {/* Show incoming help request (modal) */}
      {incomingHelpRequest && !activeHelpRequest && (
        <HelpAcceptancePanel
          helpRequest={incomingHelpRequest}
          onAccept={handleAcceptHelp}
          onDecline={handleDeclineHelp}
          isLoading={isAccepting}
        />
      )}

      {/* Show in-progress help request */}
      {activeHelpRequest && (
        <HelpInProgressPanel
          helpRequest={{ ...incomingHelpRequest, acceptorsCount: 1 }}
          onComplete={handleMedicArrived}
          onCancel={handleCancelAcceptance}
          isLoading={isAccepting}
          isUserView={false}
        />
      )}
    </div>
  );
};

export default CaptainHome;
```

### Step 3: Register Device Tokens

Add to UserSignup.jsx / UserLogin.jsx:

```javascript
import { useContext, useEffect } from "react";
import { UserDataContext } from "@/context/UserContext";
import helpService from "@/services/helpService";

const UserLogin = () => {
  const { user } = useContext(UserDataContext);

  useEffect(() => {
    // After successful login
    if (user._id && Notification.permission === "granted") {
      // Get FCM token from Firebase and register
      firebase
        .messaging()
        .getToken()
        .then((token) => {
          helpService.registerUserDeviceToken(token);
        });
    }
  }, [user._id]);

  // ... rest of login logic
};
```

Similar for Captain in CaptainLogin.jsx:

```javascript
const CaptainLogin = () => {
  const { captain } = useContext(CaptainDataContext);

  useEffect(() => {
    if (captain._id && Notification.permission === "granted") {
      firebase
        .messaging()
        .getToken()
        .then((token) => {
          helpService.registerCaptainDeviceToken(token);
        });
    }
  }, [captain._id]);

  // ... rest of login logic
};
```

## Socket Events Summary

### User Sends → Server

- `help:send-request` - Initiate help request
- `update-location-user` - Send location (throttled by 10m)
- `help:complete-request` - Close help request
- `help:cancel-request` - Cancel help request

### Captain Sends → Server

- `help:accept` - Accept help request
- `help:decline` - Decline help request
- `help:cancel-accepted` - Cancel accepted request
- `update-location-captain` - Send location (throttled by 10m)
- `help:medic-arrived` - Mark as arrived
- `help:medic-location-update` - Update location while navigating

### Server Sends → User

- `help:accepted` - Help request accepted + acceptor count + ETA
- `help:acceptor-cancelled` - An acceptor cancelled
- `help:no-acceptors-left` - All acceptors cancelled
- `help:medic-arrived` - Medic arrived at location
- `help:request-completed` - Request marked complete
- `medic-location-update` - Medic location update (for map tracking)

### Server Sends → Captain

- `help:request-received` - Incoming help request
- `help:joined-request-room` - Successfully accepted request
- `help:declined` - Request declined
- `help:request-completed` - Request marked complete by user
- `help:request-cancelled-by-user` - User cancelled the request
- `user-location-update` - Patient location update
- `help:request-expired` - Request expired (no one accepted)

## Testing Checklist

- [ ] User can send help request
- [ ] Push notification received by nearby medics
- [ ] Multiple medics can accept same request
- [ ] Acceptor count updates correctly
- [ ] ETA calculates and displays correctly
- [ ] Medics can cancel acceptance
- [ ] Other medics get re-notified on cancellation
- [ ] Medic can mark as "Arrived"
- [ ] User sees medic arrival status
- [ ] User can complete/cancel request
- [ ] All medics notified when request completes
- [ ] Location tracking updates every time movement > 10m
- [ ] Offline handling (socket reconnection, local state persistence)
- [ ] Push notifications work in background
- [ ] 4-minute acceptance timeout works

## Notes

- All socket operations also have API fallbacks for persistence
- Location updates throttled to >10m movement in database
- Real-time socket events provide instant UI updates
- Push notifications trigger both socket and UI updates
- ETA calculated using Google Maps Distance API
