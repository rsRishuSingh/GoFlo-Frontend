import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const Start = () => {
  const navigate = useNavigate();

  const userToken = localStorage.getItem("userToken");
  const captainToken = localStorage.getItem("captainToken");

  const [showLogin, setShowLogin] = useState(!(userToken || captainToken));

  useEffect(() => {
    if (userToken || captainToken) {
      const timeout = setTimeout(() => {
        if (userToken) {
          navigate("/user-home");
        } else if (captainToken) {
          navigate("/captain-home");
        }
      }, 1500);

      return () => clearTimeout(timeout);
    }
  }, [navigate, userToken, captainToken]);

  return (
    <div>
      <div
        className="relative bg-cover bg-center h-screen pt-8 flex justify-between flex-col w-full overflow-hidden"
        style={{ backgroundImage: "url(/carbackSeat.png)" }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black"></div>

        <img
          className="relative z-10 w-32 ml-8"
          src="/logo.png"
          alt="GoFlo Logo"
        />

        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="absolute w-64 h-64 bg-white/5 rounded-full animate-ping"></div>
          <div className="absolute w-48 h-48 bg-white/10 rounded-full animate-pulse"></div>
          <div className="relative w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 shadow-[0_0_30px_rgba(170,234,54,0.4)]">
            <div className="bg-[#aaea36] w-14 h-14 rounded-full flex items-center justify-center shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-8 h-8 text-black"
              >
                <path
                  fillRule="evenodd"
                  d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>
        </div>

        {showLogin && (
          <div className="relative z-10 pb-8 py-4 px-4 transition-all duration-700 ease-in-out">
            <h2 className="text-[28px] text-white">
              Get Started with{" "}
              <span className="font-bold text-[30px]">GoFlo</span>
            </h2>

            <div className="flex items-center justify-center">
              <Link
                to="/user-login"
                className="flex items-center justify-center font-bold text-lg
                           w-[90%] bg-[#aaea36] text-black py-3 rounded-4xl mt-3 hover:bg-[#9bd430] transition-colors shadow-lg shadow-[#aaea36]/30"
              >
                Get Started
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Start;
