import { useState, useContext } from 'react'
import { Link } from 'react-router-dom'
import { UserDataContext } from '../context/UserContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const UserLogin = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({ email: '', password: '' })

  const { setUser } = useContext(UserDataContext)
  const navigate = useNavigate()

  const validate = () => {
    let isValid = true
    const newErrors = { email: '', password: '' }

    if (!email) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Invalid email format'
      isValid = false
    }

    if (!password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const submitHandler = async (e) => {
    e.preventDefault()
    
    if (!validate()) return

    const userData = { email, password }

    try {
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/login`, userData)

      if (response.status === 200) {
        const data = response.data
        setUser(data.user)
        localStorage.setItem('userToken', data.userToken)
        navigate('/user-home')
      }
    } catch (err) {
      if (err.response && err.response.data.message) {
        setErrors(prev => ({ ...prev, email: err.response.data.message }))
      }
    }
  }

  return (
    <div className="p-7 h-screen flex flex-col justify-between bg-[#edfddeec]">
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
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => {
                setEmail(e.target.value)
                if(errors.email) setErrors({...errors, email: ''}) 
            }}
            className="bg-[#ffffff] rounded-2xl border-none px-4 py-2 border w-full text-lg placeholder:text-base"
          />
         
          <div className="min-h-6.25 mb-2">
            {errors.email && <p className="text-red-500 text-sm px-2">{errors.email}</p>}
          </div>

          <h3 className="text-lg font-medium mb-2">Enter your Password</h3>
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={(e) => {
                setPassword(e.target.value)
                if(errors.password) setErrors({...errors, password: ''}) 
            }}
            className="bg-[#ffffff] rounded-2xl border-none px-4 py-2 border w-full text-lg placeholder:text-base"
          />
         <div className="min-h-6.25 mb-2">
            {errors.password && <p className="text-red-500 text-sm px-2">{errors.password}</p>}
          </div>

          <button
            type="submit"
            className="bg-[#7fdc0e] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg active:scale-95 transition-transform"
          >
            Login
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
          <span className="text-gray-700">New here? </span>
          <Link to="/user-signup" className="text-blue-500">
            Create new Account
          </Link>
        </p>
      </div>

      <div>
        <Link
          to="/captain-login"
          className="bg-[#098bf5] flex items-center justify-center text-white font-semibold mb-5 rounded-2xl px-4 py-2 w-full text-lg"
        >
          Sign in as Driver
        </Link>
      </div>
    </div>
  )
}

export default UserLogin