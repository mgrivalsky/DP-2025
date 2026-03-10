import React from "react";

export const Image = ({ title, largeImage, smallImage, onOpen }) => {
  return (
    <div className="portfolio-item">
      <div className="hover-bg">
        {" "}
        <button
          type="button"
          className="public-gallery-thumb"
          title={title}
          onClick={onOpen}
        >
          <div className="hover-text">
            <h4>{title}</h4>
          </div>
          <img src={smallImage} className="img-responsive" alt={title} />{" "}
        </button>{" "}
      </div>
    </div>
  );
};
