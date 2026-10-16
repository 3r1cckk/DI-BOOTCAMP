import { createSlice } from '@reduxjs/toolkit'

export type BookGenre = 'Horror' | 'Fantasy' | 'Science Fiction'

export interface Book {
  id: number
  title: string
  author: string
  genre: BookGenre
}

interface BooksState {
  items: Book[]
}

const initialState: BooksState = {
  items: [
    { id: 1, title: 'The Haunting of Hill House', author: 'Shirley Jackson', genre: 'Horror' },
    { id: 2, title: 'Dracula', author: 'Bram Stoker', genre: 'Horror' },
    { id: 3, title: 'The Shining', author: 'Stephen King', genre: 'Horror' },
    { id: 4, title: 'The Hobbit', author: 'J. R. R. Tolkien', genre: 'Fantasy' },
    { id: 5, title: 'A Wizard of Earthsea', author: 'Ursula K. Le Guin', genre: 'Fantasy' },
    { id: 6, title: 'The Name of the Wind', author: 'Patrick Rothfuss', genre: 'Fantasy' },
    { id: 7, title: 'Dune', author: 'Frank Herbert', genre: 'Science Fiction' },
    { id: 8, title: 'The Left Hand of Darkness', author: 'Ursula K. Le Guin', genre: 'Science Fiction' },
    { id: 9, title: 'Kindred', author: 'Octavia E. Butler', genre: 'Science Fiction' },
    { id: 10, title: 'Frankenstein', author: 'Mary Shelley', genre: 'Horror' },
    { id: 11, title: 'The Fellowship of the Ring', author: 'J. R. R. Tolkien', genre: 'Fantasy' },
    { id: 12, title: 'The Martian', author: 'Andy Weir', genre: 'Science Fiction' },
  ],
}

const booksSlice = createSlice({
  name: 'books',
  initialState,
  reducers: {},
})

export default booksSlice.reducer
