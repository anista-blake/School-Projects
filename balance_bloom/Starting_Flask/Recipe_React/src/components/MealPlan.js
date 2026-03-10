import React, { useState } from "react";

const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

function OneDayMealPlan({ recipes }) {
  const [plan, setPlan] = useState(
    mealTypes.reduce((acc, meal) => {
      acc[meal] = null;
      return acc;
    }, {})
  );

  const handleSelectRecipe = (meal, recipe) => {
    setPlan(prev => ({
      ...prev,
      [meal]: recipe
    }));
  };

  return (
    <div className="meal-plan">
      <h2>📅 Today's Meal Plan</h2>
      {mealTypes.map(meal => (
        <div key={meal} className="meal-slot">
                  <strong>{meal}:</strong> {plan[meal]?.title || "None selected"}
          <select
            value={plan[meal]?.id || ""}
            onChange={(e) => {
              const selected = recipes.find(r => r.id === parseInt(e.target.value));
              handleSelectRecipe(meal, selected);
            }}
          >
            <option value="">Select a recipe</option>
            {recipes.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

export default OneDayMealPlan;
