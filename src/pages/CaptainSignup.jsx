import { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CaptainDataContext } from "../context/CaptainContext";
import axios from "axios";

const CaptainSignup = () => {
  const navigate = useNavigate();
  const { setCaptain } = useContext(CaptainDataContext);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [vehicleColor, setVehicleColor] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [vehicleCapacity, setVehicleCapacity] = useState("");
  const [vehicleType, setVehicleType] = useState("");

  const [errors, setErrors] = useState({});

  const validate = () => {
    let newErrors = {};
    if (firstName.length < 3) newErrors.firstName = "Min 3 characters";
    if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Invalid email";
    if (password.length < 6) newErrors.password = "Min 6 characters";
    if (vehicleColor.length < 3) newErrors.vehicleColor = "Min 3 characters";
    if (vehiclePlate.length < 3) newErrors.vehiclePlate = "Invalid Plate";
    if (!vehicleCapacity || vehicleCapacity < 1)
      newErrors.vehicleCapacity = "Required";
    if (!vehicleType) newErrors.vehicleType = "Select type";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const captainData = {
      fullname: {
        firstname: firstName,
        lastname: lastName,
      },
      email,
      password,
      vehicleDetails: {
        color: vehicleColor,
        vehicleNumber: vehiclePlate,
        capacity: Number(vehicleCapacity),
        vehicleType: vehicleType,
      },
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/captains/register`,
        captainData,
      );

      if (response.status === 201) {
        const data = response.data;
        setCaptain(data.captain);
        localStorage.setItem("captainToken", data.captainToken);
        navigate("/captain-home");
      }
    } catch (err) {
      if (err.response && err.response.data.message) {
        setErrors({ email: err.response.data.message });
      }
    }
  };

  return (
    <div className="py-5 px-5 h-screen flex flex-col justify-between ">
      <div>
        <img
          className="w-28 mb-5"
          src="/logo.png"
          alt="Ola Logo"
        />

        <form onSubmit={submitHandler}>
          <h5 className="text-4xl font-bold my-10 text-center text-[#262626] ">
            Drive with GoFlo
          </h5>
          <h4 className="text-base font-medium mb-1">
            What's our Captain's name
          </h4>
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                type="text"
                required
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className=" w-full rounded-lg px-4 py-2 border-2 text-base placeholder:text-base"
              />
              <div className="min-h-5 ">
                {errors.firstName && (
                  <p className="text-red-600 text-xs px-2">
                    {errors.firstName}
                  </p>
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
              <div className="min-h-5 "></div>
            </div>
          </div>
          <h3 className="text-base font-medium mb-1">What's your email</h3>
          <input
            type="email"
            required
            placeholder="email@example.com"
            autoComplete="username"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
          />
          <div className="min-h-5 ">
            {errors.email && (
              <p className="text-red-600 text-xs px-2">{errors.email}</p>
            )}
          </div>

          <h3 className="text-base font-medium mb-1">Enter Password</h3>
          <input
            type="password"
            required
            placeholder="password"
            autoComplete="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className=" rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
          />
          <div className="min-h-5">
            {errors.password && (
              <p className="text-red-600 text-xs px-2">{errors.password}</p>
            )}
          </div>

          <h4 className="text-lg text-gray-700 font-medium mb-1">
            Vehicle Information
          </h4>
          <div className="flex gap-4">
            <div className="w-1/2">
              <input
                type="text"
                required
                placeholder="Vehicle Color"
                value={vehicleColor}
                onChange={(e) => setVehicleColor(e.target.value)}
                className=" rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
              />
              <div className="min-h-5">
                {errors.vehicleColor && (
                  <p className="text-red-600 text-xs px-2">
                    {errors.vehicleColor}
                  </p>
                )}
              </div>
            </div>
            <div className="w-1/2">
              <input
                type="text"
                required
                placeholder="Vehicle Plate"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className=" rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
              />
              <div className="min-h-5">
                {errors.vehiclePlate && (
                  <p className="text-red-600 text-xs px-2">
                    {errors.vehiclePlate}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <select
                required
                value={vehicleCapacity}
                onChange={(e) => {
                  setVehicleCapacity(e.target.value);
                  if (errors.vehicleCapacity)
                    setErrors({ ...errors, vehicleCapacity: "" });
                }}
                className=" rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
              >
                <option value="" disabled>
                  Capacity
                </option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
              <div className="min-h-5 ">
                {errors.vehicleCapacity && (
                  <p className="text-red-600 text-xs px-2">
                    {errors.vehicleCapacity}
                  </p>
                )}
              </div>
            </div>
            <div className="w-1/2">
              <select
                required
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className=" rounded-2xl px-4 py-2 border-2 w-full text-base placeholder:text-base"
              >
                <option value="" disabled>
                  Type
                </option>
                <option value="car">Car</option>
                <option value="auto">Auto</option>
                <option value="moto">Bike</option>
              </select>
              <div className="min-h-5 ">
                {errors.vehicleType && (
                  <p className="text-red-600 text-xs px-2">
                    {errors.vehicleType}
                  </p>
                )}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="bg-[#098bf5] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
          >
            Create Captain Account
          </button>
        </form>

        <p className="text-center text-[15px] font-medium mt-3 mb-4">
          <span className="text-gray-700">Already have an account? </span>
          <Link to="/captain-login" className="text-blue-500 font-bold">
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

export default CaptainSignup;
