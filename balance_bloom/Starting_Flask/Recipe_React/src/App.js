import React, { useState, useEffect } from "react";
import "./index.css"; // Assuming this is your main CSS
import MealPlan from './components/MealPlan';

// Import Data
import { RecommendedRecipes } from "./data/constants";
import { add_recipe, delete_recipe } from "./components/DatabaseConnection";

// Import Components
import FoodPyramid from "./components/FoodPyramid";
import RecipeSearchForm from "./components/RecipeSearchForm";
import RecipeList from "./components/RecipeList";
import FavoritesList from "./components/FavoritesList";
import TipOfTheDay from "./components/TipOfTheDay";
import NavBar from "./components/NavBar"; 

const navThemes = {
  pink:   { light: '#c9356c', dark: '#ac2858', highlight: '#f48db4' },
  blue:   { light: '#0056b3', dark: '#004494', highlight: '#4da3ff' },
  green:  { light: '#1e7e34', dark: '#145523', highlight: '#28a745' },
  red:    { light: '#b02a37', dark: '#8a1f2a', highlight: '#dc3545' },
  purple: { light: '#5a359a', dark: '#3d2469', highlight: '#6f42c1' },
  orange: { light: '#c66410', dark: '#9c4d0b', highlight: '#fd7e14' },
  yellow: { light: '#d39e00', dark: '#997100', highlight: '#ffc107' }
};

function App() {
  // State for favorites (shared between lists)
  const [user, setUser] = useState(null); // <- new state for user
  const [favorites, setFavorites] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasSearched, setHasSearched] = useState(false);


    // Fetch user from Flask
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/current-user", { credentials: "same-origin" });
        if (res.ok) {
          const data = await res.json();
          setUser(data); // either object or null
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    async function fetchFavorites() {
      const res = await fetch("/api/recipe/get-favorites", { credentials: "same-origin" });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data); // now your state is populated
      }
    }
    fetchFavorites();
}, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const isDarkMode = mediaQuery.matches;

    const theme = isDarkMode ? "dark" : "light";
    document.body.setAttribute("data-theme", theme);

    const accentColor = (user && user.pref_accent_color) ? user.pref_accent_color : 'pink';

    const themeColors = navThemes[accentColor] || navThemes['pink'];
    const bgToUse = isDarkMode ? themeColors.dark : themeColors.light;

    const root = document.documentElement;
    root.style.setProperty('--navbg', bgToUse);
    root.style.setProperty('--navhl', themeColors.highlight);

    document.body.setAttribute("data-accent-color", accentColor);
    if (user && user.pref_font_size) {
        document.body.setAttribute("data-font-size", user.pref_font_size);
    }

    const handleChange = (e) => {
        const newDarkMode = e.matches;
        document.body.setAttribute("data-theme", newDarkMode ? "dark" : "light");
        
        const newColors = navThemes[accentColor] || navThemes['pink'];
        const newBg = newDarkMode ? newColors.dark : newColors.light;
        root.style.setProperty('--navbg', newBg);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);

  }, [user]); // <--- IMPORTANT: Re-run this when 'user' is fetched!

  // Favorite logic stays here, as it's shared state
  const toggleFavorite = (recipe) => {
    if (favorites.find((fav) => fav.id === recipe.id)) {
      delete_recipe(recipe);
      setFavorites(favorites.filter((fav) => fav.id !== recipe.id));
    } else {
      add_recipe(recipe);
      setFavorites([...favorites, recipe]);
    }
  };

  // Decide which list to show
  const showPopular = !hasSearched && recipes.length === 0;
  const showSearchResults = hasSearched && recipes.length > 0;

  const searchRecipes = async (diet, time, mealType, nutrient, cycle) => {
    setHasSearched(true);
    setLoading(true);
    setError("");
    setRecipes([]);

    try {
      // 🌐 Direct call to Spoonacular API
      const url = `/api/recipe?addRecipeNutrition=true`
        + (diet ? `&diet=${encodeURIComponent(diet)}` : "")
        + (time ? `&maxReadyTime=${encodeURIComponent(time)}` : "")
        + (mealType ? `&type=${encodeURIComponent(mealType)}` : "")
        + (nutrient ? `&nutrient=${encodeURIComponent(nutrient)}` : "")
        + (cycle ? `&cycle=${encodeURIComponent(cycle)}` : "");

        // ⚡ Fetch directly
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to fetch recipes from Spoonacular");

        const data = await response.json();
        console.log("API response:", data); // data is already an array
        setRecipes(data); // use data directly, not data.results

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    return (
    <>
      <NavBar/>

    <div className="recipe-feature">
      <h2>🔎 Recipe Recommendation</h2>
      
      <RecipeSearchForm onSearch={searchRecipes} />

      {/* --- Loading & Error States --- */}
      {loading && <p>⏳ Loading recipes...</p>}
      {error && <p style={{ color: "red" }}>⚠️ {error}</p>}
      {hasSearched && !loading && recipes.length === 0 && !error && (
        <p>No recipes found. Try adjusting your filters!</p>
      )}

      {/* --- Recipe Lists --- */}
      {showPopular && (
        <RecipeList
          title="⭐ Popular & Recommended Recipes"
          recipes={RecommendedRecipes}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}
      
      {showSearchResults && (
          <RecipeList
          title="Search Results"
          recipes={recipes}
          favorites={favorites}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* --- 7-Day Meal Plan --- */}
      <MealPlan recipes={showSearchResults ? recipes : RecommendedRecipes} />

      {/* --- Other Sections --- */}
      <FavoritesList favorites={favorites} onToggleFavorite={toggleFavorite} />
      <TipOfTheDay />
      <FoodPyramid />
    </div>
    </>
  );
}

export default App;