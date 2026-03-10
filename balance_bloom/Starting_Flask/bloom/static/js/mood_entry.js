// Mood selection logic for journal entry
let selectedMood = "";

document.addEventListener("DOMContentLoaded", () => {
  const moodButtons = document.querySelectorAll('.mood-selection');
  const moodInput = document.getElementById('mood-input');


    let selectedMood = moodInput.value || "";
    //checks for saved mood
    if (selectedMood){
      const selectedButton = document.querySelector(`.mood-selection[data-mood="${selectedMood}"]`);
      if (selectedButton){
        selectedButton.classList.add('selected');
      }
    }
    moodButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const clickedMood = btn.getAttribute("data-mood");
        // toggle logic
        if (selectedMood === clickedMood) {
          btn.classList.remove("selected");
          moodInput.value = "";
          selectedMood = "";
        } else { 
          moodButtons.forEach(el => el.classList.remove('selected'));
          btn.classList.add('selected');
          moodInput.value = clickedMood;
          selectedMood = clickedMood;
        }
        
      });
    });
    
  //}
});