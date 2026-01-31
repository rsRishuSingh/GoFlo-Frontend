import React, { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserProtectWrapper = ({ children }) => {
  const { user, setUser } = useContext(UserDataContext);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("userToken");

      if (!token) {
        navigate("/user-login");
        return;
      }

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/users/profile`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );

        if (response.status === 200) {
          setUser(response.data.user);
          setIsLoading(false);
        }
      } catch (err) {
        console.log("Initial Token Failed. Attempting Refresh...", err);

        if (err.response && err.response.status === 401) {
          try {
            const refreshResponse = await axios.post(
              `${import.meta.env.VITE_BASE_URL}/users/refresh-token`,
              {},
              { withCredentials: true },
            );

            if (refreshResponse.status === 200) {
              

              localStorage.setItem("userToken", refreshResponse.data.userToken);

              const retryResponse = await axios.get(
                `${import.meta.env.VITE_BASE_URL}/users/profile`,
                {
                  headers: { Authorization: `Bearer ${newAccessToken}` },
                },
              );

              setUser(retryResponse.data.user);
              setIsLoading(false);
            }
          } catch (refreshError) {
            console.error(
              "Refresh failed. Redirecting to login.",
              refreshError,
            );
            localStorage.removeItem("userToken");
            navigate("/user-login");
          }
        } else {
          navigate("/user-login");
        }
      }
    };

    checkAuth();
  }, [navigate, setUser]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default UserProtectWrapper;
