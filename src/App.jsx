import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Start from './pages/Start'
import Home from  './pages/Home'
import UserLogin from './pages/UserLogin'
import UserLogout from './pages/UserLogout'
import UserSignup from './pages/UserSignup'
import CaptainLogin from './pages/CaptainLogin'
import CaptainSignup from './pages/CaptainSignup'
import UserContext from './context/UserContext'
import UserProtectWrapper from './pages/userProtectWrapper'
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
          <Route path='/home' element={<UserProtectWrapper><Home /></UserProtectWrapper>}/>
          <Route path='/user/logout' element={<UserProtectWrapper> <UserLogout /></UserProtectWrapper>}/>
        </Routes>
      </UserContext>
    </div>
  )
}

export default App
