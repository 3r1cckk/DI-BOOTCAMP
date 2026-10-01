import { Component } from 'react'
import './Exercise.css'

class Exercise extends Component {
  render() {
    const style_header = {
      color: 'white',
      backgroundColor: 'DodgerBlue',
      padding: '10px',
      fontFamily: 'Arial',
    }

    return (
      <div className="exercise-example">
        <h1 style={style_header}>This is a title</h1>
        <p className="para">This is a paragraph with its own stylesheet.</p>
        <a href="https://react.dev/" target="_blank" rel="noreferrer">
          This is a link
        </a>
        <form className="example-form" onSubmit={(event) => event.preventDefault()}>
          <label htmlFor="exercise-name">Your name</label>
          <input id="exercise-name" name="name" type="text" />
          <button type="submit">Submit</button>
        </form>
        <img
          className="exercise-image"
          src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=900&q=85"
          alt="A tabby cat looking toward the camera"
        />
        <ul className="example-list">
          <li>First item</li>
          <li>Second item</li>
          <li>Third item</li>
        </ul>
      </div>
    )
  }
}

export default Exercise