const matrixPattern = document.querySelector('#matrixPattern')
const matrixCharacters =
  'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレワABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

for (let index = 0; index < 40; index += 1) {
  const column = document.createElement('span')
  column.className = 'matrix-column'
  column.textContent = Array.from(
    { length: 26 },
    () => matrixCharacters[Math.floor(Math.random() * matrixCharacters.length)],
  ).join('')
  column.dataset.column = String(index + 1)
  matrixPattern?.append(column)
}

const authForm = document.querySelector('#authForm')
const authFormPanel = document.querySelector('#authFormPanel')
const profilePanel = document.querySelector('#profilePanel')
const formMessage = document.querySelector('#formMessage')
const profileMessage = document.querySelector('#profileMessage')
const registerTab = document.querySelector('#registerTab')
const loginTab = document.querySelector('#loginTab')
const authHeading = document.querySelector('#authHeading')
const authSubheading = document.querySelector('#authSubheading')
const authEyebrow = document.querySelector('#authEyebrow')
const emailField = document.querySelector('#emailField')
const usernameLabel = document.querySelector('#usernameLabel')
const submitButton = document.querySelector('#submitButton')

let mode = 'register'
let refreshTimer

registerTab.addEventListener('click', () => setMode('register'))
loginTab.addEventListener('click', () => setMode('login'))

authForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  showMessage(formMessage, '')

  const formData = new FormData(authForm)
  const username = String(formData.get('username') ?? '').trim()
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')

  if (mode === 'register' && !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    showMessage(formMessage, 'Use 3–24 letters, numbers, or underscores for your username.')
    return
  }
  if (mode === 'login' && !username) {
    showMessage(formMessage, 'Enter your username or email address.')
    return
  }

  if (mode === 'register' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    showMessage(formMessage, 'Enter a valid email address.')
    return
  }

  if (mode === 'register' && (password.length < 12 || !/[a-zA-Z]/.test(password) || !/\d/.test(password))) {
    showMessage(formMessage, 'Use at least 12 characters, including a letter and a number.')
    return
  }

  const body =
    mode === 'register'
      ? { username, email, password }
      : { login: username, password }

  setBusy(true)
  try {
    const result = await requestJson(`/api/auth/${mode}`, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    authForm.reset()
    await showProfile(result.user)
  } catch (error) {
    showMessage(formMessage, error.message)
  } finally {
    setBusy(false)
  }
})

document.querySelector('#profileForm').addEventListener('submit', async (event) => {
  event.preventDefault()
  showMessage(profileMessage, '')
  const username = String(new FormData(event.currentTarget).get('username') ?? '').trim()

  if (!/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
    showMessage(profileMessage, 'Use 3–24 letters, numbers, or underscores.')
    return
  }

  try {
    const result = await requestJson('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ username }),
    })
    updateProfile(result.user)
    showMessage(profileMessage, 'Username updated.')
  } catch (error) {
    if (error.status === 401) {
      await tryRefresh()
      return
    }
    showMessage(profileMessage, error.message)
  }
})

document.querySelector('#logoutButton').addEventListener('click', async () => {
  try {
    await requestJson('/api/auth/logout', { method: 'POST' })
    clearTimeout(refreshTimer)
    showAuth()
    setMode('login')
    showMessage(formMessage, 'You’re signed out.')
  } catch (error) {
    showMessage(profileMessage, `Could not sign out: ${error.message}`)
  }
})

