import { createContext, useContext, useRef, useState } from 'react'
import './App.css'

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
})

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light')

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'))
  }

  const value = { theme, toggleTheme }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function ThemeSwitcher() {
  const { theme, toggleTheme } = useContext(ThemeContext)

  return (
    <button className="theme-button" onClick={toggleTheme} type="button">
      {theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
    </button>
  )
}

function ThemeCard() {
  const { theme } = useContext(ThemeContext)

  return (
    <div className={`theme-card ${theme}`}>
      <h2>Theme Switcher</h2>
      <p>
        {theme === 'light'
          ? 'You are currently using the light theme.'
          : 'You are currently using the dark theme.'}
      </p>
      <ThemeSwitcher />
    </div>
  )
}

function CharacterCounter() {
  const inputRef = useRef(null)
  const [count, setCount] = useState(0)

  const handleInput = () => {
    setCount(inputRef.current.value.length)
  }

  return (
    <div className="counter-card">
      <h2>Character Counter</h2>
      <input
        ref={inputRef}
        type="text"
        placeholder="Type something..."
        onInput={handleInput}
        aria-label="Text input to count characters"
      />
      <p className="counter-value">Characters: {count}</p>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <main className="app-shell">
        <ThemeCard />
        <CharacterCounter />
      </main>
    </ThemeProvider>
  )
}

export default App
