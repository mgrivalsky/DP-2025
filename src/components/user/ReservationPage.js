import React from "react";
import { NavigationMain } from "./navigationMain.jsx";
import ReservationSystem from "./ReservationSystem.js";

const ReservationPage = ({ data }) => {
  return (
    <>
      <NavigationMain />
      <ReservationSystem />
    </>
  );
};

export default ReservationPage;