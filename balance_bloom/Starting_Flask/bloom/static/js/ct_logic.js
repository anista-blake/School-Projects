"use strict";

import {
    dmObj, dateObj,
    month, year,
    displayCalendar
} from "./ct_ui.js";

import { calcFertileWindow, calcOvulationDays } from "./ct_fertility.js";
import { sortDates, getMatchingEndDate, nextPredictionMessage } from "./ct_helpers.js";

// DOM elements that will be manipulated throughout the program
const projectionEL = document.querySelector('.projected_date');
const countdownEL = document.querySelector('.days_countdown');
const clearButtonEL = document.querySelector('.clear-button');

let expStartDates = []; // stores marked start dates
let expEndDates = []; // stores marked end dates
let expCycleDays = []; // stores period dates from start to finish
let predCycleDays = []; // stores predicted dates locally based off last start date
let ovulationDays = []; // NEW: stores predicted ovulation dates locally
let fertileDays = []; // NEW: stores fertile dates locally

let cycleStart = null; // temporarily holds marked start dates
let predictedStart = null; // temporarily holds predicted start dates

let periodLength = 4; // default value = 4 but can be changed
let cycleLength = 28; // default value = 28 but can be changed

//let periodTracking = true; // NEW: boolean that will connect to the database soon
let fertilityTracking = true; // NEW: boolean that will connect to the database soon

window.addEventListener("DOMContentLoaded", async () => {
    displayCalendar(); // always renders calendar first regardless of database values
  
    try {
        const res = await fetch("/get_cycle");
        if (!res.ok) throw new Error("No data found"); // will happen if there is no data on MongoDB

        const data = await res.json();
    
        // only update local arrays if data exists
        if (data.start_dates) expStartDates = data.start_dates;
        if (data.end_dates) expEndDates = data.end_dates;
        if (data.marked_dates) expCycleDays = data.marked_dates;

        if (expStartDates.length > 0) { // sorts so that prediction only works off of latest dates, not necessarily last inputted dates
            expStartDates = sortDates(expStartDates);
            expEndDates = sortDates(expEndDates);

            const lastStart = expStartDates[expStartDates.length - 1];
            const [m, d, y] = lastStart.split("-").map(Number);
            predictedStart = new Date(y, m - 1, d);
        }

        if (data.period_length) periodLength = data.period_length;
        if (data.cycle_length) cycleLength = data.cycle_length;
        if (data.fertility_tracking !== undefined) fertilityTracking = data.fertility_tracking;

        if (fertilityTracking) {
            ovulationDays = calcOvulationDays(cycleLength, predictedStart);
            fertileDays = calcFertileWindow(cycleLength, new Date(ovulationDays[0]));
        } else { 
            ovulationDays = [];
            fertileDays = [];
        }

        // re-renders the calendar with fetched data
        displayCalendar();
        updateSummary();

    } catch (err) {
        console.log("No existing data or fetch failed:", err.message);
    }
});

function updateSummary() {
    if (!expStartDates.length || !cycleLength) return;

    const today = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
    const lastStart = expStartDates[expStartDates.length - 1];
    const [m, d, y] = lastStart.split("-").map(Number);
    const cycleStart = new Date(y, m - 1, d);

    // find corresponding end date (if any)
    const cycleEnd = getMatchingEndDate(cycleStart, expEndDates);

    // determine if period is ongoing
    let dayOfCycle = Math.floor((today - cycleStart) / (1000 * 3600 * 24)) + 1;
    let periodOngoing = !cycleEnd || cycleEnd >= today;

    if (periodOngoing && (dayOfCycle > 0)) {
        // mid-period
        countdownEL.innerHTML = `Day ${dayOfCycle}`;
        const nextStart = cyclePrediction(cycleStart);
        projectionEL.innerHTML = `Projected start date is ${dmObj.months[nextStart.getMonth()]} ${nextStart.getDate()}`;
    } else {
        // period over → next predicted start
        const predictedStartDate = cyclePrediction(cycleStart);
        predictedStart = predictedStartDate;
        nextPredictionMessage(predictedStartDate, today, countdownEL, projectionEL, dmObj);
    }

    // recalc fertility/ovulation for current cycleStart
    if (fertilityTracking) {
        ovulationDays = calcOvulationDays(cycleLength, cycleStart);
        fertileDays = calcFertileWindow(cycleLength, new Date(ovulationDays[0]));
    } else {
        ovulationDays = [];
        fertileDays = [];
        deleteFertilityMarks();
    }

    displayCalendar();
    markPrediction();
}

