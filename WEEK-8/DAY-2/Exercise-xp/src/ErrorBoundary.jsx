import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  componentDidCatch(error, info) {
    console.error('A screen failed to render:', error, info)
    this.setState({ hasError: true })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger" role="alert">
          Something went wrong while displaying this screen.
        </div>
      )
    }

    return this.props.children
  }
}
