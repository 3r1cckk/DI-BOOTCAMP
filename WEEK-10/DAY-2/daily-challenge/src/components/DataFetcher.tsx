import { useEffect, useMemo } from 'react'
import { fetchData } from '../features/dataSlice'
import { useAppDispatch, useAppSelector } from '../hooks'
import type { FetchRequest } from '../types/types'

export interface DataFetcherProps<T> {
  request: FetchRequest | null
  parseItems: (data: unknown) => T[]
  getKey: (item: T) => string | number
  renderItem: (item: T) => React.ReactNode
  emptyMessage?: string
}

export function DataFetcher<T>({
  request,
  parseItems,
  getKey,
  renderItem,
  emptyMessage = 'No results yet. Try a search to get started.',
}: DataFetcherProps<T>) {
  const dispatch = useAppDispatch()
  const { data, status, error } = useAppSelector((state) => state.data)

  useEffect(() => {
    if (!request) return

    const task = dispatch(fetchData(request))
    return () => task.abort()
  }, [dispatch, request])

  const parsedResult = useMemo(() => {
    if (status !== 'succeeded' || data === null) return { items: [] as T[], error: null }

    try {
      return { items: parseItems(data), error: null }
    } catch (caughtError) {
      return {
        items: [] as T[],
        error:
          caughtError instanceof Error
            ? caughtError.message
            : 'The response could not be displayed.',
      }
    }
  }, [data, parseItems, status])
  const { items, error: parseError } = parsedResult

  if (!request) {
    return (
      <div className="fetch-state fetch-state-welcome">
        <span className="fetch-state-mark" aria-hidden="true">✳</span>
        <h2>What sounds good for dinner?</h2>
        <p>Enter your RapidAPI key and a dish or ingredient to look up recipes.</p>
      </div>
    )
  }

  if (status === 'loading') {
    return (
      <div className="fetch-state" role="status" aria-live="polite">
        <span className="loading-mark" aria-hidden="true">✳</span>
        <h2>Looking up recipes…</h2>
        <p>This usually takes just a moment.</p>
      </div>
    )
  }

  if (status === 'failed') {
    return (
      <div className="fetch-state fetch-state-error" role="alert">
        <span className="fetch-state-mark" aria-hidden="true">!</span>
        <h2>That search didn’t go through.</h2>
        <p>{error}</p>
        <p className="fetch-hint">
          Make sure your RapidAPI key is valid and you have subscribed to the Spoonacular API.
        </p>
      </div>
    )
  }

  if (parseError) {
    return (
      <div className="fetch-state fetch-state-error" role="alert">
        <span className="fetch-state-mark" aria-hidden="true">!</span>
        <h2>We couldn’t read those results.</h2>
        <p>{parseError}</p>
      </div>
    )
  }

  if (status === 'succeeded' && items.length === 0) {
    return (
      <div className="fetch-state">
        <span className="fetch-state-mark" aria-hidden="true">⌕</span>
        <h2>No recipes found for that search.</h2>
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className="results-grid" aria-live="polite">
      {items.map((item) => (
        <div key={getKey(item)}>{renderItem(item)}</div>
      ))}
    </div>
  )
}
