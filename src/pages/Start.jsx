

import { Link } from 'react-router-dom'
import carBackSeat from "../assets/carbackSeat.png";
const Start = () => {
  return (
     <div>
      <div
        className="relative bg-cover bg-center h-screen pt-8 flex justify-between flex-col w-full"
        style={{ backgroundImage: `url(${carBackSeat})` }}
      >
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/40 to-black"></div>

        <img
          className="relative z-10 w-32 ml-8"
          src="https://1000logos.net/wp-content/uploads/2022/08/Ola-Cabs-Logo-768x432.png"
          alt="Ola Logo"
        />

        <div className="relative z-10 pb-8 py-4 px-4">
          <h2 className="text-[30px] font-semibold text-white">
            Get Started with <span className="font-bold">OLA</span>
          </h2>

          <Link
            to="/user-login"
            className="flex items-center justify-center  font-semibold text-lg
                       w-full bg-[#85dc02] text-white py-3 rounded-4xl mt-5"
          >
            Continue
          </Link>
        </div>
      </div>
    </div>
  )

}

export default Start