// holds the function for filtering previous journal entries

export function FilteringEntries(){

    const clearBtn = document.getElementById("filter-clear");
    const applyBtn = document.getElementById("filter-apply");
    if (!clearBtn || !applyBtn) return;
  
    const fromInput = document.getElementById("filter-from");
    const toInput = document.getElementById("filter-to");
    const moodSelect = document.getElementById("filter-mood");
    
    const collapsibleHeader = document.querySelector(".collapsible .entry-count");
    const noResultsEl = document.getElementById("no-results");

    function getCards(){
        return Array.from(document.querySelectorAll(".entry-card"));
    }
  
    function resetControls() {
      if (fromInput) fromInput.value = "";
      if (toInput) toInput.value = "";
      if (moodSelect) moodSelect.value = "";
    }

    function expandCollapsible() {
        const collapsible = document.querySelector(".collapsible");
        if (!collapsible) return;
        // Only click if not already active
        if (!collapsible.classList.contains("active")) {
            collapsible.click();
        }
    }
  
    function showAllEntries() {
        expandCollapsible();
        
        const entryCards = getCards();
        entryCards.forEach(card => card.style.display = "");
        if (noResultsEl) noResultsEl.style.display = "none";
        const countEl = document.querySelector(".collapsible .entry-count");
        if (countEl) countEl.textContent = entryCards.length;
        
    }
  
    function applyFilters() {

        expandCollapsible();

        const entryCards=getCards();
        const selectedMood = moodSelect.value.toLowerCase();

        const fromDate = fromInput.value ? new Date(fromInput.value) : null;
        const toDate = toInput.value ? new Date(toInput.value) : null;

        let visibleCount = 0;
        entryCards.forEach(card => {
            const cardMood = (card.dataset.mood || "").toLowerCase();
            let show = true;
            // Mood filter
            if (selectedMood && cardMood !== selectedMood) {
                show = false;
            }

            // --- Date filtering ---
            const cardDateRaw = card.dataset.date;   // "2025-02-09"
            const cardDate = cardDateRaw ? new Date(cardDateRaw) : null;

            if (fromDate && cardDate < fromDate) show = false;
            if (toDate && cardDate > toDate) show = false;
            
            card.style.display = show ? "" : "none";
            if (show) visibleCount++;
        });
        // Update collapsible header count
        const countEl = document.querySelector(".collapsible .entry-count");
        if (countEl) countEl.textContent = visibleCount;
        
    }
  
    applyBtn.addEventListener("click", applyFilters);
  
    clearBtn.addEventListener("click", () => {
        resetControls();
        showAllEntries();
        // Remove filter params from URL without reloading
        if (window.location.search) {
            const url = new URL(window.location);
            url.search = "";
            window.history.replaceState({}, "", url.toString());
        }
    });
}