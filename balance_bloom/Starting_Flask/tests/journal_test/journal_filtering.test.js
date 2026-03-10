// runs from a root of journal_test

import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
import { FilteringEntries } from "../../bloom/static/js/mj_filtering.js";


let window, document;

// Recreates the DOM for each test
function setupDOM() {
  const dom = new JSDOM(`
    <button id="filter-clear"></button>
    <button id="filter-apply"></button>

    <input id="filter-from" />
    <input id="filter-to" />
    <select id="filter-mood">
      <option value=""></option>
      <option value="great"></option>
      <option value="bad"></option>
    </select>

    <div class="collapsible">
      <span class="entry-count">0</span>
    </div>

    <div id="no-results" style="display:none;"></div>

    <div class="entry-card" data-mood="great" data-date="2025-02-01"></div>
    <div class="entry-card" data-mood="bad" data-date="2025-02-03"></div>
    <div class="entry-card" data-mood="great" data-date="2025-02-10"></div>
  `);

  window = dom.window;
  document = dom.window.document;

  // Simulate collapsible behavior
  document.querySelector(".collapsible").addEventListener("click", function () {
    this.classList.add("active");
  });

  global.window = window;
  global.document = document;

  // Initialize component
  FilteringEntries();
}

beforeEach(setupDOM);

//
// 1. TEST MOOD FILTERING
//
test("FilteringEntries: filters by mood correctly", () => {
  const moodSelect = document.getElementById("filter-mood");
  moodSelect.value = "great";

  document.getElementById("filter-apply").click();

  const visibleCards = [...document.querySelectorAll(".entry-card")]
    .filter(c => c.style.display !== "none");

  assert.strictEqual(visibleCards.length, 2);
  visibleCards.forEach(card => assert.strictEqual(card.dataset.mood, "great"));

  assert.strictEqual(document.querySelector(".entry-count").textContent, "2");
});

//
// 2. TEST DATE RANGE FILTERING
//
test("FilteringEntries: filters by date range", () => {
  document.getElementById("filter-from").value = "2025-02-01";
  document.getElementById("filter-to").value = "2025-02-03";

  document.getElementById("filter-apply").click();

  const visible = [...document.querySelectorAll(".entry-card")]
    .filter(c => c.style.display !== "none")
    .map(c => c.dataset.date);

  assert.deepStrictEqual(visible, ["2025-02-01", "2025-02-03"]);
});

//
// 3. TEST COMBINED FILTERING
//
test("FilteringEntries: applies mood AND date filters together", () => {
  document.getElementById("filter-mood").value = "great";
  document.getElementById("filter-from").value = "2025-02-05";
  document.getElementById("filter-to").value = "2025-02-15";

  document.getElementById("filter-apply").click();

  const visible = [...document.querySelectorAll(".entry-card")]
    .filter(c => c.style.display !== "none");

  assert.strictEqual(visible.length, 1);
  assert.strictEqual(visible[0].dataset.date, "2025-02-10");
});

//
// 4. TEST CLEAR BUTTON RESets EVERYTHING
//
test("FilteringEntries: clear button resets controls and shows everything", () => {
  document.getElementById("filter-from").value = "2025-02-01";
  document.getElementById("filter-to").value = "2025-02-03";
  document.getElementById("filter-mood").value = "bad";

  document.getElementById("filter-clear").click();

  assert.strictEqual(document.getElementById("filter-from").value, "");
  assert.strictEqual(document.getElementById("filter-to").value, "");
  assert.strictEqual(document.getElementById("filter-mood").value, "");

  const allVisible = [...document.querySelectorAll(".entry-card")]
    .every(c => c.style.display === "");

  assert.strictEqual(allVisible, true);
  assert.strictEqual(document.querySelector(".entry-count").textContent, "3");
});

//
// 5. TEST MALFORMED DATE HANDLING
//
test("FilteringEntries: malformed date does NOT crash and hides no cards", () => {
  document.getElementById("filter-from").value = "NOT_A_DATE";
  document.getElementById("filter-to").value = "";

  document.getElementById("filter-apply").click();

  const visible = [...document.querySelectorAll(".entry-card")]
    .filter(c => c.style.display !== "none");

  // All entries remain visible because invalid date → ignored
  assert.strictEqual(visible.length, 3);
});

//
// 6. TEST MISSING REQUIRED ELEMENTS DOES NOT THROW
//
test("FilteringEntries: missing required DOM elements causes graceful return", () => {
  const dom = new JSDOM(`<button id="filter-clear"></button>`);

  global.window = dom.window;
  global.document = dom.window.document;

  // Should not throw
  FilteringEntries();

  assert.strictEqual(typeof FilteringEntries, "function");
});