import React from 'react';
import { NavigationMain } from '../user/navigationMain.jsx';
import { HeaderMain } from '../user/headerMain';
import { News } from '../user/news';
import { UserTrustBox } from '../user/UserTrustBox';
import QuickHelp from '../user/QuickHelp';
import ReservationSystem from '../user/ReservationSystem';
import Expert from '../user/Expert.js';
import { Contact } from '../public/contact';
import ChatIconButton from '../user/ChatIconButton';
import JsonData from '../../data/data.json';
import '../styles/AdminComponents.css';

const AdminPreview = ({ setActiveTab }) => {
  return (
    <div className="admin-section full-width">
      <h2>Náhľad stránky - Pohľad užívateľa</h2>
      <p>Takto vidí užívateľ celú stránku:</p>
      <button
        onClick={() => setActiveTab('overview')}
        className="admin-btn admin-btn-secondary admin-preview-back-btn"
      >
        ← Späť na prehľad
      </button>
      <div className="admin-preview-window">
        <div className="admin-preview-content">
          <NavigationMain />
          <HeaderMain data={JsonData.HeaderMain} />
          <News data={JsonData.News} />
          <UserTrustBox data={JsonData.UserTrustBox} />
          <QuickHelp data={JsonData.QuickHelp} />
          <ReservationSystem data={JsonData.ReservationSystem} />
          <Expert data={JsonData.expert} />
          <Contact data={JsonData.Contact} />
          <ChatIconButton />
        </div>
      </div>
    </div>
  );
};

export default AdminPreview;

