// MIT License

// Copyright (c) 2019 Issaaf Kattan

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.


import React from "react";
import { Link } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

export const Navigation = () => {
  const { isDark, toggleTheme } = useTheme();

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
          <ul className="nav navbar-nav navbar-right dp-navbar-right">
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
            <li className="dp-navbar-theme-toggle">
              <button
                type="button"
                className="theme-toggle-btn theme-toggle-btn--nav"
                onClick={toggleTheme}
                aria-label={isDark ? "Prepnúť na svetlý režim" : "Prepnúť na tmavý režim"}
                title={isDark ? "Svetlý režim" : "Tmavý režim"}
              >
                <i className={`fa ${isDark ? "fa-sun-o" : "fa-moon-o"}`} aria-hidden="true" />
                <span className="sr-only">{isDark ? "Svetlý režim" : "Tmavý režim"}</span>
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
