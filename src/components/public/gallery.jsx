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



import { Image } from "./image";
import React, { useEffect, useMemo, useState } from "react";
import "../styles/PublicGalleryLightbox.css";

export const Gallery = (props) => {
  const items = useMemo(() => (Array.isArray(props.data) ? props.data : []), [props.data]);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index) => {
    const safeIndex = Math.max(0, Math.min(index, Math.max(items.length - 1, 0)));
    setActiveIndex(safeIndex);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goPrev = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const goNext = () => {
    if (items.length <= 1) return;
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  useEffect(() => {
    if (!lightboxOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxOpen]);

  const active = items[activeIndex] || null;

  return (
    <div id="portfolio" className="text-center">
      <div className="container">
        <div className="section-title">
          <h2>Galéria</h2>
          <p>
            Objavte, ako naša aplikácia funguje v praxi. Prezrite si ukážky jednotlivých funkcií, ktoré sme navrhli tak, aby študentom a školským psychológom uľahčili každodennú prácu. Od jednoduchého plánovania sedení cez anonymnú schránku dôvery až po interaktívny chat – všetko pre lepšiu podporu študentov a efektívnejšiu komunikáciu v školskom prostredí.
          </p>
        </div>
        <div className="row">
          {items.length
            ? items.map((d, i) => (
                <div
                  key={`${d.title}-${i}`}
                  className="col-xs-12 col-sm-6 col-md-4 col-lg-4 portfolio-col"
                >
                  <Image
                    title={d.title}
                    largeImage={d.largeImage}
                    smallImage={d.smallImage}
                    onOpen={() => openLightbox(i)}
                  />
                </div>
              ))
            : "Loading..."}
        </div>
      </div>

      {lightboxOpen && active && (
        <div
          className="public-lightbox-overlay"
          role="dialog"
          aria-modal="true"
          onClick={closeLightbox}
        >
          <div className="public-lightbox-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="public-lightbox-layout">
              <button
                type="button"
                className="public-lightbox-nav public-lightbox-navLeft"
                onClick={goPrev}
                aria-label="Predchádzajúca fotka"
                disabled={items.length <= 1}
              >
                <i className="fa fa-chevron-left" aria-hidden="true" />
              </button>

              <div className="public-lightbox-imageWrap">
                <img
                  className="public-lightbox-image"
                  src={active.largeImage}
                  alt={active.title || "Fotka"}
                />
              </div>

              <button
                type="button"
                className="public-lightbox-nav public-lightbox-navRight"
                onClick={goNext}
                aria-label="Nasledujúca fotka"
                disabled={items.length <= 1}
              >
                <i className="fa fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
