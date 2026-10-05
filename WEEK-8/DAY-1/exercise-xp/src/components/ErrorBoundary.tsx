import { Component, type ErrorInfo, type ReactNode } from 'react'

type ErrorBoundaryState = {
  error: Error | null
  errorInfo: ErrorInfo | null
}

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
    errorInfo: null,
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
  }

  render() {
    const { error, errorInfo } = this.state

    if (error) {
      return (
        <div className="error-panel" role="alert">
          <h3>Something went wrong.</h3>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {error.toString()}
            <br />
            {errorInfo?.componentStack}
          </details>
        </div>
      )
    }

    return this.props.children
  }
}
