import { useState } from "react";
import emailjs from "emailjs-com";
import React from "react";

const initialState = {
  name: "",
  email: "",
  message: "",
};

export const Contact = (props) => {
  const [{ name, email, message }, setState] = useState(initialState);
  const [statusMessage, setStatusMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setState((prevState) => ({ ...prevState, [name]: value }));
  };

  const clearState = () => setState({ ...initialState });

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   emailjs
  //     .sendForm("YOUR_SERVICE_ID", "YOUR_TEMPLATE_ID", e.target, "YOUR_PUBLIC_KEY")
  //     .then(
  //       (result) => {
  //         console.log(result.text);
  //         setStatusMessage("Správa bola úspešne odoslaná.");
  //         setIsSuccess(true);
  //         clearState();
  //       },
  //       (error) => {
  //         console.log(error.text);
  //         setStatusMessage("Nepodarilo sa odoslať správu. Skúste to znova.");
  //         setIsSuccess(false);
  //       }
  //     );
  // };

  const handleSubmit = (e) => {
  e.preventDefault();

  setTimeout(() => {
    console.log("Simulované odoslanie.");
    setStatusMessage("Správa bola úspešne odoslaná.");
    setIsSuccess(true);
    clearState();
 // Skryť správu po 3 sekundách
    setTimeout(() => {
      setStatusMessage("");
    }, 1800);
  }, 1000);
};

  return (
    <div>
      <div id="contact">
        <div className="container">
          <div className="col-md-8">
            <div className="row">
              <div className="section-title">
                <h2>Kontaktujte nás</h2>
                <p>
                  Vyplňte, prosím, nižšie uvedený formulár a pošlite nám e-mail. Ozveme sa vám čo najskôr.
                </p>
              </div>
              <form name="sentMessage" onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="form-control"
                        placeholder="Meno a priezvisko"
                        required
                        value={name}
                        onChange={handleChange}
                      />
                      <p className="help-block text-danger"></p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={handleChange}
                      />
                      <p className="help-block text-danger"></p>
                    </div>
                  </div>
                </div>
                <div className="form-group">
                  <textarea
                    name="message"
                    id="message"
                    className="form-control"
                    rows="4"
                    placeholder="Sem napíšte správu"
                    required
                    value={message}
                    onChange={handleChange}
                  ></textarea>
                  <p className="help-block text-danger"></p>
                </div>
                {statusMessage && (
                  <div
                    className={`alert ${isSuccess ? "alert-success" : "alert-danger"}`}
                    role="alert"
                    style={{ marginTop: "15px" }}
                  >
                    {statusMessage}
                  </div>
                )}
                <button type="submit" className="btn btn-custom btn-lg">
                  Odoslať správu
                </button>
              </form>
            </div>
          </div>
          <div className="col-md-3 col-md-offset-1 contact-info">
            <div className="contact-item">
              <h3>Kontaktné informácie</h3>
              <p>
                <span>
                  <i className="fa fa-map-marker"></i> Adresa
                </span>
                {props.data ? props.data.address : "loading"}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-phone"></i> Telefónne číslo
                </span>{" "}
                {props.data ? props.data.phone : "loading"}
              </p>
            </div>
            <div className="contact-item">
              <p>
                <span>
                  <i className="fa fa-envelope-o"></i> Email
                </span>{" "}
                {props.data ? props.data.email : "loading"}
              </p>
            </div>
          </div>
          <div className="col-md-12">
            <div className="row">
              <div className="social">
                <ul>
                  <li>
                    <a href={props.data ? props.data.facebook : "/"}>
                      <i className="fa fa-facebook"></i>
                    </a>
                  </li>
                  <li>
                    <a href={props.data ? props.data.twitter : "/"}>
                      <i className="fa fa-twitter"></i>
                    </a>
                  </li>
                  <li>
                    <a href={props.data ? props.data.youtube : "/"}>
                      <i className="fa fa-youtube"></i>
                    </a>
                  </li>
                  <li>
                    <a href={props.data ? props.data.spse : "/"}>
                      <i className="fa custom-icon">
                        <img src="/img/contact/download.svg" alt="SPSE" />
                      </i>
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div id="footer">
        <div className="container text-center">
          <p>
            &copy; 2025 E-psycholog. Autory návrhu{" "}
            <a href="http://www.templatewire.com" rel="nofollow">
              TemplateWire
            </a>
            &nbsp;a&nbsp;Matúš Grivalský
          </p>
        </div>
      </div>
    </div>
  );
};
