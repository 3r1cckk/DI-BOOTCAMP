import Car from './Components/Car.jsx';
import Events from './Components/Events.jsx';
import Phone from './Components/Phone.jsx';
import Color from './Components/Color.jsx';

const carinfo = { name: 'Ford', model: 'Mustang' };

function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <a className="wordmark" href="#top">REACT LAB<span>.</span></a>
        <span className="header-note">WEEK 7 / DAY 5</span>
      </header>

      <section className="intro" id="top">
        <p className="eyebrow">JSX · COMPONENTS · STATE · EFFECTS</p>
        <h1>React, in<br /><em>practice.</em></h1>
        <p className="intro-copy">
          A small collection of interactive exercises exploring components,
          events, state and the React lifecycle.
        </p>
      </section>

      <section className="exercise-grid" aria-label="React exercises">
        <article className="exercise-card">
          <div className="card-heading">
            <span className="exercise-number">01</span>
            <h2>Car &amp; Garage</h2>
          </div>
          <Car carInfo={carinfo} />
        </article>

        <article className="exercise-card">
          <div className="card-heading">
            <span className="exercise-number">02</span>
            <h2>Event handlers</h2>
          </div>
          <Events />
        </article>

        <article className="exercise-card">
          <div className="card-heading">
            <span className="exercise-number">03</span>
            <h2>Phone state</h2>
          </div>
          <Phone />
        </article>

        <article className="exercise-card">
          <div className="card-heading">
            <span className="exercise-number">04</span>
            <h2>useEffect</h2>
          </div>
          <Color />
        </article>
      </section>

      <footer className="page-footer">
        <span>BUILD IT. CLICK IT. LEARN IT.</span>
        <span>REACT EXERCISES XP</span>
      </footer>
    </main>
  );
}

export default App;
