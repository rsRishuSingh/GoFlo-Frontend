import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import UserContext from "./context/UserContext";
import CaptainContext from "./context/CaptainContext";
import SocketProvider from "./context/SocketContext";
import gsap from "gsap";

// Suppress passive event listener warnings for external libraries (GSAP, Google Maps)
const originalAddEventListener = EventTarget.prototype.addEventListener;
EventTarget.prototype.addEventListener = function (type, listener, options) {
  if (
    typeof options === "object" &&
    (type === "touchstart" || type === "touchmove" || type === "wheel")
  ) {
    options.passive = true;
  }
  return originalAddEventListener.call(this, type, listener, options);
};

// Register touch events as passive to avoid browser warnings
gsap.config({ force3D: true });

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <SocketProvider>
        <CaptainContext>
          <UserContext>
            <App />
          </UserContext>
        </CaptainContext>
      </SocketProvider>
    </BrowserRouter>
  </StrictMode>,
);