function cyclePrediction(expStartDate) { // cycle prediction algorithm
    let current = new Date(expStartDate);
    let nextStart;

    // generate future cycles for several years ahead
    for (let i = 0; i < 12; i++) { // 12 months for now
        const next = new Date(current);
        next.setDate(next.getDate() + cycleLength - 1);
        const dateKey = `${next.getMonth() + 1}-${next.getDate()}-${next.getFullYear()}`;
        
        if (i == 0) {
            nextStart = next; // make nextStart equal to the first prediction
        }

        predCycleDays.push(dateKey);
        current = next;
    }
    return nextStart;
}

function markExpected() {
    if (!cycleStart) return;

    document.querySelectorAll('.real-day').forEach(el => el.classList.remove('marked'));

    for (let i = 0; i < periodLength; i++) {
        const day = new Date(cycleStart);
        day.setDate(day.getDate() + i); // handles month/year rollover automatically
        const dateKey = `${day.getMonth() + 1}-${day.getDate()}-${day.getFullYear()}`;
        if (!expCycleDays.includes(dateKey)) {
            expCycleDays.push(dateKey);
        }
    }

    // will add onto this functionality later - should maybe be its own function
    /*const today = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    // calculate how many days to mark
    const defaultMarkDays = periodLength;
    const daysSinceStart = Math.floor((today - cycleStart) / (1000 * 3600 * 24)) + 1;
    const markDays = Math.max(defaultMarkDays, daysSinceStart); // ensures marking goes at least until today

    for (let i = 0; i < markDays; i++) {
        const day = new Date(cycleStart);
        day.setDate(day.getDate() + i);
        const dateKey = `${day.getMonth() + 1}-${day.getDate()}-${day.getFullYear()}`;
        if (!expCycleDays.includes(dateKey)) {
            expCycleDays.push(dateKey);
        }
    }*/

    // update the DOM immediately
    document.querySelectorAll('.real-day').forEach(el => {
        const dayNum = parseInt(el.textContent);
        const elKey = `${month + 1}-${dayNum}-${year}`;
        if (expCycleDays.includes(elKey)) {
            el.classList.add('marked');
        }
    });

    updateSummary();
}

function deleteExpected(clickedDay = null) {
    // remove start and end from arrays
    let startKey;
    if (clickedDay) {
        const dayNum = parseInt(clickedDay.textContent);
        startKey = `${month + 1}-${dayNum}-${year}`;
    } else if (cycleStart) {
        startKey = `${cycleStart.getMonth() + 1}-${cycleStart.getDate()}-${cycleStart.getFullYear()}`;
    } else return; // nothing selected

    // find the index of the start date
    const index = expStartDates.indexOf(startKey);
    if (index === -1) return; // not found

    // remove start and corresponding end
    expStartDates.splice(index, 1);
    expEndDates.splice(index, 1);

    // clear predicted cycles if no start dates are left
    if (expStartDates.length === 0) {
        predCycleDays = [];
        predictedStart = null;
    }

    // rebuild expCycleDays from remaining start/end arrays
    const newMarked = [];
    for (let i = 0; i < expStartDates.length; i++) {
        const [sM, sD, sY] = expStartDates[i].split('-').map(Number);
        const [eM, eD, eY] = expEndDates[i].split('-').map(Number);
        let temp = new Date(sY, sM - 1, sD);
        const end = new Date(eY, eM - 1, eD);
        while (temp <= end) {
            const key = `${temp.getMonth() + 1}-${temp.getDate()}-${temp.getFullYear()}`;
            newMarked.push(key);
            temp.setDate(temp.getDate() + 1);
        }
    }
    expCycleDays = newMarked;

    updateSummary();
    displayCalendar(); // rebuild calendar to refresh all markings

    cycleStart = null; // clear current selection
}

function markPrediction() {
    if (!predictedStart) return;

    predCycleDays = [];

    for (let cycle = 0; cycle < 12; cycle++) { // 12 months for now
        // compute start date for this cycle
        const cycleStart = new Date(predictedStart);
        cycleStart.setDate(cycleStart.getDate() + cycle * (cycleLength - 1));

        // generate all period days for this cycle
        for (let p = 0; p < periodLength; p++) {
            const day = new Date(cycleStart);
            day.setDate(day.getDate() + p); // consecutive days
            const dateKey = `${day.getMonth() + 1}-${day.getDate()}-${day.getFullYear()}`;
            if (!predCycleDays.includes(dateKey)) {
                predCycleDays.push(dateKey);
            }
        }
    }

    // update the DOM immediately
    document.querySelectorAll('.real-day').forEach(el => {
        const dayNum = parseInt(el.textContent);
        const dateKey = `${month + 1}-${dayNum}-${year}`;
        if (predCycleDays.includes(dateKey)) {
            el.classList.add('predicted');
        }
    })
}

