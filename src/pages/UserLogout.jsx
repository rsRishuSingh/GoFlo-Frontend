import React, { useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export const UserLogout = () => {
  const userToken = localStorage.getItem("userToken");
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_BASE_URL}/users/logout`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          localStorage.removeItem("userToken");
          navigate("/user-login");
        }
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        // Even if the server fails, we clear the token client-side
        localStorage.removeItem("userToken");
        navigate("/user-login");
      });
  }, [userToken, navigate]);

  return (
    <div className="h-screen w-full flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

export default UserLogout;
