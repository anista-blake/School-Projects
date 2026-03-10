// static/js/cycle-recipes.js

document.addEventListener('DOMContentLoaded', function () {
    // Grab all the cycle phase buttons and the display area
    const buttons = document.querySelectorAll('.cycle-recipe-button');
    const displayArea = document.getElementById('cycle-recipes-display');

    // Add click event to each button
    buttons.forEach(button => {
        button.addEventListener('click', async function () {
            const phase = this.getAttribute('data-phase');
            displayArea.innerHTML = '<p>Loading recipes ☺️...</p>';

            try {
                // Fetch recipes for the selected cycle phase
                const response = await fetch(`/api/recipe?cycle=${encodeURIComponent(phase)}&addRecipeNutrition=true`, {
                    credentials: 'same-origin'
                });

                if (!response.ok) throw new Error('Failed to fetch recipes');

                const data = await response.json();

                // Render recipes
                renderRecipes(data);
            } catch (error) {
                displayArea.innerHTML = `<p class="error">Error: ${error.message}</p>`;
            }
        });
    });

    // Function to render recipes into the display area
    function renderRecipes(recipes) {
        if (!recipes || recipes.length === 0) {
            displayArea.innerHTML = '<p>No recipes found for this phase.</p>';
            return;
        }

        // Only show  5 recipes, if user wants more they can click through to recipe page
        const recipeCards = recipes.slice(0, 5).map(recipe => {
             // Ensure nutrients array exists
            const nutrients = (recipe.nutrition && recipe.nutrition.nutrients) ? recipe.nutrition.nutrients : [];


            // Helper to get nutrient amount by name
            // Define getNutrient inside map callback
            const getNutrient = (name) => {
                const item = nutrients.find(n => n.name === name);
                return item ? `${item.amount} ${item.unit}` : "N/A";
            };
            return `
                <div class="recipe-container">
                    <img class="recipe-image" src="${recipe.image}" alt="${recipe.title}">
                    <p class="recipe-name">${recipe.title}</p>
                    
                <div class="nutrition-info">
                    <p>🔥 Calories: ${getNutrient("Calories")}</p>
                    <p>🥩 Protein: ${getNutrient("Protein")}</p>
                    <p>🥑 Fat: ${getNutrient("Fat")}</p>
                    <p>🍞 Carbs: ${getNutrient("Carbohydrates")}</p>
                    <p>🧂 Sodium: ${getNutrient("Sodium")}</p>
                </div>
                    <a class="recipe-link" href="${recipe.sourceUrl}" target="_blank" rel="noopener noreferrer">
                        View Recipe →
                    </a>
                </div>
            `;
        }).join('');

        // Insert the recipe cards into the display area
        displayArea.innerHTML = recipeCards;
    }
});
