import { useAppSelector } from '../app/hooks'
import {
  selectBooks,
  selectFantasyBooks,
  selectHorrorBooks,
  selectScienceFictionBooks,
} from '../features/books/booksSelectors'
import type { BookGenre } from '../features/books/booksSlice'

type GenreFilter = 'All books' | BookGenre

interface BookListProps {
  selectedGenre: GenreFilter
  genres: GenreFilter[]
  onSelectGenre: (genre: GenreFilter) => void
}

const genreSelectors: Record<
  BookGenre,
  (state: Parameters<typeof selectBooks>[0]) => ReturnType<typeof selectBooks>
> = {
  Horror: selectHorrorBooks,
  Fantasy: selectFantasyBooks,
  'Science Fiction': selectScienceFictionBooks,
}

function BookList({ selectedGenre, genres, onSelectGenre }: BookListProps) {
  const books = useAppSelector((state) =>
    selectedGenre === 'All books'
      ? selectBooks(state)
      : genreSelectors[selectedGenre](state),
  )

  return (
    <section className="inventory" aria-label="Book inventory">
      <div className="list-toolbar">
        <div>
          <p className="eyebrow">Your collection</p>
          <h2>{selectedGenre}</h2>
        </div>
        <span className="book-count" aria-live="polite">
          {books.length} {books.length === 1 ? 'book' : 'books'}
        </span>
      </div>

      <div className="filters" role="group" aria-label="Filter books by genre">
        {genres.map((genre) => (
          <button
            key={genre}
            className={`filter-button${selectedGenre === genre ? ' is-selected' : ''}`}
            type="button"
            aria-pressed={selectedGenre === genre}
            onClick={() => onSelectGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>

      {books.length > 0 ? (
        <ul className="book-grid" aria-label={`${selectedGenre} books`}>
          {books.map((book) => (
            <li
              className={`book-card genre-${book.genre.toLowerCase().replace(' ', '-')}`}
              key={book.id}
            >
              <span className="book-genre">{book.genre}</span>
              <h3>{book.title}</h3>
              <p>{book.author}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">There are no books in this genre yet.</p>
      )}
    </section>
  )
}

export default BookList
