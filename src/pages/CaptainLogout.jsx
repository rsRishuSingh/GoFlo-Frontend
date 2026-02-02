import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const CaptainLogout = () => {
  const captainToken = localStorage.getItem("captainToken");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/captains/logout`, {
        headers: {
          Authorization: `Bearer ${captainToken}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          localStorage.removeItem("captainToken");
          localStorage.removeItem("userToken");
          navigate("/captain-login");
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        localStorage.removeItem("captainToken");
        localStorage.removeItem("userToken");
        navigate("/captain-login");
      });
  }, [captainToken, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

export default CaptainLogout;
