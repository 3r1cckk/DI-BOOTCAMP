import { Component } from 'react'
import data from '../data/data.json'

export default class Example1 extends Component {
  render() {
    return (
      <ul className="social-list">
        {data.SocialMedias.map((url) => (
          <li key={url}>
            <a href={url} target="_blank" rel="noreferrer">
              {new URL(url).hostname.replace('www.', '')}
            </a>
          </li>
        ))}
      </ul>
    )
  }
}
