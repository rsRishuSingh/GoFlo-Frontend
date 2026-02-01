import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { UserDataContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const UserLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });

  const { setUser } = useContext(UserDataContext);
  const navigate = useNavigate();

  const validate = () => {
    let isValid = true;
    const newErrors = { email: "", password: "" };

    if (!email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitHandler = async (e) => {
    e.preventDefault();

    if (!validate()) return;

    const userData = { email, password };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/login`,
        userData,
      );

      if (response.status === 200) {
        const data = response.data;
        setUser(data.user);
        localStorage.setItem("userToken", data.userToken);
        navigate("/user-home");
      }
    } catch (err) {
      if (err.response && err.response.data.message) {
        setErrors((prev) => ({ ...prev, email: err.response.data.message }));
      }
    }
  };

  return (
    <div className="p-7 h-screen flex flex-col justify-between ">
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
          <h3 className="text-lg font-medium mb-1">Enter your email</h3>
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            name="password"
            autoComplete="current-email"
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            className="rounded-2xl  px-4 py-2  border-2 w-full text-base placeholder:text-base"
          />

          <div className="min-h-6.25">
            {errors.email && (
              <p className="text-red-500 text-sm px-2">{errors.email}</p>
            )}
          </div>

          <h3 className="text-lg font-medium mb-1">Enter your Password</h3>
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            name="password"
            autoComplete="current-email"
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            className=" rounded-2xl border-2 px-4 py-2  w-full text-base placeholder:text-base"
          />
          <div className="min-h-6.25 ">
            {errors.password && (
              <p className="text-red-500 text-sm px-2">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="bg-[#9aec00] text-gray-950 font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
          >
            Login
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
          <span className="text-gray-900">New here? </span>
          <Link to="/user-signup" className="text-blue-600">
            Create new Account
          </Link>
        </p>
      </div>

      <div>
        <Link
          to="/captain-login"
          className="flex items-center justify-center bg-[#098bf5] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
        >
          Sign in as Driver
        </Link>
      </div>
    </div>
  );
};

export default UserLogin;
