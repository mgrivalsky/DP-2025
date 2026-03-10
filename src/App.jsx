import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public components (landing page)
import { Navigation } from "./components/public/navigation";
import { Header } from "./components/public/header";
import { About } from "./components/public/about";
import { Services } from "./components/public/services";
import { Gallery } from "./components/public/gallery";
import { TrustBox } from "./components/public/TrustBox";
import { Contact } from "./components/public/contact";

// User components (authenticated users)
import { NavigationMain } from "./components/user/navigationMain.jsx";
import { HeaderMain } from "./components/user/headerMain";
import { UserTrustBox } from "./components/user/UserTrustBox";
import { News } from "./components/user/news";
import ReservationSystem from "./components/user/ReservationSystem";
import QuickHelp from "./components/user/QuickHelp";
import Expert from "./components/user/Expert.js";
import ChatIconButton from "./components/user/ChatIconButton";
import PsychologChatFloating from "./components/admin/PsychologChatFloating";
import PsychologChat from "./components/admin/PsychologChat";
import UserHistory from "./components/user/UserHistory";
import { Chat } from "./components/user/Chat";

// Admin components
import Admin from "./components/admin/Admin";

// Auth components
import LoginPage from "./components/auth/LoginPage";
import { ProtectedRoute, PublicRoute } from "./components/auth/ProtectedRoute";

import { AuthProvider } from "./context/AuthContext";

import SmoothScroll from "smooth-scroll";
import "./App.css";
import JsonData from "./data/data.json";

export const scroll = new SmoothScroll('a[href*="#"]', {
  speed: 1000,
  speedAsDuration: true,
});

const LandingPage = ({ data }) => (
  <>
    <Navigation />
    <Header data={data.Header} />
    <About data={data.About} />
    <Services data={data.Services} />
    <TrustBox data={data.TrustBox} />
    <Gallery data={data.Gallery} />
    <Contact data={data.Contact} />
  </>
);

const MainPage = ({ data }) => (
  <>
    <NavigationMain />
    <HeaderMain data={data.HeaderMain} />
    <News data={data.News} />
    <UserTrustBox data={data.UserTrustBox} />
    <QuickHelp data={data.QuickHelp} />
    <ReservationSystem data={data.ReservationSystem} />
    <Expert data={data.expert} />
    {/* <Contact data={data.Contact} /> */}
    <ChatIconButton />
  </>
);

const App = () => {
  const [landingPageData, setLandingPageData] = useState({});

  useEffect(() => {
    setLandingPageData(JsonData);
  }, []);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Verejná stránka - landing page */}
          <Route path="/" element={<LandingPage data={landingPageData} />} />
          
          {/* Prihlásenie - dostupné len pre neprihlásených */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          {/* Užívateľské rozhranie - scrollovacia stránka pre prihlásených užívateľov */}
          <Route 
            path="/home" 
            element={
              <ProtectedRoute requiredRole="user">
                <MainPage data={landingPageData} />
              </ProtectedRoute>
            } 
          />
          
          {/* Admin rozhranie - len pre adminov */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <Admin />
              </ProtectedRoute>
            } 
          />
          
          {/* Ostatné chránené cesty */}
          <Route 
            path="/reservations" 
            element={
              <ProtectedRoute>
                <ReservationSystem data={landingPageData.ReservationSystem} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/quick-help" 
            element={
              <ProtectedRoute>
                <QuickHelp data={landingPageData.QuickHelp} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/expert" 
            element={
              <ProtectedRoute>
                <Expert data={landingPageData.expert} />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/news" 
            element={
              <ProtectedRoute>
                <MainPage data={landingPageData} />
              </ProtectedRoute>
            } 
          />

          <Route
            path="/history"
            element={
              <ProtectedRoute requiredRole="user">
                <UserHistory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <Chat />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
