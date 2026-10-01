import React from 'react';
import { Carousel } from 'react-responsive-carousel';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-responsive-carousel/lib/styles/carousel.min.css';
import './style.css';

const destinations = [
  {
    name: 'Hong Kong',
    region: 'China · East Asia',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/jrfyzvgzvhs1iylduuhj.jpg',
  },
  {
    name: 'Macao',
    region: 'China · Pearl River Delta',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/c1cklkyp6ms02tougufx.webp',
  },
  {
    name: 'Japan',
    region: 'East Asia',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/e8fnw35p6zgusq218foj.webp',
  },
  {
    name: 'Las Vegas',
    region: 'Nevada · United States',
    image:
      'https://res.klook.com/image/upload/fl_lossy.progressive,q_65/c_fill,w_480,h_384/cities/liw377az16sxmp9a6ylg.webp',
  },
];

function App() {
  return (
    <main className="container-fluid destination-page">
      <header className="page-header d-flex align-items-center justify-content-between">
        <a className="wordmark" href="#top" aria-label="City Escapes home">
          FIELDNOTE<span>.</span>
        </a>
        <span className="header-note">A collection of city escapes</span>
        <span className="edition">ISSUE 01 / CITY EDITION</span>
      </header>

      <section className="row g-0 align-items-center destination-layout" id="top">
        <div className="col-lg-4 intro-panel">
          <p className="eyebrow">FOUR PLACES <span>—</span> ONE GOOD TRIP</p>
          <h1>Somewhere<br />worth getting<br /><em>lost.</em></h1>
          <p className="intro-copy">
            Four cities, four different rhythms. Find the place that feels like
            your next story.
          </p>
          <div className="selection-note">
            <span className="selection-dot" />
            <span>CURATED PLACES</span>
            <span className="selection-divider" />
            <span>01 — 04</span>
          </div>
        </div>

        <div className="col-lg-8 carousel-panel">
          <Carousel
            ariaLabel="Featured city destinations"
            showThumbs={false}
            showStatus={false}
            showArrows
            infiniteLoop
            swipeable
            emulateTouch
            useKeyboardArrows
            renderIndicator={(onClickHandler, isSelected, index) => (
              <button
                type="button"
                className={`carousel-indicator${isSelected ? ' is-active' : ''}`}
                onClick={onClickHandler}
                aria-label={`Show destination ${index + 1}: ${destinations[index].name}`}
                aria-current={isSelected ? 'true' : undefined}
              >
                {String(index + 1).padStart(2, '0')}
              </button>
            )}
          >
            {destinations.map((destination, index) => (
              <article className="destination-slide" key={destination.name}>
                <img src={destination.image} alt={`${destination.name} cityscape`} />
                <div className="image-shade" />
                <div className="slide-caption">
                  <span className="slide-region">{destination.region}</span>
                  <h2>{destination.name}</h2>
                </div>
                <span className="image-index">
                  {String(index + 1).padStart(2, '0')} / 04
                </span>
              </article>
            ))}
          </Carousel>
          <div className="carousel-footnote">
            <span>SWIPE OR USE THE ARROWS</span>
            <span>YOUR NEXT CITY IS WAITING <span aria-hidden="true">↗</span></span>
          </div>
        </div>
      </section>

      <footer className="page-footer d-flex justify-content-between">
        <span>GO A LITTLE FURTHER.</span>
        <span>FIELDNOTE TRAVEL JOURNAL</span>
      </footer>
    </main>
  );
}

export default App;