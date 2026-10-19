import { useState, type FormEvent } from 'react'
import List from './components/List'
import type { Book } from './types'

const starterBooks: Book[] = [
  { id: 1, title: 'The House in the Cerulean Sea', author: 'TJ Klune' },
  { id: 2, title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin' },
  { id: 3, title: 'The Thursday Murder Club', author: 'Richard Osman' },
]

function BookApp() {
  const [books, setBooks] = useState<Book[]>(starterBooks)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  function addBook(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedTitle = title.trim()
    const trimmedAuthor = author.trim()

    if (!trimmedTitle || !trimmedAuthor) {
      setFormError('Please add both a title and an author.')
      return
    }

    const nextId = books.reduce((largestId, book) => Math.max(largestId, book.id), 0) + 1
    const newBook: Book = {
      id: nextId,
      title: trimmedTitle,
      author: trimmedAuthor,
    }

    setBooks((currentBooks) => [...currentBooks, newBook])
    setTitle('')
    setAuthor('')
    setFormError(null)
  }

  return (
    <main className="page-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="My book list home">
          <span className="brand-mark" aria-hidden="true">b</span>
          <span>my book list</span>
        </a>
        <span className="topbar-note">WEEK 10 · DAILY CHALLENGE</span>
      </header>

      <section id="top" className="intro" aria-labelledby="page-title">
        <p className="eyebrow">A small shelf for good reads</p>
        <h1 id="page-title">Books I want to remember<span>.</span></h1>
        <p className="intro-copy">
          A little list for the books I’ve read, borrowed, or keep meaning to
          pick up. Add one whenever you like.
        </p>
      </section>

      <section className="book-shelf" aria-labelledby="shelf-heading">
        <div className="shelf-heading">
          <div>
            <p className="section-note">CURRENTLY ON THE SHELF</p>
            <h2 id="shelf-heading">The reading list</h2>
          </div>
          <span className="book-count">
            {books.length} {books.length === 1 ? 'book' : 'books'}
          </span>
        </div>

        <List
          items={books}
          getKey={(book) => book.id}
          emptyMessage="No books yet. Add the first one below."
          renderItem={(book, index) => (
            <article className="book-row">
              <span className="book-number" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="book-details">
                <h3>{book.title}</h3>
                <p>by {book.author}</p>
              </div>
              <span className="book-spine" aria-hidden="true">✳</span>
            </article>
          )}
        />

        <form className="add-book-form" onSubmit={addBook} noValidate>
          <div className="form-intro">
            <p className="section-note">ADD TO THE SHELF</p>
            <h2>Found another one?</h2>
          </div>
          <div className="form-fields">
            <label>
              <span>Book title</span>
              <input
                type="text"
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value)
                  setFormError(null)
                }}
                placeholder="e.g. Piranesi"
                aria-invalid={formError !== null && !title.trim()}
                aria-describedby={formError ? 'form-error' : undefined}
                required
              />
            </label>
            <label>
              <span>Author</span>
              <input
                type="text"
                value={author}
                onChange={(event) => {
                  setAuthor(event.target.value)
                  setFormError(null)
                }}
                placeholder="e.g. Susanna Clarke"
                aria-invalid={formError !== null && !author.trim()}
                aria-describedby={formError ? 'form-error' : undefined}
                required
              />
            </label>
            <button className="add-button" type="submit">
              <span aria-hidden="true">+</span> Add book
            </button>
          </div>
          {formError && (
            <p className="form-error" id="form-error" role="alert">
              {formError}
            </p>
          )}
        </form>
      </section>

      <footer className="page-footer">
        <span aria-hidden="true">✳</span>
        Made for the books I haven’t read yet.
      </footer>
    </main>
  )
}

export default BookApp
