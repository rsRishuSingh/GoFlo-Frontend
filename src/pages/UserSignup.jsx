import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserDataContext } from "../context/UserContext";
import axios from "axios";

const UserSignup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    email: "",
    password: "",
  });

  const navigate = useNavigate();
  const { setUser } = useContext(UserDataContext);

  const validate = () => {
    let isValid = true;
    const newErrors = { firstName: "", email: "", password: "" };

    if (firstName.length < 3) {
      newErrors.firstName = "Min 3 characters";
      isValid = false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (password.length < 6) {
      newErrors.password = "Min 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const newUser = {
      fullname: { firstname: firstName, lastname: lastName },
      email,
      password,
    };

    try {
      console.log(`${import.meta.env.VITE_BASE_URL}/users/register`, newUser);
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/register`,
        newUser,
      );
      if (response.status === 201) {
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
          className="w-24 mb-5"
          src="https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1280px-Ola_Cabs_logo.svg.png"
          alt="Ola Logo"
        />

        <form onSubmit={submitHandler}>
          <h5 className="text-4xl font-bold my-10 text-center text-[#262626] ">
            Ride with GoFlo
          </h5>
          <h3 className="text-base font-medium m1-2">What's your name</h3>
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (errors.firstName) setErrors({ ...errors, firstName: "" });
                }}
                className=" w-full rounded-lg px-4 py-2 border-2 text-base placeholder:text-base"
              />
              <div className="min-h-6.25 ">
                {errors.firstName && (
                  <p className="text-red-500 text-sm">{errors.firstName}</p>
                )}
              </div>
            </div>

            <div className="w-1/2">
              <input
                type="text"
                required
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="bg-[#ffffff] w-full rounded-lg px-4 py-2 border-2 text-base placeholder:text-base"
              />
              {/* Spacer for alignment parity */}
              <div className="min-h-6.25 mb-2"></div>
            </div>
          </div>

          <h3 className="text-base font-medium m1-2">What's your email</h3>
          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors({ ...errors, email: "" });
            }}
            className="rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
          />
          <div className="min-h-6.25 ">
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          <h3 className="text-base font-medium mb-2">Enter Password</h3>
          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            className=" rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
          />
          <div className="min-h-6.25 ">
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            className="bg-[#9aec00] text-gray-950 font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
          <span className="text-gray-900">Already have an account? </span>
          <Link to="/user-login" className="text-blue-600">
            Login here
          </Link>
        </p>
      </div>

      <div>
        <p className="text-[12px] leading-tight">
          This site is protected by reCAPTCHA and the{" "}
          <span className="underline text-blue-600">
            <a
              href="https://google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Privacy Policy
            </a>
          </span>{" "}
          and{" "}
          <span className="underline text-blue-600">
            <a
              href="https://google.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms of Service apply
            </a>
          </span>
          .
        </p>
      </div>
    </div>
  );
};

export default UserSignup;
