import { useState } from 'react'
import BookList from './components/BookList'
import type { BookGenre } from './features/books/booksSlice'

type GenreFilter = 'All books' | BookGenre

const genres: GenreFilter[] = [
  'All books',
  'Horror',
  'Fantasy',
  'Science Fiction',
]

function App() {
  const [selectedGenre, setSelectedGenre] = useState<GenreFilter>('All books')

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="The Reading Room home">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>The Reading Room</span>
        </a>
        <span className="topbar-note">REDUX PERFORMANCE EXERCISE</span>
      </header>

      <section className="content" aria-labelledby="page-title">
        <div className="intro">
          <p className="eyebrow">A collection for every kind of reader</p>
          <h1 id="page-title">The book shelf<span>.</span></h1>
          <p className="intro-copy">
            Browse the inventory or narrow it down by genre. Memoized selectors
            keep each list stable until the book data changes.
          </p>
        </div>

        <BookList
          selectedGenre={selectedGenre}
          genres={genres}
          onSelectGenre={setSelectedGenre}
        />
      </section>
    </main>
  )
}

export default App
