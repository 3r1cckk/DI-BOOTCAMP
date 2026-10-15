import AgeControls from './components/AgeControls'
import AgeDisplay from './components/AgeDisplay'

function App() {
  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            a
          </span>
          <span>little by little</span>
        </a>
        <span className="topbar-note">A PERSONAL AGE TRACKER</span>
      </header>

      <section className="content" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">TIME, IN YOUR HANDS</p>
          <h1 id="page-title">
            Age Tracker<span>.</span>
          </h1>
          <p className="intro-copy">
            A small reminder that every year is worth counting.
          </p>
        </div>

        <AgeDisplay />
        <AgeControls />

        <footer className="page-footer">
          <span className="footer-mark" aria-hidden="true">✳</span>
          <span>One year at a time. No rush.</span>
        </footer>
      </section>
    </main>
  )
}

export default App
