import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Navigation } from "./components/navigation";
import { NavigationMain } from "./components/navigationMain.jsx";
import { Header } from "./components/header";
import { HeaderMain } from "./components/headerMain";
import { Features } from "./components/features";
import { About } from "./components/about";
import { Services } from "./components/services";
import { Gallery } from "./components/gallery";
import { Testimonials } from "./components/testimonials";
import { Testimonials2 } from "./components/testimonials2";
import { News } from "./components/news";
import { Contact } from "./components/contact";
import LoginPage from "./components/LoginPage";
import ReservationSystem from "./components/ReservationSystem";
import QuickHelp from "./components/QuickHelp";
import Expert from "./components/Expert.js";
import ChatIconButton from "./components/ChatIconButton";
import { UserDashboard } from "./components/UserDashboard";
import { AdminDashboard } from "./components/AdminDashboard";
import { ProtectedRoute, PublicRoute } from "./components/ProtectedRoute";
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
    <Testimonials data={data.Testimonials} />
    <Gallery data={data.Gallery} />
    <Contact data={data.Contact} />
  </>
);

const MainPage = ({ data }) => (
  <>
    <NavigationMain />
    <HeaderMain data={data.HeaderMain} />
    <News data={data.News} />
    <Testimonials2 data={data.Testimonials2} />
    <QuickHelp data={data.QuickHelp} />
    <ReservationSystem data={data.ReservationSystem} />
    <Expert data={data.expert} />
    <Contact data={data.Contact} />
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
                <AdminDashboard />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
