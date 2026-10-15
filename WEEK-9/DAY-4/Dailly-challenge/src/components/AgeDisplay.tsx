import { useAppSelector } from '../app/hooks'

function AgeDisplay() {
  const { age, loading } = useAppSelector((state) => state.age)

  return (
    <section
      className={`age-card${loading ? ' is-loading' : ''}`}
      aria-labelledby="age-heading"
      aria-busy={loading}
      aria-live="polite"
    >
      <div className="age-card-topline">
        <span className="age-card-label">YOUR CURRENT AGE</span>
        <span className={`update-indicator${loading ? ' is-visible' : ''}`}>
          <span className="spinner" aria-hidden="true" />
          Updating
        </span>
      </div>
      <div className="age-value-wrap">
        <span className="age-value" id="age-heading">
          {age}
        </span>
        <span className="age-unit">years old</span>
      </div>
      <div className="age-progress" aria-hidden="true">
        <span />
      </div>
      <p className="age-caption">
        {loading ? 'One moment while we update your age.' : 'One year at a time.'}
      </p>
    </section>
  )
}

export default AgeDisplay
