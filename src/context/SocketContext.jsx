import React, { createContext, useEffect } from "react";
import { io } from "socket.io-client";

export const SocketContext = createContext();

const socket = io(`${import.meta.env.VITE_BASE_URL}`, {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

const SocketProvider = ({ children }) => {
  useEffect(() => {
    // Check if already connected
    if (socket.connected) {
      console.log("Socket already connected");
    }

    // Connection event
    socket.on("connect", () => {
      console.log("Connected to server");
    });

    // Disconnection event
    socket.on("disconnect", () => {
      console.log("Disconnected from server");
    });

    // Error event for debugging
    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    // Cleanup listeners on unmount
    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
