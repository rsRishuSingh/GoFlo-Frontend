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
    <div className="p-7 h-screen flex flex-col justify-between">
      <div>
        <img
          className="w-28 mb-5"
          src="/logo.png"
          alt="Ola Logo"
        />

        <form onSubmit={submitHandler}>
          <h5 className="text-4xl font-bold my-10 text-center text-[#262626] ">
            Welcome Back
          </h5>
          <h3 className="text-lg font-medium mb-1">What's your email</h3>
          <input
            type="email"
            required
            autoComplete="username"
            name="email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            className="rounded-2xl  px-4 py-2  border-2 w-full text-base placeholder:text-base"
          />
          {/* Fixed height error container */}
          <div className="min-h-6.25 ">
            {errors.email && (
              <p className="text-red-500 text-sm px-2">{errors.email}</p>
            )}
          </div>

          <h3 className="text-lg font-medium mb-1">Enter your Password</h3>
          <input
            type="password"
            placeholder="Password"
            required
            autoComplete="current-password"
            value={password}
            name="password"
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            className=" rounded-2xl border-2 px-4 py-2  w-full text-base placeholder:text-base"
          />
          <div className="min-h-6.25">
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
          <Link to="/captain-signup" className="text-blue-500 font-bold">
            Register as a Driver
          </Link>
        </p>
      </div>

      <div>
        <Link
          to="/user-login"
          className="flex items-center justify-center bg-[#9aec00] text-gray-950 font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
        >
          Sign in as User
        </Link>
      </div>
    </div>
  );
};

export default CaptainLogin;
