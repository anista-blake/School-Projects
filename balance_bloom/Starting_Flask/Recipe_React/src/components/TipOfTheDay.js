import React, { useState } from 'react';
import { cookingTips } from '../data/constants'; // Import the data

function TipOfTheDay() {
  const [tip, setTip] = useState(cookingTips[0]);

  const getRandomTip = () => {
    const random = Math.floor(Math.random() * cookingTips.length);
    setTip(cookingTips[random]);
  };

  return (
    <div className="tips-section">
      <h2>💡 Cooking Tip of the Day</h2>
      <p className="tip-text">{tip}</p>
      <button className="tip-btn" onClick={getRandomTip}>
        Show Another Tip 🔄
      </button>
    </div>
  );
}

export default TipOfTheDay;