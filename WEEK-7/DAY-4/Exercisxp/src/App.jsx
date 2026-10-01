import Exercise from './Exercise.jsx'
import UserFavoriteAnimals from './UserFavoriteAnimals.jsx'
import './App.css'

const user = {
  firstName: 'Bob',
  lastName: 'Dylan',
  favAnimals: ['Horse', 'Turtle', 'Elephant', 'Monkey'],
}

const myelement = <h1 className="jsx-heading">I Love JSX!</h1>
const sum = 5 + 5

function App() {
  return (
    <main className="page-shell">
      <header className="page-header">
        <p className="eyebrow">React fundamentals / 01</p>
        <h1>Learning React, one component at a time.</h1>
        <p className="intro">A small collection of JSX, props, and styling exercises.</p>
      </header>

      <section className="lesson" aria-labelledby="jsx-title">
        <div className="lesson-heading">
          <span className="lesson-number">01</span>
          <div>
            <p className="eyebrow">Exercise 1</p>
            <h2 id="jsx-title">With JSX</h2>
          </div>
        </div>
        <div className="lesson-content jsx-content">
          <p>Hello World!</p>
          {myelement}
          <p>React is {sum} times better with JSX</p>
        </div>
      </section>

      <section className="lesson" aria-labelledby="object-title">
        <div className="lesson-heading">
          <span className="lesson-number">02</span>
          <div>
            <p className="eyebrow">Exercise 2</p>
            <h2 id="object-title">Objects &amp; props</h2>
          </div>
        </div>
        <div className="lesson-content user-content">
          <div className="user-name">
            <h3>{user.firstName}</h3>
            <h3>{user.lastName}</h3>
          </div>
          <UserFavoriteAnimals favAnimals={user.favAnimals} />
        </div>
      </section>

      <section className="lesson" aria-labelledby="tags-title">
        <div className="lesson-heading">
          <span className="lesson-number">03</span>
          <div>
            <p className="eyebrow">Exercise 3</p>
            <h2 id="tags-title">HTML tags in React</h2>
          </div>
        </div>
        <div className="lesson-content">
          <Exercise />
        </div>
      </section>
    </main>
  )
}

export default App;
