import { useState } from 'react'
import './App.css'

const initialLanguages = [
  { name: 'PHP', votes: 0 },
  { name: 'Python', votes: 0 },
  { name: 'JavaScript', votes: 0 },
  { name: 'Java', votes: 0 },
]

function App() {
  const [languages, setLanguages] = useState(initialLanguages)
  const totalVotes = languages.reduce((total, language) => total + language.votes, 0)

  function voteFor(languageName) {
    setLanguages((currentLanguages) =>
      currentLanguages.map((language) =>
        language.name === languageName
          ? { ...language, votes: language.votes + 1 }
          : language,
      ),
    )
  }

  return (
    <main className="voting-app">
      <header className="page-header">
        <span className="eyebrow">COMMUNITY POLL</span>
        <h1>Which language do you love?</h1>
        <p>Cast your vote and see what the community thinks.</p>
      </header>

      <section className="poll" aria-label="Programming language poll">
        <div className="poll-heading">
          <h2>Choose your favorite</h2>
          <span className="total-votes">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
          </span>
        </div>

        <ul className="language-list">
          {languages.map((language) => (
            <li className="language-card" key={language.name}>
              <div className="language-info">
                <span className="language-name">{language.name}</span>
                <span className="vote-count">
                  {language.votes} {language.votes === 1 ? 'vote' : 'votes'}
                </span>
              </div>
              <button
                className="vote-button"
                type="button"
                onClick={() => voteFor(language.name)}
                aria-label={`Vote for ${language.name}`}
              >
                Vote
                <span aria-hidden="true">+</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="poll-footnote">You can vote as many times as you like.</p>
      </section>
    </main>
  )
}

export default App
