import React, { useContext, useEffect, useState } from "react";
import { CaptainDataContext } from "../context/CaptainContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const CaptainProtectWrapper = ({ children }) => {
  const { setCaptain } = useContext(CaptainDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("captainToken");

      if (!token) {
        navigate("/captain-login");
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/captains/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.status === 200) {
          setCaptain(response.data.captain);
          setIsLoading(false);
        }
      } catch (err) {
        console.log("Captain Auth Failed. Attempting Refresh...", err);

        if (err.response && err.response.status === 401) {
          try {
            // 1. Call Refresh Token Endpoint
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_BASE_URL}/captains/refresh-token`,
              {},
              { withCredentials: true },
            );

            if (refreshResponse.status === 200) {
              const newCaptainToken = refreshResponse.data.captainToken;

              // 2. Update Storage
              localStorage.setItem("captainToken", newCaptainToken);

              // 3. Retry Profile Fetch with NEW Token
              const retryResponse = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/captains/profile`,
                {
                  headers: { Authorization: `Bearer ${newCaptainToken}` },
                },
              );

              // 4. Success
              setCaptain(retryResponse.data.captain);
              setIsLoading(false);
            }
          } catch (refreshError) {
            console.error("Captain Refresh failed. Redirecting.", refreshError);
            localStorage.removeItem("captainToken");
            navigate("/captain-login");
          }
        } else {
          // Handle other errors (e.g., invalid token format or other server errors)
          localStorage.removeItem("captainToken");
          navigate("/captain-login");
        }
      }
    };

    checkAuth();
  }, [navigate, setCaptain]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">
            Verifying Captain Session...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default CaptainProtectWrapper;
