import React from 'react';

function FavoritesList({ favorites, onToggleFavorite, isFavorite }) {
  return (
    <div className="favorites-section" style={{ marginTop: "40px" }}>
      <h2>My Favorite Recipes</h2>
      {favorites.length === 0 ? (
        <p>No favorites yet ❤️</p>
      ) : (
        <div className="favorites-grid">
          {favorites.map((fav) => (
            <div key={fav.id} className="favorite-card">
              <h4>{fav.title}</h4>
              {fav.image && (
                <img
                  src={fav.image}
                  alt={fav.title}
                  style={{ width: "120px", borderRadius: "10px" }}
                />
              )}
              <button
                onClick={() => onToggleFavorite(fav)}
                className={`favorite-btn ${isFavorite ? "active" : ""}`}
              >
                {isFavorite ? "🤍" : "💖" } 
              </button>
              <a href={fav.sourceUrl} target="_blank" rel="noopener noreferrer">
                View Recipe →
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FavoritesList;