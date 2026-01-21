import { useState } from 'react'
import { Link } from 'react-router-dom'

function CaptainLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [captainData, setCaptainData] = useState({})

  const submitHandler = (e) => {
    e.preventDefault()

    const data = {
      email,
      password,
    }

    console.log(data)          
    setCaptainData(data)      
  }

  return (
    <div className="p-7 h-screen flex flex-col justify-between bg-[#edfddeec]">
      <div>
        <img
          className="w-32 mb-3"
          src="https://1000logos.net/wp-content/uploads/2022/08/Ola-Cabs-Logo-768x432.png"
          alt="Captain"
        />

        <form onSubmit={submitHandler}>
          <h3 className="text-lg font-medium mb-2">What's your email</h3>

          <input
            type="email"
            required
             name="email"
            autoComplete="current-email"
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#ffffff] mb-7 rounded-2xl px-4 py-2 border-none w-full text-lg placeholder:text-base"
          />

          <h3 className="text-lg font-medium mb-2">Enter Password</h3>

          <input
            type="password"
            required
             name="password"
            autoComplete="current-password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#ffffff] mb-7 rounded-2xl px-4 py-2 border-none w-full text-lg placeholder:text-base"
          />

          <button
            type="submit"
            className="bg-[#098bf5] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg"
          >
            Login
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
           <span className="text-gray-700  "> Join our fleet? {' '}</span>
         
          <Link to="/captain-signup" className="text-blue-600">
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
  )
}

export default CaptainLogin
