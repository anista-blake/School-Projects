import React, { useState } from "react";

function RecipeSearchForm({ onSearch }) {
  const [diet, setDiet] = useState("");
  const [time, setTime] = useState("");
  const [mealType, setmealType] = useState("");
  const [nutrient, setNutrient] = useState("");
  const [cycle, setCycle] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(diet, time, mealType, nutrient, cycle);
  };

  // Helper style to keep rows neat
  const rowStyle = {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "15px",
    marginBottom: "15px", // Adds space between the two rows
  };

  return (
    <form onSubmit={handleSubmit} className="recipe-form">
      
      {/* ---------------- TOP ROW ---------------- */}
      <div style={rowStyle}>
        <div className="input-group">
          <label htmlFor="diet">Diet: </label>
          <select id="diet" value={diet} onChange={(e) => setDiet(e.target.value)}>
            <option value="">Any</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten free">Gluten-Free</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="mealType">Meal Type: </label>
          <select
            id="mealType"
            value={mealType}
            onChange={(e) => setmealType(e.target.value)}
          >
            <option value="">Any</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snacks</option>
            <option value="drink">Drinks</option>
          </select>
        </div>

        <div className="input-group">
          <label htmlFor="time">Max Prep Time: </label>
          <input
            type="number"
            id="time"
            placeholder="Minutes"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>
      </div>

      {/* ---------------- BOTTOM ROW ---------------- */}
      <div style={rowStyle}>
        
        {/* Nutrient Filter */}
        <div className="input-group">
          <label htmlFor="nutrient">Nutrient: </label>
          <select
            id="nutrient"
            value={nutrient}
            onChange={(e) => setNutrient(e.target.value)}
          >
            <option value="">Any</option>
            <option value="protein">High Protein</option>
            <option value="fiber">High Fiber</option>
            <option value="iron">High Iron</option>
            <option value="magnesium">High Magnesium</option>
            <option value="calcium">High Calcium</option>
          </select>
        </div>

        {/* Cycle Filter */}
        <div className="input-group">
          <label htmlFor="cycle">Support Period Cycle: </label>
          <select
            id="cycle"
            value={cycle}
            onChange={(e) => setCycle(e.target.value)}
          >
            <option value="">None</option>
            <option value="pms">PMS Support</option>
            <option value="period">Heavy Flow</option>
            <option value="follicular">Follicular Phase</option>
            <option value="ovulation">Ovulation</option>
            <option value="luteal">Luteal Phase</option>
          </select>
        </div>

        <button type="submit">Search</button>
      </div>

    </form>
  );
}

export default RecipeSearchForm;