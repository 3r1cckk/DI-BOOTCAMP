import { Component } from 'react'

class UserFavoriteAnimals extends Component {
  render() {
    return (
      <ul className="animal-list">
        {this.props.favAnimals.map((animal, index) => (
          <li key={index}>{animal}</li>
        ))}
      </ul>
    )
  }
}

export default UserFavoriteAnimals