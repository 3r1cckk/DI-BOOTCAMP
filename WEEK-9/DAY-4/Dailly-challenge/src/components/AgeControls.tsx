import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  ageDownAsync,
  ageUpAsync,
} from '../features/age/ageSlice'

function AgeControls() {
  const dispatch = useAppDispatch()
  const { age, loading } = useAppSelector((state) => state.age)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
  }

  return (
    <form className="controls" onSubmit={handleSubmit}>
      <p className="section-label">MAKE AN ADJUSTMENT</p>
      <div className="control-buttons">
        <button
          className="age-button age-button-down"
          type="button"
          disabled={loading || age === 0}
          onClick={() => void dispatch(ageDownAsync())}
        >
          <span className="button-icon" aria-hidden="true">−</span>
          <span>Age Down</span>
        </button>
        <button
          className="age-button age-button-up"
          type="button"
          disabled={loading}
          onClick={() => void dispatch(ageUpAsync())}
        >
          <span>Age Up</span>
          <span className="button-icon" aria-hidden="true">+</span>
        </button>
      </div>
      <p className="control-hint">Each update takes a little moment to process.</p>
    </form>
  )
}

export default AgeControls
