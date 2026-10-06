import { useState } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import ErrorBoundary from './ErrorBoundary.jsx'
import Example1 from './components/Example1.jsx'
import Example2 from './components/Example2.jsx'
import Example3 from './components/Example3.jsx'
import PostList from './components/PostList.jsx'

function HomeScreen() {
  return <h2 className="screen-heading">Home Screen</h2>
}

function ProfileScreen() {
  return <h2 className="screen-heading">Profile Screen</h2>
}

function ShopScreen() {
  throw new Error('Shop screen render error')
}

const postData = {
  key1: 'myusername',
  email: 'mymail@gmail.com',
  name: 'Isaac',
  lastname: 'Doe',
  age: 27,
}

function JsonPostForm() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      })
      const responseText = await response.text()
      const responseBody = responseText
        ? (() => {
            try {
              return JSON.parse(responseText)
            } catch {
              return responseText
            }
          })()
        : null

      if (!response.ok) {
        throw new Error(`Webhook request failed: ${response.status} ${response.statusText}`)
      }

      console.log('Webhook response:', responseBody)
      setMessage(`Request completed with status ${response.status}. See the console for the response.`)
    } catch (error) {
      console.error('Could not send the JSON data:', error)
      setMessage(error instanceof Error ? error.message : 'Could not send the JSON data.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="webhook-form" onSubmit={handleSubmit}>
      <label className="form-label" htmlFor="webhook-url">
        Your webhook.site unique URL
      </label>
      <div className="webhook-controls">
        <input
          autoComplete="url"
          className="form-control"
          id="webhook-url"
          onChange={(event) => setWebhookUrl(event.target.value)}
          placeholder="https://webhook.site/your-unique-id"
          required
          type="url"
          value={webhookUrl}
        />
        <button className="btn btn-primary" disabled={isSubmitting} type="submit">
          {isSubmitting ? 'Sending…' : 'Send JSON'}
        </button>
      </div>
      {message && <p className="post-status" role="status">{message}</p>}
    </form>
  )
}

function DataSection({ number, title, children }) {
  return (
    <section className="content-card">
      <div className="card-title-row">
        <p className="section-kicker">EXERCISE {number}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="site-header">
          <div className="container page-container">
            <p className="eyebrow">WEEK 8 · DAY 2</p>
            <h1>React state, routes &amp; JSON</h1>
            <p className="header-copy">
              Practice error boundaries, nested JSON rendering, and sending JSON with fetch.
            </p>
          </div>
        </header>

        <nav className="navbar navbar-expand navbar-dark app-navbar">
          <div className="container page-container">
            <span className="navbar-brand">Router demo</span>
            <div className="navbar-nav">
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} end to="/">
                Home
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/profile">
                Profile
              </NavLink>
              <NavLink className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`} to="/shop">
                Shop
              </NavLink>
            </div>
          </div>
        </nav>

        <main className="container page-container main-content">
          <section className="content-card route-card">
            <p className="section-kicker">EXERCISE 1 · REACT ROUTER</p>
            <Routes>
              <Route
                element={<ErrorBoundary><HomeScreen /></ErrorBoundary>}
                path="/"
              />
              <Route
                element={<ErrorBoundary><ProfileScreen /></ErrorBoundary>}
                path="/profile"
              />
              <Route
                element={<ErrorBoundary><ShopScreen /></ErrorBoundary>}
                path="/shop"
              />
            </Routes>
          </section>

          <DataSection number="2" title="Posts from JSON">
            <PostList />
          </DataSection>

          <DataSection number="3" title="Parsing nested JSON">
            <div className="data-grid">
              <section>
                <h3 className="subsection-title">Social medias</h3>
                <Example1 />
              </section>
              <section>
                <h3 className="subsection-title">Skills</h3>
                <Example2 />
              </section>
              <section className="experience-section">
                <h3 className="subsection-title">Experiences</h3>
                <Example3 />
              </section>
            </div>
          </DataSection>

          <DataSection number="4" title="POST JSON data">
            <p className="section-description">
              Paste your unique webhook.site URL below. Enable CORS on webhook.site before sending.
            </p>
            <JsonPostForm />
          </DataSection>
        </main>
      </div>
    </BrowserRouter>
  )
}