function setMode(nextMode) {
  mode = nextMode
  const registering = mode === 'register'
  registerTab.classList.toggle('is-active', registering)
  loginTab.classList.toggle('is-active', !registering)
  registerTab.setAttribute('aria-selected', String(registering))
  loginTab.setAttribute('aria-selected', String(!registering))
  emailField.hidden = !registering
  emailField.querySelector('input').required = registering
  usernameLabel.textContent = registering ? 'Username' : 'Username or email'
  document.querySelector('#username').maxLength = registering ? 24 : 254
  document.querySelector('#username').placeholder = registering ? 'e.g. alex_cooks' : 'Your username or email'
  document.querySelector('#password').autocomplete = registering ? 'new-password' : 'current-password'
  document.querySelector('#password').placeholder = registering ? 'At least 12 characters' : 'Your password'
  authHeading.textContent = registering ? 'Make an account.' : 'Welcome back.'
  authSubheading.textContent = registering
    ? 'Register, then try the protected profile route.'
    : 'Sign in to visit your protected profile.'
  authEyebrow.textContent = registering ? 'YOUR LOCAL AUTH PLAYGROUND' : 'GOOD TO SEE YOU AGAIN'
  submitButton.querySelector('span:first-child').textContent = registering ? 'Create account' : 'Sign in'
  document.querySelector('#authFormPanel').setAttribute('aria-labelledby', registering ? 'registerTab' : 'loginTab')
  showMessage(formMessage, '')
}

async function showProfile(user) {
  updateProfile(user)
  authFormPanel.hidden = true
  profilePanel.hidden = false
  authHeading.textContent = 'Your profile.'
  authSubheading.textContent = 'This page came from a protected route.'
  authEyebrow.textContent = 'ACCESS TOKEN VERIFIED'
  document.querySelector('.tabs').hidden = true
  await loadProfile()
  scheduleRefresh()
}

async function loadProfile() {
  try {
    const result = await requestJson('/api/profile')
    updateProfile(result.user)
  } catch (error) {
    if (error.status === 401) {
      const refreshed = await tryRefresh()
      if (refreshed) return loadProfile()
      showAuth()
      setMode('login')
      showMessage(formMessage, 'Your session ended. Please sign in again.')
      return
    }
    showMessage(profileMessage, error.message)
  }
}

async function tryRefresh() {
  try {
    await requestJson('/api/auth/refresh', { method: 'POST' })
    scheduleRefresh()
    return true
  } catch {
    clearTimeout(refreshTimer)
    showAuth()
    setMode('login')
    showMessage(formMessage, 'Your session ended. Please sign in again.')
    return false
  }
}

function scheduleRefresh() {
  clearTimeout(refreshTimer)
  refreshTimer = window.setTimeout(() => {
    void tryRefresh()
  }, 10 * 60 * 1000)
}

function updateProfile(user) {
  document.querySelector('#profileAvatar').textContent = user.username.slice(0, 1).toUpperCase()
  document.querySelector('#profileHeading').textContent = `Welcome, ${user.username}.`
  document.querySelector('#profileUsername').textContent = user.username
  document.querySelector('#profileEmail').textContent = user.email
  document.querySelector('#profileCreated').textContent = user.created_at
    ? new Date(`${user.created_at.replace(' ', 'T')}Z`).toLocaleDateString()
    : 'Today'
  document.querySelector('#newUsername').value = user.username
}

function showAuth() {
  profilePanel.hidden = true
  authFormPanel.hidden = false
  document.querySelector('.tabs').hidden = false
  authHeading.textContent = mode === 'register' ? 'Make an account.' : 'Welcome back.'
  authEyebrow.textContent = mode === 'register' ? 'YOUR LOCAL AUTH PLAYGROUND' : 'GOOD TO SEE YOU AGAIN'
  authSubheading.textContent =
    mode === 'register'
      ? 'Register, then try the protected profile route.'
      : 'Sign in to visit your protected profile.'
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    credentials: 'same-origin',
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  })

  let payload = {}
  try {
    payload = await response.json()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('The server sent a response we could not read.')
    }
    throw error
  }

  if (!response.ok) {
    const requestError = new Error(payload.error || `The request failed (${response.status}).`)
    requestError.status = response.status
    throw requestError
  }
  return payload
}

function showMessage(element, message) {
  element.textContent = message
  element.hidden = !message
}

function setBusy(busy) {
  submitButton.disabled = busy
  submitButton.querySelector('span:first-child').textContent = busy
    ? 'One moment…'
    : mode === 'register'
      ? 'Create account'
      : 'Sign in'
}

async function restoreSession() {
  try {
    const result = await requestJson('/api/profile')
    await showProfile(result.user)
  } catch (error) {
    if (error.status === 401) await tryRefresh()
    else showMessage(formMessage, error.message)
  }
}

void restoreSession()
