

import { Link } from 'react-router-dom'
const Start = () => {
  return (
    <div>
      <div
        className="relative bg-cover bg-center h-screen pt-8 flex justify-between flex-col w-full"
        style={{ backgroundImage: "url(/carbackSeat.png)" }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black"></div>

        <img
          className="relative z-10 w-32 ml-8"
          src="/logo.png"
          alt="Ola Logo"
        />

        <div className="relative z-10 pb-8 py-4 px-4">
          <h2 className="text-[28px] text-white">
            Get Started with{" "}
            <span className="font-bold text-[30px]">GoFlo</span>
          </h2>

          <div className="flex items-center justify-center">
            <Link
              to="/user-login"
              className="flex items-center justify-center font-bold text-lg
                       w-[90%] bg-[#aaea36] text-black py-3 rounded-4xl mt-3"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

}

export default Start