import React from 'react';
import RecipeCard from './RecipeCard';

function RecipeList({ title, recipes, favorites, onToggleFavorite }) {
  if (!recipes || recipes.length === 0) {
    return null; // Don't render anything if no recipes
  }

  return (
    <>
      {title && <h2>{title}</h2>}
      <div className="recipes-grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onToggleFavorite={onToggleFavorite}
            isFavorite={!!favorites.find((fav) => fav.id === recipe.id)}
          />
        ))}
      </div>
    </>
  );
}

export default RecipeList;