import React from "react";
import { Link } from "react-router-dom";

export const NavigationMain = () => {
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
          <a className="navbar-brand page-scroll" href="#page-top">
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
            <li>
              <Link to="/" className="page-scroll">
                Odhlásenie
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
