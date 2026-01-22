import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { CaptainDataContext } from "../context/CaptainContext";

const CaptainLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const { setCaptain } = useContext(CaptainDataContext);
  const navigate = useNavigate();

  const validate = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }
    if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const captainData = { email, password };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/login`,
        captainData,
      );

      if (response.status === 201 || response.status === 200) {
        const data = response.data;
        setCaptain(data.captain);
        localStorage.setItem("captainToken", data.captainToken); 
        navigate("/captain-home");
      }
    } catch (err) {
      if (
        err.response &&
        (err.response.status === 401 || err.response.status === 400)
      ) {
        setErrors({
          email: err.response.data.message || "Invalid email or password",
          password: "",
        });
      }
    }
  };

  return (
    <div className="p-7 h-screen flex flex-col justify-between bg-[#edfddeec]">
      <div>
        <img
          className="w-32 mb-3"
          src="https://1000logos.net/wp-content/uploads/2022/08/Ola-Cabs-Logo-768x432.png"
          alt="Ola Logo"
        />

        <form onSubmit={submitHandler}>
          <h3 className="text-lg font-medium mb-2">What's your email</h3>
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            className="bg-[#ffffff] rounded-2xl px-4 py-2 border-none w-full text-lg placeholder:text-base"
          />
          {/* Fixed height error container */}
          <div className="min-h-6.25 mb-4">
            {errors.email && (
              <p className="text-red-500 text-sm px-2">{errors.email}</p>
            )}
          </div>

          <h3 className="text-lg font-medium mb-2">Enter Password</h3>
          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            className="bg-[#ffffff] rounded-2xl px-4 py-2 border-none w-full text-lg placeholder:text-base"
          />
          <div className="min-h-6.25 mb-4">
            {errors.password && (
              <p className="text-red-500 text-sm px-2">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="bg-[#098bf5] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
          >
            Login
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
          <span className="text-gray-700"> Join our fleet? </span>
          <Link to="/captain-signup" className="text-blue-600 font-bold">
            Register as a Driver
          </Link>
        </p>
      </div>

      <div>
        <Link
          to="/user-login"
          className="bg-[#7fdc0e] flex items-center justify-center text-white font-semibold mb-5 rounded-4xl px-4 py-2 w-full text-lg"
        >
          Sign in as User
        </Link>
      </div>
    </div>
  );
};

export default CaptainLogin;
