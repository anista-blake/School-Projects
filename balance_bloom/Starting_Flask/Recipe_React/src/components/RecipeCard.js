import React from 'react';

function RecipeCard({ recipe, onToggleFavorite, isFavorite }) {
  // Handle both API results (sourceUrl) and popular (link)
  const link = recipe.sourceUrl || recipe.link || `https://spoonacular.com/recipes/${recipe.id}`;
  
  return (
    <div className="recipe-card" key={recipe.id}>
      <h3>{recipe.title}</h3>
      {recipe.image && <img src={recipe.image} alt={recipe.title} />}
      <p>⏱ {recipe.readyInMinutes ?? recipe.cookingMinutes ?? "N/A"} min</p>
      <p>🍴 Servings: {recipe.servings}</p>

      {recipe.nutrition?.nutrients?.length > 0 && (
        <div className="nutrition-info">
          <p>🔥 Calories: {recipe.nutrition.nutrients.find(n => n.name === "Calories")?.amount} kcal</p>
          <p>🥩 Protein: {recipe.nutrition.nutrients.find(n => n.name === "Protein")?.amount} g</p>
          <p>🥑 Fat: {recipe.nutrition.nutrients.find(n => n.name === "Fat")?.amount} g</p>
          <p>🍞 Carbs: {recipe.nutrition.nutrients.find(n => n.name === "Carbohydrates")?.amount} g</p>
          <p>🧂 Sodium: {recipe.nutrition.nutrients.find(n => n.name === "Sodium")?.amount} mg</p>
        </div>
      )}
      
      <button
        onClick={() => onToggleFavorite(recipe)}
        className={`favorite-btn ${isFavorite ? "active" : ""}`}
      >
        {isFavorite ? "💖" : "🤍"}
      </button>

      <a href={link} target="_blank" rel="noopener noreferrer">
        View Recipe →
      </a>
    </div>
  );
}

export default RecipeCard;