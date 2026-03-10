// calls all of the functions in the js files with mj_... in the name
console.log("prev_journal_entry.js loaded");

import { Collapsibles } from "./mj_collapsible.js";
import { ClickEntryCard } from "./mj_entry_card.js";
import { FilteringEntries } from "./mj_filtering.js";

document.addEventListener("DOMContentLoaded",() => {
  Collapsibles();
  ClickEntryCard();
  FilteringEntries();
  
});

