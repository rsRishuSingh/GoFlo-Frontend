import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Start from './pages/Start'
import UserLogin from './pages/UserLogin'
import UserSignup from './pages/UserSignup'
import CaptainLogin from './pages/CaptainLogin'
import CaptainSignup from './pages/CaptainSignup'
import UserContext from './context/UserContext'

const App = () => {
  return (
    <div className='max-w-107.5 mx-auto'>
      <UserContext>
        <Routes>
          <Route path='/' element={<Start />} />
          <Route path='/user-login' element={<UserLogin />} />
          <Route path='/user-signup' element={<UserSignup />} />
          <Route path='/captain-login' element={<CaptainLogin />} />
          <Route path='/captain-signup' element={<CaptainSignup />} />
        </Routes>
      </UserContext>
    </div>
  )
}

export default App
