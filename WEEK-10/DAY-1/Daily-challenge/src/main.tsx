import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import BookApp from './BookApp'
import './style.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BookApp />
  </StrictMode>,
)
