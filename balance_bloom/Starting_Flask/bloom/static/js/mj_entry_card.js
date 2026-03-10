// function for making the past entry cards clickable

export function ClickEntryCard(){
    const cards = document.querySelectorAll(".entry-card");
    const buttonsDiv = document.getElementById("btns");
    const backButton = document.getElementById("back_Button");
    const entryColor = document.querySelector(".latest-entry");
  
    cards.forEach(card => {
        card.style.cursor = "pointer";
  
        card.addEventListener("click", async () => {
            const entryId = card.dataset.id;
            const response = await fetch("/journal/get-entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ entry_id: entryId })
            });
            const data = await response.json();
            if (data.error) {
              console.error(data.error);
              return;
            }
            // Update UI
            document.querySelector(".current-title h2").textContent = data.title;
            document.querySelector(".current-content p").textContent = data.content;
            document.querySelector(".entry-mood").src = `/static/img/${data.mood_filename}`;
            document.querySelector(".current-date p").textContent = data.created_at.slice(0, 10)
            
            entryColor.dataset.mood = data.mood;
        
            buttonsDiv.style.display = "none";
            backButton.style.display = "flex";
            
        });
    }); 
}