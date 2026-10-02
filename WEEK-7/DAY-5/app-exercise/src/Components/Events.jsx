import { useState } from 'react';

function Events() {
  const [isToggleOn, setIsToggleOn] = useState(true);

  const clickMe = () => {
    alert('I was clicked');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      alert(event.currentTarget.value);
    }
  };

  const toggleState = () => {
    setIsToggleOn((currentState) => !currentState);
  };

  return (
    <div className="exercise-content">
      <button className="exercise-button" type="button" onClick={clickMe}>
        Click me
      </button>

      <label className="exercise-label" htmlFor="enter-message">
        Type a message and press Enter
      </label>
      <input
        className="exercise-input"
        id="enter-message"
        type="text"
        onKeyDown={handleKeyDown}
      />

      <button
        className="exercise-button"
        type="button"
        onClick={toggleState}
        aria-pressed={isToggleOn}
      >
        {isToggleOn ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export default Events;