function deleteFertilityMarks() {
    document.querySelectorAll('.fertile, .ovulation').forEach(el => {
        el.classList.remove('fertile', 'ovulation');
    });
}

function handleToggle(toggleType, checked) {
    const selectedDay = document.querySelector('.selected');
    if (!selectedDay) {
        console.log('No day selected.');
        return;
    }

    const dayNum = parseInt(selectedDay.textContent);
    const dateKey = `${month + 1}-${dayNum}-${year}`;
    const thisDate = new Date(year, month, dayNum);
    const today = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (toggleType === 'start') {
        if (checked) {
            if (!expStartDates.includes(dateKey)) {
                expStartDates.push(dateKey);
                selectedDay.classList.add('start-marked');
                
                cycleStart = thisDate;
                predCycleDays = predCycleDays.filter(d => new Date(d) < cycleStart);
                predictedStart = cyclePrediction(cycleStart);
                
                markExpected();
                markPrediction();

                // log cycle start
                sendCycleEntry({
                    start_dates: expStartDates.slice(),
                    period_length: periodLength,
                    cycle_length: cycleLength,
                    marked_dates: expCycleDays.slice(),
                    client_ts: new Date().toISOString()
                });
            }
        } else {
            // remove start/end and rebuild marked dates immediately
            selectedDay.classList.remove('start-marked');
            deleteExpected(selectedDay); // pass the clicked day

            // remove cycle start
            deleteCycleEntry({
                start_dates: `${month + 1}-${parseInt(selectedDay.textContent)}-${year}`,
                period_length: periodLength,
                cycle_length: cycleLength,
                marked_dates: expCycleDays.slice(),
                client_ts: new Date().toISOString()
            });
        }
    }
    if (toggleType === 'end') {
        if (checked) {
            if (!expEndDates.includes(dateKey)) {                
                expEndDates.push(dateKey);
                selectedDay.classList.add('end-marked');

                // log cycle end
                sendCycleEntry({
                    end_dates: expEndDates.slice(),
                    period_length: periodLength,
                    cycle_length: cycleLength,
                    marked_dates: expCycleDays.slice(),
                    client_ts: new Date().toISOString()
                });
            }
        } else {
            expEndDates = expEndDates.filter(d => d !== dateKey);
            selectedDay.classList.remove('end-marked');

            // remove cycle end
            deleteCycleEntry({
                end_dates: dateKey,
                period_length: periodLength,
                cycle_length: cycleLength,
                marked_dates: expCycleDays.slice(),
                client_ts: new Date().toISOString()
            });
        }
    }
    updateSummary();
}

clearButtonEL.addEventListener('click', () => {
    console.log("Button pressed");
    clearAllEntries({
        start_dates: [],
        end_dates: [],
        marked_dates: [],
        period_length: periodLength,
        cycle_length: cycleLength,
        client_ts: new Date().toISOString()
    });
})

// sends changed data based on additions
async function sendCycleEntry(payload) {
    try {
        const url = window.CYCLE_ENTRY_API || "/cycle_entry";
        const res = await fetch(url, {
            method: "PUT",
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(()=>({}));
            console.warn("cycle-entry error", err);
        }
        return res.ok;
    } catch (e) {
        console.error("sendCycleEntry failed", e);
        return false;
    }
}

// sends changed data based on deletions
async function deleteCycleEntry(payload) {
    try {
        const url = window.CYCLE_DELETE || "/cycle_delete";
        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(()=>({}));
            console.warn("cycle-delete error", err);
        }
        return res.ok;
    } catch (e) {
        console.error("deleteCycleEntry failed", e);
        return false;
    }
}

async function clearAllEntries(payload) {
    try {
        const url = window.CYCLE_clear || "/cycle_clear";
        const res = await fetch(url, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            credentials: "same-origin",
            body: JSON.stringify(payload)
        });
        if (!res.ok) {
            const err = await res.json().catch(()=>({}));
            console.warn("cycle-delete error", err);
        }
        return res.ok;
    } catch (e) {
        console.error("deleteCycleEntry failed", e);
        return false;
    }
}

export {
    expStartDates, expEndDates, expCycleDays, predCycleDays, 
    ovulationDays, fertileDays,
    handleToggle
};