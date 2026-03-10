import React from "react";
import { Link } from "react-router-dom";

export const Navigation = () => {
  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleTopClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const scrollEl = document.scrollingElement || document.documentElement;
    try {
      scrollEl.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    } catch (_err) {
      scrollEl.scrollTop = 0;
      scrollEl.scrollLeft = 0;
    }

    // Extra fallback for browsers that still use body for scrolling
    try {
      document.body?.scrollTo?.({ top: 0, left: 0, behavior: "smooth" });
    } catch (_err) {
      if (document.body) document.body.scrollTop = 0;
    }

    // And a final fallback
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  };

  const handleSectionClick = (id) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    scrollToId(id);
    window.history.replaceState(null, "", `/#${id}`);
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
          <a
            className="navbar-brand page-scroll"
            href="#"
            onClick={handleTopClick}
            data-scroll-ignore="true"
          >
            E-psycholog
          </a>
        </div>

        <div
          className="collapse navbar-collapse"
          id="bs-example-navbar-collapse-1"
        >
          <ul className="nav navbar-nav navbar-right">
            <li>
              <a href="#about" onClick={handleSectionClick("about")} className="page-scroll">
                O nás
              </a>
            </li>
            <li>
              <a href="#services" onClick={handleSectionClick("services")} className="page-scroll">
                Služby
              </a>
            </li>
            <li>
              <a href="#trustbox" onClick={handleSectionClick("trustbox")} className="page-scroll">
                Schránka dôvery
              </a>
            </li>
            <li>
              <a href="#portfolio" onClick={handleSectionClick("portfolio")} className="page-scroll">
                Galéria
              </a>
            </li>
            <li>
              <a href="#contact" onClick={handleSectionClick("contact")} className="page-scroll">
                Kontakt
              </a>
            </li>
            <li>
              <Link to="/login" className="page-scroll">
                Prihlásenie
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
