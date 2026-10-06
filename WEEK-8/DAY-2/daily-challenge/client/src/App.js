import { Component, createElement as h } from 'react'

export default class App extends Component {
  state = {
    helloMessage: '',
    inputMessage: '',
    responseMessage: '',
    errorMessage: '',
    isSubmitting: false,
  }

  async componentDidMount() {
    try {
      const response = await fetch('/api/hello')

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`)
      }

      const helloMessage = await response.text()
      this.setState({ helloMessage })
    } catch (error) {
      console.error('Could not load the greeting from Express:', error)
      this.setState({
        errorMessage: 'Could not connect to Express. Make sure the server is running.',
      })
    }
  }

  handleInputChange = (event) => {
    this.setState({
      inputMessage: event.target.value,
      responseMessage: '',
      errorMessage: '',
    })
  }

  handleSubmit = async (event) => {
    event.preventDefault()
    this.setState({ isSubmitting: true, responseMessage: '', errorMessage: '' })

    try {
      const response = await fetch('/api/world', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
        body: JSON.stringify({ message: this.state.inputMessage }),
      })

      const responseMessage = await response.text()

      if (!response.ok) {
        throw new Error(responseMessage || `Server returned ${response.status}`)
      }

      this.setState({ responseMessage })
    } catch (error) {
      console.error('Could not send the message to Express:', error)
      this.setState({
        errorMessage: error instanceof Error ? error.message : 'Could not send the message.',
      })
    } finally {
      this.setState({ isSubmitting: false })
    }
  }

  render() {
    const {
      helloMessage,
      inputMessage,
      responseMessage,
      errorMessage,
      isSubmitting,
    } = this.state

    return h(
      'main',
      { className: 'page-shell' },
      h(
        'section',
        { className: 'message-card' },
        h('p', { className: 'eyebrow' }, 'REACT + EXPRESS'),
        h('h1', null, helloMessage || 'Connecting to Express…'),
        h(
          'p',
          { className: 'intro' },
          'Send a message from this form and see the Express server reply.',
        ),
        h(
          'form',
          { onSubmit: this.handleSubmit },
          h('label', { htmlFor: 'message' }, 'Your message'),
          h(
            'div',
            { className: 'form-row' },
            h('input', {
              autoComplete: 'off',
              id: 'message',
              onChange: this.handleInputChange,
              placeholder: 'Type something to send…',
              required: true,
              value: inputMessage,
            }),
            h(
              'button',
              { disabled: isSubmitting, type: 'submit' },
              isSubmitting ? 'Sending…' : 'Send',
            ),
          ),
        ),
        responseMessage &&
          h(
            'p',
            { className: 'server-response', role: 'status' },
            responseMessage,
          ),
        errorMessage &&
          h(
            'p',
            { className: 'error-message', role: 'alert' },
            errorMessage,
          ),
      ),
    )
  }
}
