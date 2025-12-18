import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const NavigationMain = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav id="menu" className="navbar navbar-default navbar-fixed-top">
      <div className="container">
        <div className="navbar-header">
          <button
            type="button"
            className="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#bs-example-navbar-collapse-1"
          >
            <span className="sr-only">Toggle navigation</span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
            <span className="icon-bar"></span>
          </button>
          <a className="navbar-brand page-scroll" href="#page-top" style={{whiteSpace: 'nowrap'}}>
            E-psycholog
          </a>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <a href="#news" className="page-scroll">
                Čo je nové
              </a>
            </li>
            <li>
              <a href="#testimonials2" className="page-scroll">
                Schránka dôvery
              </a>
            </li>
            <li>
              <a href="#QuickHelp" className="page-scroll">
                Rýchla pomoc
              </a>
            </li>


            <li>
              <a href="#ReservationSystem" className="page-scroll">
                Rezervácia sedení
              </a>
            </li>


              <li>
              <a href="#Expert" className="page-scroll">
                Expertný systém
              </a>
            </li>

            <li>
              <a href="#contact" className="page-scroll">
                Kontakt
              </a>
            </li>
            {user?.role === 'admin' && (
              <li>
                <Link to="/admin" className="page-scroll">
                  Admin Panel
                </Link>
              </li>
            )}
            <li>
              <a onClick={handleLogout} className="page-scroll logout-link" style={{cursor: 'pointer'}}>
                Odhlásiť sa
              </a>
            </li>
            <li>
              <span className="user-name" style={{position: 'relative', top: '4px'}}>👤 {user?.name}</span>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
