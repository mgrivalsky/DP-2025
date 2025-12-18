import React from "react";

export const HeaderMain = (props) => {
  return (
    <header id="header">
      <div className="intro">
        <div className="overlay">
          <div className="container">
            <div className="row">
              <div className="col-md-8 col-md-offset-2 intro-text">
              <h1 style={{ fontSize: "40px" }}>
                {props.data ? props.data.title : "Loading"}
                <span></span>
              </h1>
                <p style={{ fontSize: "24px", fontWeight: 460 }}>
                  {props.data ? props.data.paragraph : "Loading"}
                </p>
                <a
                  href="#news"
                  className="btn btn-custom btn-lg page-scroll"
                >
                  Zistiť viac
                </a>{" "}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
