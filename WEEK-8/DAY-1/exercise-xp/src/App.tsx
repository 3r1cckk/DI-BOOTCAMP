import { Component, type ReactNode } from 'react'
import ErrorBoundary from './components/ErrorBoundary'

type BuggyCounterState = {
  counter: number
}

class BuggyCounter extends Component<object, BuggyCounterState> {
  state: BuggyCounterState = { counter: 0 }

  handleClick = () => {
    this.setState(({ counter }) => ({ counter: counter + 1 }))
  }

  render() {
    if (this.state.counter === 5) {
      throw new Error('I crashed!')
    }

    return (
      <button className="counter-button" onClick={this.handleClick}>
        Counter: {this.state.counter}
        <span>Click to increase</span>
      </button>
    )
  }
}

type LifecycleState = {
  favoriteColor: string
  show: boolean
}

class Child extends Component {
  componentWillUnmount() {
    window.alert('The child component has unmounted.')
  }

  render() {
    return <h3 className="hello-message">Hello World!</h3>
  }
}

class LifecycleDemo extends Component<object, LifecycleState> {
  timerId: number | undefined

  state: LifecycleState = {
    favoriteColor: 'red',
    show: true,
  }

  componentDidMount() {
    window.alert('useEffect reached')
    this.timerId = window.setTimeout(() => {
      this.setState({ favoriteColor: 'yellow' })
    }, 1000)
  }

  shouldComponentUpdate(
    _nextProps: Readonly<object>,
    _nextState: Readonly<LifecycleState>,
  ) {
    return true
  }

  getSnapshotBeforeUpdate(
    _prevProps: Readonly<object>,
    _prevState: Readonly<LifecycleState>,
  ) {
    console.log('in getSnapshotBeforeUpdate')
    return null
  }

  componentDidUpdate(
    _prevProps: Readonly<object>,
    _prevState: Readonly<LifecycleState>,
    _snapshot: null,
  ) {
    console.log('after update')
  }

  componentWillUnmount() {
    if (this.timerId !== undefined) {
      window.clearTimeout(this.timerId)
    }
  }

  changeColor = () => {
    this.setState({ favoriteColor: 'blue' })
  }

  deleteChild = () => {
    this.setState({ show: false })
  }

  render() {
    const { favoriteColor, show } = this.state

    return (
      <div className="lifecycle-demo">
        <div className="color-summary">
          <div className="color-copy">
            <p className="eyebrow">Updating phase</p>
            <h3>
              My favorite color is <span>{favoriteColor}</span>
            </h3>
            <p>
              It starts red, changes to yellow after mounting, and can be
              changed to blue with the button.
            </p>
          </div>
          <div
            className="color-swatch"
            style={{ backgroundColor: favoriteColor }}
            aria-label={`Favorite color: ${favoriteColor}`}
          />
        </div>

        <div className="button-row">
          <button className="primary-button" onClick={this.changeColor}>
            Change color to blue
          </button>
          <button className="secondary-button" onClick={this.deleteChild}>
            Delete child
          </button>
        </div>

        <div className="child-region">
          {show ? (
            <Child />
          ) : (
            <p className="child-removed">The child component was removed.</p>
          )}
        </div>
      </div>
    )
  }
}

type ExerciseSectionProps = {
  number: string
  title: string
  description: string
  children: ReactNode
}

function ExerciseSection({
  number,
  title,
  description,
  children,
}: ExerciseSectionProps) {
  return (
    <section className="exercise-card">
      <div className="section-heading">
        <div className="section-number">{number}</div>
        <div>
          <p className="eyebrow">Exercise {number}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <p className="section-description">{description}</p>
      {children}
    </section>
  )
}

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <p className="eyebrow">React · Week 8 · Day 1</p>
        <h1>Lifecycle &amp; Error Boundaries</h1>
        <p>
          Explore how React handles component errors, updates, and unmounting.
          Open the browser console to follow the lifecycle messages.
        </p>
      </header>

      <ExerciseSection
        number="1"
        title="React Error Boundary Simulation"
        description="Click each counter five times. The first boundary replaces both counters, the second set isolates each counter, and the final counter has no boundary."
      >
        <div className="simulation-grid">
          <article className="simulation-panel">
            <div className="panel-heading">
              <span className="status-dot protected" />
              <h3>One boundary for both</h3>
            </div>
            <p>When either counter crashes, both are replaced.</p>
            <ErrorBoundary>
              <div className="counter-stack">
                <BuggyCounter />
                <BuggyCounter />
              </div>
            </ErrorBoundary>
          </article>

          <article className="simulation-panel">
            <div className="panel-heading">
              <span className="status-dot isolated" />
              <h3>A boundary per counter</h3>
            </div>
            <p>Each counter can fail without affecting the other.</p>
            <div className="counter-stack">
              <ErrorBoundary>
                <BuggyCounter />
              </ErrorBoundary>
              <ErrorBoundary>
                <BuggyCounter />
              </ErrorBoundary>
            </div>
          </article>

          <article className="simulation-panel">
            <div className="panel-heading">
              <span className="status-dot unprotected" />
              <h3>No boundary</h3>
            </div>
            <p>When it crashes, React unmounts the app root.</p>
            <BuggyCounter />
          </article>
        </div>
      </ExerciseSection>

      <ExerciseSection
        number="2–3"
        title="Updating & Unmounting"
        description="The favorite color updates on a timer and through the button. Delete the child to trigger componentWillUnmount."
      >
        <LifecycleDemo />
      </ExerciseSection>

      <footer className="page-footer">
        Built to practice React class component lifecycle methods.
      </footer>
    </main>
  )
}
