import { useState } from 'react'
import { Link } from 'react-router-dom'

const UserLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [userData, setUserData] = useState({})

  const submitHandler = (e) => {
    e.preventDefault()

    const data = {
      email,
      password,
    }

    console.log(data)       
    setUserData(data)        
  }

  return (
    <div className="p-7 h-screen flex flex-col justify-between  bg-[#edfddeec]">
      <div>
        <img
          className="w-32 mb-5"
          src="https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1280px-Ola_Cabs_logo.svg.png"
          alt="Ola Logo"
        />

        <form onSubmit={submitHandler}>
          <h3 className="text-lg font-medium mb-2">Enter your email</h3>

          <input
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#ffffff] mb-7 rounded-2xl border-none px-4 py-2 border w-full text-lg placeholder:text-base"
          />

          <h3 className="text-lg font-medium mb-2">Enter your Password</h3>

          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#ffffff] mb-7 rounded-2xl border-none px-4 py-2 border w-full text-lg placeholder:text-base"
          />

          <button
            type="submit"
            className="bg-[#7fdc0e] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg"
          >
            Login
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
       <span className="text-gray-700  ">New here? {' '}</span>
          <Link to="/user-signup" className="text-blue-500">
            Create new Account
          </Link>
        </p>
      </div>

      <div>
        <Link
          to="/captain-login"
          className="bg-[#098bf5] flex items-center justify-center text-white font-semibold mb-5 rounded-2xl  px-4 py-2 w-full text-lg"
        >
          Sign in as Driver
        </Link>
      </div>
    </div>
  )
}

export default UserLogin
