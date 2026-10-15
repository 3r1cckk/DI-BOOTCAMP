import { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from './app/hooks'
import { fetchUser } from './features/user/userSlice'

function App() {
  const dispatch = useAppDispatch()
  const { profile, status, error } = useAppSelector((state) => state.user)

  useEffect(() => {
    void dispatch(fetchUser())
  }, [dispatch])

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            U
          </span>
          <span>People index</span>
        </a>
        <span className="topbar-note">REDUX THUNK EXERCISE</span>
      </header>

      <section className="content" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">A little more about someone</p>
          <h1 id="page-title">User profile<span>.</span></h1>
          <p className="intro-copy">
            Profile data is fetched asynchronously and kept in the Redux store.
          </p>
        </div>

        {status === 'loading' && (
          <div className="state-card" role="status" aria-live="polite">
            <span className="spinner" aria-hidden="true" />
            <div>
              <h2>Finding this person</h2>
              <p>Fetching the latest profile details…</p>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="state-card error-card" role="alert">
            <span className="state-icon" aria-hidden="true">!</span>
            <div className="state-content">
              <h2>We couldn’t load the profile</h2>
              <p>{error}</p>
              <button
                className="button button-primary"
                type="button"
                onClick={() => void dispatch(fetchUser())}
              >
                Try again
              </button>
            </div>
          </div>
        )}

        {status === 'succeeded' && profile && (
          <article className="profile-card">
            <div className="profile-heading">
              <div className="avatar" aria-hidden="true">
                {profile.name
                  .split(' ')
                  .map((part) => part[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div className="profile-name">
                <p className="eyebrow">PROFILE #{profile.id}</p>
                <h2>{profile.name}</h2>
                <p className="username">@{profile.username}</p>
              </div>
              <span className="status-pill">
                <span className="status-dot" />
                Loaded
              </span>
            </div>

            <div className="details-grid">
              <div className="detail">
                <span className="detail-label">Email</span>
                <a href={`mailto:${profile.email}`}>{profile.email}</a>
              </div>
              <div className="detail">
                <span className="detail-label">Phone</span>
                <a href={`tel:${profile.phone}`}>{profile.phone}</a>
              </div>
              <div className="detail">
                <span className="detail-label">Website</span>
                <a
                  href={`https://${profile.website}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {profile.website}
                </a>
              </div>
              <div className="detail">
                <span className="detail-label">City</span>
                <span>{profile.address.city}</span>
              </div>
              <div className="detail detail-company">
                <span className="detail-label">Company</span>
                <span>{profile.company.name}</span>
              </div>
            </div>

            <footer className="card-footer">
              <span>Data provided by JSONPlaceholder</span>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => void dispatch(fetchUser())}
              >
                Refresh profile
                <span aria-hidden="true">↻</span>
              </button>
            </footer>
          </article>
        )}
      </section>
    </main>
  )
}

export default App
