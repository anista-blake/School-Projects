function cleanFavorite(item) {
    return {
    id: item.id,
    title: item.title,
    image: item.image,
    sourceUrl: item.sourceUrl
  };
}

export function add_recipe(fav, options = { pretty: false }) {
    if (!fav) {
        console.log("No favorites yet — not sending to backend");
        return;
    }
    
    const cleaned = cleanFavorite(fav);
    console.log("cleaned:", JSON.stringify(cleaned, null, 2));

    addFavorite(cleaned);
}

export function delete_recipe(fav, options = { pretty: false }) {
    if (!fav) {
        console.log("No favorites yet — not sending to backend");
        return;
    }
    
    const cleaned = cleanFavorite(fav);
    console.log("cleaned:", JSON.stringify(cleaned, null, 2));

    removeFavorite(cleaned);
}

async function addFavorite(payload) {
    try {
        const url = window.RECIPE_ENTRY_API || "/api/recipe/add-favorite";
        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(()=>({}));
            console.warn("recipe-entry error", err);
        }
        return res.ok;
    } catch (e) {
        console.error("addFavorite failed", e);
        return false;
    }
}

async function removeFavorite(payload) {
    try {
        const url = window.RECIPE_ENTRY_API || "/api/recipe/remove-favorite";
        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(()=>({}));
            console.warn("recipe-entry error", err);
        }
        return res.ok;
    } catch (e) {
        console.error("removeFavorite failed", e);
        return false;
    }
}