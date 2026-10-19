import Counter from './components/Counter'
import Greeting from './components/Greeting'
import UserCard from './components/UserCard'
import UserList from './components/UserList'

function App() {
  return (
    <div className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="React practice home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>React practice</span>
        </a>
        <nav className="top-nav" aria-label="Exercise navigation">
          <a href="#components">Components</a>
          <a href="#hooks">Hooks</a>
          <a href="#api">API data</a>
        </nav>
        <span className="topbar-tag">Week 10 / Day 1</span>
      </header>

      <main id="top">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-copy">
            <p className="eyebrow"><span className="status-dot" /> A little React practice</p>
            <h1 id="page-title">Learning React,<br />one component at a time<span>.</span></h1>
            <p className="hero-description">
              This week I’m working on TypeScript props, state, and fetching
              data. Here are a few examples to try.
            </p>
            <a className="primary-link" href="#components">
              Jump to the examples <span aria-hidden="true">↓</span>
            </a>
          </div>
          <aside className="hero-note" aria-label="Things to practise">
            <span className="note-label">ON MY LIST</span>
            <strong>Things to practise</strong>
            <ol className="practice-list">
              <li>Pass props to a component</li>
              <li>Update state with a button</li>
              <li>Load a list from an API</li>
            </ol>
          </aside>
        </section>

        <section id="components" className="lesson-section" aria-labelledby="components-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXERCISES 1, 2 & 4</p>
              <h2 id="components-title">Passing props around</h2>
            </div>
            <p className="section-description">
              A couple of small components with typed props. Leave some props
              out and see what the defaults do.
            </p>
          </div>

          <div className="component-grid">
            <article className="panel greeting-panel">
              <div className="panel-heading">
                <span className="step-number">01</span>
                <div>
                  <p className="panel-kicker">TYPED PROPS</p>
                  <h3>Greeting</h3>
                </div>
                <span className="file-label">Greeting.tsx</span>
              </div>
              <Greeting name="Maya" messageCount={3} />
              <p className="panel-footnote">Change the props to see the message update.</p>
            </article>

            <article className="panel user-card-panel">
              <div className="panel-heading">
                <span className="step-number">04</span>
                <div>
                  <p className="panel-kicker">OPTIONAL PROPS</p>
                  <h3>User cards</h3>
                </div>
                <span className="file-label">UserCard.tsx</span>
              </div>
              <div className="user-card-examples">
                <UserCard name="Jordan Lee" age={24} role="UI designer" />
                <UserCard name="Sam Rivera" />
                <UserCard />
              </div>
              <p className="panel-footnote">Omitted props use sensible defaults.</p>
            </article>
          </div>
        </section>

        <section id="hooks" className="lesson-section" aria-labelledby="hooks-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXERCISE 3</p>
              <h2 id="hooks-title">Keeping track of a number</h2>
            </div>
            <p className="section-description">
              Click the buttons and watch the count and last action change.
            </p>
          </div>
          <Counter />
        </section>

        <section id="api" className="lesson-section api-section" aria-labelledby="api-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXERCISE 5</p>
              <h2 id="api-title">Getting users from an API</h2>
            </div>
            <p className="section-description">
              The list loads when the page opens. If the request fails, there’s
              a retry button.
            </p>
          </div>
          <UserList />
        </section>
      </main>

      <footer className="footer">
        <span className="footer-mark" aria-hidden="true">&lt;/&gt;</span>
        <p>React practice · Week 10, Day 1</p>
        <a href="#top">Back to the top</a>
      </footer>
    </div>
  )
}

export default App
