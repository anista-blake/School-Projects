import React from "react";
import "./FoodPyramid.css";

function FoodPyramid() {
  // Hardcoded data (later from MongoDB)
  const dailyIntake = {
    vegetables: 75,
    fruits: 50,
    grains: 85,
    dairy: 40,
    protein: 65,
  };

  const layers = [
    { label: "Vegetables 🥦", key: "vegetables", color: "#4caf50" },
    { label: "Fruits 🍎", key: "fruits", color: "#8bc34a" },
    { label: "Grains 🍞", key: "grains", color: "#ffc107" },
    { label: "Dairy 🧀", key: "dairy", color: "#ff9800" },
    { label: "Protein 🍗", key: "protein", color: "#f44336" },
  ];

  return (
    <div className="food-pyramid-section">
      <h2>🍽️ My Daily Food Pyramid</h2>
      <p className="pyramid-subtext">Opacity shows how much of your daily goal you've met</p>

      <div className="food-pyramid">
        {layers.map((layer, i) => (
          <div
            key={layer.key}
            className="pyramid-layer"
            style={{
              backgroundColor: layer.color,
              opacity: dailyIntake[layer.key] / 100,
              width: `${60 + i * 10}%`,
            }}
          >
            {layer.label} — {dailyIntake[layer.key]}%
          </div>
        ))}
      </div>
    </div>
  );
}

export default FoodPyramid;
