import React, { useContext, useEffect, useState } from "react";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserProtectWrapper = ({ children }) => {
  const { setUser } = useContext(UserDataContext);
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
          navigate("/user-login");
        }
    };

    checkAuth();
  }, [navigate, setUser]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Verifying User Session...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default UserProtectWrapper;
