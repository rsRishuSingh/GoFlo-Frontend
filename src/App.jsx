import React from "react";
import { Route, Routes } from "react-router-dom";
import Start from "./pages/Start";
import UserHome from "./pages/UserHome";
import CaptainHome from "./pages/CaptainHome";
import UserLogin from "./pages/UserLogin";
import UserLogout from "./pages/UserLogout";
import CaptainLogout from "./pages/CaptainLogout";
import UserSignup from "./pages/UserSignup";
import CaptainLogin from "./pages/CaptainLogin";
import CaptainSignup from "./pages/CaptainSignup";
import UserProtectWrapper from "./pages/UserProtectWrapper";
import CaptainProtectWrapper from "./pages/CaptainProtectWrapper";
import UserRiding from "./pages/UserRiding";
import CaptainRiding from "./pages/CaptainRiding";

const App = () => {
  return (
    <div className="max-w-107.5 mx-auto">
      <Routes>
        <Route path="/" element={<Start />} />
        <Route path="/user-login" element={<UserLogin />} />
        <Route path="/user-riding" element={<UserRiding />} />
        <Route path="/captain-riding" element={<CaptainRiding />} />
        <Route path="/user-signup" element={<UserSignup />} />
        <Route path="/captain-login" element={<CaptainLogin />} />
        <Route path="/captain-signup" element={<CaptainSignup />} />
        <Route
          path="/user-home"
          element={
            <UserProtectWrapper>
              <UserHome />
            </UserProtectWrapper>
          }
        />
        <Route
          path="/captain-home"
          element={
            <CaptainProtectWrapper>
              <CaptainHome />
            </CaptainProtectWrapper>
          }
        />
        <Route
          path="/captain-logout"
          element={
            <CaptainProtectWrapper>
              {" "}
              <CaptainLogout />
            </CaptainProtectWrapper>
          }
        />
        <Route
          path="/user-logout"
          element={
            <UserProtectWrapper>
              {" "}
              <UserLogout />
            </UserProtectWrapper>
          }
        />
      </Routes>
    </div>
  );
};

export default App;
