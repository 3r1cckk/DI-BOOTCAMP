import { createSelector } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'

export const selectBooks = (state: RootState) => state.books.items

export const selectHorrorBooks = createSelector([selectBooks], (books) =>
  books.filter((book) => book.genre === 'Horror'),
)

export const selectFantasyBooks = createSelector([selectBooks], (books) =>
  books.filter((book) => book.genre === 'Fantasy'),
)

export const selectScienceFictionBooks = createSelector([selectBooks], (books) =>
  books.filter((book) => book.genre === 'Science Fiction'),
)
