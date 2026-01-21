import { useState } from 'react'
import { Link } from 'react-router-dom'

const UserSignup = () => {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const submitHandler = (e) => {
    e.preventDefault()

    const newUser = {
      fullname: {
        firstname: firstName,
        lastname: lastName,
      },
      email,
      password,
    }

    console.log(newUser) // ✅ verify data

    // reset form
    setFirstName('')
    setLastName('')
    setEmail('')
    setPassword('')
  }

  return (
    <div className="p-7 h-screen flex flex-col justify-between bg-[#edfddeec]">
      <div>
        <img
          className="w-32 mb-10"
          src="https://upload.wikimedia.org/wikipedia/en/thumb/0/0f/Ola_Cabs_logo.svg/1280px-Ola_Cabs_logo.svg.png"
          alt="User"
        />

        <form onSubmit={submitHandler}>
          <h3 className="text-lg w-1/2 font-medium mb-2">What's your name</h3>

          <div className="flex gap-4 mb-7">
            <input
              type="text"
              required
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-[#ffffff] border-none  w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-base"
            />

            <input
              type="text"
              required
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-[#ffffff] border-none w-1/2 rounded-lg px-4 py-2 border text-lg placeholder:text-base"
            />
          </div>

          <h3 className="text-lg font-medium mb-2">What's your email</h3>

          <input
            type="email"
            required
            placeholder="email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#ffffff] border-none  mb-7 rounded-2xl px-4 py-2 border w-full text-lg placeholder:text-base"
          />

          <h3 className="text-lg font-medium mb-2">Enter Password</h3>

          <input
            type="password"
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#ffffff] border-none  mb-7 rounded-2xl px-4 py-2 border w-full text-lg placeholder:text-base"
          />

          <button
            type="submit"
            className="bg-[#7fdc0e] text-white font-semibold mb-3 rounded-4xl px-4 py-2 w-full text-lg"
          >
            Create account
          </button>
        </form>

        <p className="text-center text-[15px] font-medium">
          
           <span className="text-gray-700  ">Already have an account? {' '}</span>
          <Link to="/user-login" className="text-blue-600">
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

export default UserSignup
