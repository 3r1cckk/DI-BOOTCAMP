import { Component } from 'react'

const initialFormData = {
  firstName: '',
  lastName: '',
  age: '',
  gender: '',
  destination: '',
  lactoseFree: false,
}

function FormComponent({ values, handleChange }) {
  return (
    <form className="traveler-form" action="/" method="get">
      <div className="name-fields">
        <label className="field">
          <span>First name</span>
          <input
            autoComplete="given-name"
            name="firstName"
            onChange={handleChange}
            placeholder="e.g. John"
            required
            value={values.firstName}
          />
        </label>

        <label className="field">
          <span>Last name</span>
          <input
            autoComplete="family-name"
            name="lastName"
            onChange={handleChange}
            placeholder="e.g. Doe"
            required
            value={values.lastName}
          />
        </label>
      </div>

      <label className="field">
        <span>Age</span>
        <input
          inputMode="numeric"
          min="1"
          name="age"
          onChange={handleChange}
          placeholder="Your age"
          required
          type="number"
          value={values.age}
        />
      </label>

      <fieldset className="choice-field">
        <legend>Gender</legend>
        <div className="choice-row">
          {['male', 'female', 'other'].map((gender) => (
            <label className="choice-option" key={gender}>
              <input
                checked={values.gender === gender}
                name="gender"
                onChange={handleChange}
                required={!values.gender}
                type="radio"
                value={gender}
              />
              <span>{gender[0].toUpperCase() + gender.slice(1)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="field">
        <span>Destination</span>
        <select
          name="destination"
          onChange={handleChange}
          required
          value={values.destination}
        >
          <option disabled value="">
            Choose your destination
          </option>
          <option value="Japan">Japan</option>
          <option value="Brazil">Brazil</option>
          <option value="Kenya">Kenya</option>
          <option value="Switzerland">Switzerland</option>
        </select>
      </label>

      <label className="check-option">
        <input
          checked={values.lactoseFree}
          name="lactoseFree"
          onChange={handleChange}
          type="checkbox"
        />
        <span className="custom-check" aria-hidden="true" />
        <span>I am lactose free</span>
      </label>

      <button className="submit-button" type="submit">
        Submit traveler details
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}

class FormContainer extends Component {
  state = { formData: initialFormData }

  handleChange = (event) => {
    const { name, type, value, checked } = event.target
    const nextValue = type === 'checkbox' ? checked : value

    this.setState(({ formData }) => ({
      formData: {
        ...formData,
        [name]: nextValue,
      },
    }))
  }

  render() {
    const { formData } = this.state

    return (
      <main className="page-shell">
        <header className="topbar">
          <a className="brand" href="/" aria-label="Form & Go home">
            <span className="brand-mark">F</span>
            <span>form<span className="brand-accent">&amp;</span>go</span>
          </a>
          <span className="challenge-tag">REACT FORM CHALLENGE</span>
        </header>

        <section className="intro">
          <div className="intro-copy">
            <p className="eyebrow">A little trip starts here</p>
            <h1>Let’s get to know the <em>traveler.</em></h1>
            <p className="intro-description">
              Fill in your details and watch your traveler card come together
              as you go.
            </p>
          </div>
          <div className="trip-stamp" aria-hidden="true">
            <span>✳</span>
            <small>READY<br />TO ROAM</small>
          </div>
        </section>

        <section className="content-grid" aria-label="Traveler form and preview">
          <div className="form-card">
            <div className="card-heading">
              <div>
                <p className="eyebrow">YOUR DETAILS</p>
                <h2>Traveler info</h2>
              </div>
              <span className="step-label">01 <span>/ 01</span></span>
            </div>

            <FormComponent
              values={formData}
              handleChange={this.handleChange}
            />
          </div>

          <aside className="preview-card" aria-live="polite">
            <div className="preview-topline">
              <span>LIVE PREVIEW</span>
              <span className="live-indicator"><i /> LIVE</span>
            </div>

            <div className="ticket-art" aria-hidden="true">
              <div className="sun" />
              <div className="hill hill-back" />
              <div className="hill hill-front" />
              <span className="ticket-plane">✈</span>
              <span className="ticket-code">TRAVEL PASS · 001</span>
            </div>

            <div className="preview-body">
              <div className="preview-name-block">
                <p className="preview-label">TRAVELER</p>
                <h2>
                  {formData.firstName || formData.lastName
                    ? `${formData.firstName} ${formData.lastName}`.trim()
                    : 'Your name here'}
                </h2>
              </div>

              <div className="preview-details">
                <div>
                  <p className="preview-label">AGE</p>
                  <p>{formData.age || '—'}</p>
                </div>
                <div>
                  <p className="preview-label">GENDER</p>
                  <p className="capitalize">{formData.gender || '—'}</p>
                </div>
              </div>

              <div className="destination-row">
                <div>
                  <p className="preview-label">NEXT DESTINATION</p>
                  <p className="destination-name">
                    {formData.destination || 'Pick a place'}
                  </p>
                </div>
                <span className="destination-arrow" aria-hidden="true">↗</span>
              </div>

              <div className="diet-badge">
                <span className="diet-dot" />
                {formData.lactoseFree ? 'Lactose free' : 'No dietary preference'}
              </div>
            </div>
          </aside>
        </section>

        <footer className="page-footer">
          <span>GOOD DETAILS. GREAT ADVENTURES.</span>
          <span>Built with React state &amp; forms</span>
        </footer>
      </main>
    )
  }
}

export default function App() {
  return <FormContainer />
}
