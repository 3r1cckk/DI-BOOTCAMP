import { useEffect, useState } from 'react';

function Color() {
  const [favoriteColor, setFavoriteColor] = useState('red');

  useEffect(() => {
    alert('useEffect reached');
  });

  const changeColor = () => {
    setFavoriteColor('blue');
  };

  return (
    <div className="exercise-content">
      <h3>My favorite color is {favoriteColor}</h3>
      <button className="exercise-button" type="button" onClick={changeColor}>
        Change favorite color
      </button>
    </div>
  );
}

export default Color;
