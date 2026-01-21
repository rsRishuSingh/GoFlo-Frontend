import { useState } from 'react'
import { Link } from 'react-router-dom'

const CaptainSignup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [vehicleColor, setVehicleColor] = useState('')
  const [vehiclePlate, setVehiclePlate] = useState('')
  const [vehicleCapacity, setVehicleCapacity] = useState('')
  const [vehicleType, setVehicleType] = useState('')

  const submitHandler = (e) => {
    e.preventDefault()

    const captainData = {
      fullname: {
        firstname: firstName,
        lastname: lastName,
      },
      email,
      password,
      vehicle: {
        color: vehicleColor,
        plate: vehiclePlate,
        capacity: Number(vehicleCapacity),
        vehicleType,
      },
    }

    console.log(captainData) 

    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
    setVehicleColor('')
    setVehiclePlate('')
    setVehicleCapacity('')
    setVehicleType('')
  }

  return (
    <div className="py-5 px-5 h-screen flex flex-col justify-between bg-[#a4ff4fec]">
      <div>
        <img
          className="w-28 mb-3"
         src="https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1280px-Ola_Cabs_logo.svg.png"
          alt="Captain"
        />

        <form onSubmit={submitHandler}>
          <h4 className="text-lg text-gray-700 font-medium mb-2">
            What's our Captain's name
          </h4>

          <div className="flex gap-4 mb-5">
            <input
              type="text"
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-[#ffffff] w-1/2 rounded-2xl px-4 py-2 border-none text-lg placeholder:text-base"
            />
            <input
              type="text"
              required
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-[#ffffff] w-1/2 rounded-2xl px-4 py-2 border-none text-lg placeholder:text-base"
            />
          </div>

          <h4 className="text-lg text-gray-700 font-medium mb-2">
            What's our Captain's email
          </h4>

          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#ffffff] mb-5 rounded-2xl px-4 py-2 border-none w-full text-lg placeholder:text-base"
          />

          <h4 className="text-lg text-gray-700 font-medium mb-2">Enter Password</h4>

          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#ffffff] mb-5 rounded-2xl px-4 py-2 border-none w-full text-lg placeholder:text-base"
          />

          <h4 className="text-lg text-gray-700 font-medium mb-2">Vehicle Information</h4>

          <div className="flex gap-4 mb-5">
            <input
              type="text"
              required
              placeholder="Vehicle Color"
              value={vehicleColor}
              onChange={(e) => setVehicleColor(e.target.value)}
              className="bg-[#ffffff] w-1/2 rounded-2xl px-4 py-2 border-none text-lg placeholder:text-base"
            />
            <input
              type="text"
              required
              placeholder="Vehicle Plate"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              className="bg-[#ffffff] w-1/2 rounded-2xl px-4 py-2 border-none text-lg placeholder:text-base"
            />
          </div>

          <div className="flex gap-4 mb-5">
            <input
              type="number"
              required
              placeholder="Vehicle Capacity"
              value={vehicleCapacity}
              onChange={(e) => setVehicleCapacity(e.target.value)}
              className="bg-[#ffffff] w-1/2 rounded-2xl px-4 py-2 border-none text-lg placeholder:text-base"
            />

            <select
              required
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="bg-[#ffffff] w-1/2 rounded-2xl px-4 py-2 border-none text-lg text-gray-700"
            >
              <option value="" disabled>
                Vehicle Type
              </option>
              <option value="car">Car</option>
              <option value="auto">Auto</option>
              <option value="moto">Moto</option>
            </select>
          </div>

          <button
            type="submit"
            className="bg-[#098bf5] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg"
          >
            Create Captain Account
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
         
           <span className="text-gray-700  "> Already have an account? {' '}</span>
          <Link to="/captain-login" className="text-blue-600">
            Login here
          </Link>
        </p>
      </div>

      <div>
        <p className="text-[12px] leading-tight">
          This site is protected by reCAPTCHA and the{' '}
          <span className="underline text-blue-600">
            <a
  href="https://google.com"
  target="_blank"
  rel="noopener noreferrer"
>
Google Privacy Policy
</a></span> and{' '}
          <span className="underline text-blue-600">       <a
  href="https://google.com"
  target="_blank"
  rel="noopener noreferrer"
>
Terms of Service apply
</a></span>.
        </p>
      </div>
    </div>
  )
}

export default CaptainSignup
