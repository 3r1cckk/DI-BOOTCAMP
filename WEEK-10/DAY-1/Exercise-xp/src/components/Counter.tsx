import { useState } from 'react'

type CounterAction = 'incremented' | 'decremented' | null

function Counter() {
  const [count, setCount] = useState<number>(0)
  const [lastAction, setLastAction] = useState<CounterAction>(null)

  function increment() {
    setCount((currentCount) => currentCount + 1)
    setLastAction('incremented')
  }

  function decrement() {
    setCount((currentCount) => currentCount - 1)
    setLastAction('decremented')
  }

  return (
    <article className="panel counter-panel">
      <div className="panel-heading">
        <span className="step-number">03</span>
        <div>
          <p className="panel-kicker">TYPED STATE</p>
          <h3>Counter</h3>
        </div>
        <span className="file-label">Counter.tsx</span>
      </div>
      <div className="counter-content">
        <div className="counter-display" aria-live="polite" aria-atomic="true">
          <span className="counter-label">CURRENT COUNT</span>
          <output className="counter-value">{count}</output>
          <span className="counter-action">
            {lastAction ? `Last action: ${lastAction}` : 'Ready when you are'}
          </span>
        </div>
        <div className="counter-controls" aria-label="Counter controls">
          <button
            className="counter-button secondary-button"
            type="button"
            onClick={decrement}
            aria-label="Decrement counter"
          >
            <span aria-hidden="true">−</span> Decrement
          </button>
          <button
            className="counter-button primary-button"
            type="button"
            onClick={increment}
            aria-label="Increment counter"
          >
            <span aria-hidden="true">+</span> Increment
          </button>
        </div>
      </div>
    </article>
  )
}

export default Counter
