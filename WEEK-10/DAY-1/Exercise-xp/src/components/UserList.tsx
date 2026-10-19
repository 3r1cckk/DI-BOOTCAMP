import { useEffect, useState } from 'react'

interface User {
  id: number
  name: string
  username: string
  email: string
  company: {
    name: string
  }
}

function isUser(value: unknown): value is User {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const user = value as Record<string, unknown>
  const company = user.company

  return (
    typeof user.id === 'number' &&
    typeof user.name === 'string' &&
    typeof user.username === 'string' &&
    typeof user.email === 'string' &&
    typeof company === 'object' &&
    company !== null &&
    'name' in company &&
    typeof company.name === 'string'
  )
}

function isUserList(value: unknown): value is User[] {
  return Array.isArray(value) && value.every(isUser)
}

function UserList() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState<number>(0)

  useEffect(() => {
    const controller = new AbortController()

    async function loadUsers() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(
          'https://jsonplaceholder.typicode.com/users',
          { signal: controller.signal },
        )

        if (!response.ok) {
          throw new Error(`The server responded with status ${response.status}.`)
        }

        const payload: unknown = await response.json()
        if (!isUserList(payload)) {
          throw new Error('The server returned user data in an unexpected format.')
        }

        setUsers(payload)
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return
        }

        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'An unexpected error occurred while loading users.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void loadUsers()

    return () => controller.abort()
  }, [retryCount])

  return (
    <article className="panel user-list-panel">
      <div className="panel-heading user-list-heading">
        <span className="step-number">05</span>
        <div>
          <p className="panel-kicker">DATA FROM JSONPLACEHOLDER</p>
          <h3>Community members</h3>
        </div>
        {!isLoading && !error && (
          <span className="member-count">{users.length} members</span>
        )}
      </div>

      {isLoading && (
        <div className="list-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden="true" />
          <div>
            <strong>Finding the community...</strong>
            <p>Fetching the latest user list.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="error-state" role="alert">
          <span className="error-icon" aria-hidden="true">!</span>
          <div>
            <strong>We couldn’t load the users.</strong>
            <p>{error}</p>
          </div>
          <button
            className="retry-button"
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && (
        <ul className="user-list">
          {users.map((user) => (
            <li className="api-user" key={user.id}>
              <span className="api-avatar" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <div className="api-user-info">
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <span className="company-tag">{user.company.name}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}

export default UserList
