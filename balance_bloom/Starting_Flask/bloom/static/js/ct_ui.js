"use strict";

import {
    expStartDates, expEndDates, expCycleDays, predCycleDays, 
    ovulationDays, fertileDays,
    handleToggle
} from "./ct_logic.js";

// DOM elements that will be manipulated throughout the program
const datetxtEL = document.querySelector('.datetxt');
const datesEL = document.querySelector('.dates');
const btnEL = document.querySelectorAll('.calendar_headings .fa-solid');
const monthYearEL = document.querySelector('.month_year');
const startEL = document.getElementById('start');
const stopEL = document.getElementById('stop');

let dmObj = { // stores names of days and months
    days: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ],

    months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ],
};

let dateObj = new Date(); // represents today

let dayName = dmObj.days[dateObj.getDay()]; // day of the week
let month = dateObj.getMonth(); // month
let year = dateObj.getFullYear(); // year
let date = dateObj.getDate(); // date or day number of the month

// today's date
datetxtEL.innerHTML = `${dayName}, ${dmObj.months[month]} ${date}, ${year}`;

const displayCalendar = () => {
    let firstDayofMonth = new Date(year, month, 1).getDay(); // first day of the month
    let LastDateofMonth = new Date(year, month + 1, 0).getDate(); // last date of the month
    let LastDayofMonth = new Date(year, month, LastDateofMonth).getDay(); // last day of month
    let LastDateofLastMonth = new Date(year, month, 0).getDate(); // last date of previous month
    let days = ""; // will be appended with days that correlate to currently viewed month

    // previous month last days
    for (let i = firstDayofMonth; i > 0; i--) {
        const dayNum = LastDateofLastMonth - i + 1;
        const dateKey = `${month}-${dayNum}-${year}`;
        let cls = "dummy";

        if (expStartDates.includes(dateKey)) cls += " start-marked";
        else if (expEndDates.includes(dateKey)) cls += " end-marked";
        else if (expCycleDays.includes(dateKey)) cls += " marked";
        else if (predCycleDays.includes(dateKey)) cls += " predicted";
        else if (ovulationDays.includes(dateKey)) cls += " ovulation";
        else if (fertileDays.includes(dateKey)) cls += " fertile";
        days += `<li class="${cls}">${dayNum}</li>`;
    }

    // current month days
    for (let i = 1; i <= LastDateofMonth; i++) {
        let checkToday = i === dateObj.getDate() && 
            month === new Date().getMonth() && 
            year === new Date().getFullYear() ? "today" : "";
        const dateKey = `${month + 1}-${i}-${year}`;
        let cls = `real-day ${checkToday}`;

        if (expStartDates.includes(dateKey)) cls += " start-marked";
        else if (expEndDates.includes(dateKey)) cls += " end-marked";
        else if (expCycleDays.includes(dateKey)) cls += " marked";
        else if (predCycleDays.includes(dateKey)) cls += " predicted";
        else if (ovulationDays.includes(dateKey)) cls += " ovulation";
        else if (fertileDays.includes(dateKey)) cls += " fertile";
        days += `<li class="${cls}">${i}</li>`;
    }

    // next month first days
    for (let i = LastDayofMonth; i < 6; i++) {
        const dayNum = i - LastDayofMonth + 1;
        const dateKey = `${month + 2}-${dayNum}-${year}`;
        let cls = "dummy";
        if (expStartDates.includes(dateKey)) cls += " start-marked";
        else if (expEndDates.includes(dateKey)) cls += " end-marked";
        else if (expCycleDays.includes(dateKey)) cls += " marked";
        else if (predCycleDays.includes(dateKey)) cls += " predicted";
        else if (ovulationDays.includes(dateKey)) cls += " ovulation";
        else if (fertileDays.includes(dateKey)) cls += " fertile";
        days += `<li class="${cls}">${dayNum}</li>`;
    }

    datesEL.innerHTML = days; // display all days appropriate days for a month inside HTML file

    monthYearEL.innerHTML = `${dmObj.months[month]}, ${year}`; // display current month & year
}

// previous and next month buttons
btnEL.forEach((btns) => {
    btns.addEventListener('click', ()=> { // when a button is clicked
        month = btns.id === "prev" ? month - 1 : month + 1; // true: go back a month, false: go forward a month

        if (month < 0 || month > 11) { // constructs correct month/year from overflow
            date = new Date(year, month, new Date().getDate()); // date is a month behind/forward
            year = date.getFullYear();
            month = date.getMonth();
        } else {
            date = new Date();
        }

        displayCalendar(); // re-renders calendar
    })
})

startEL.addEventListener('change', (e) => { // listens for when the start toggle is checked
    handleToggle('start', e.target.checked);
})

stopEL.addEventListener('change', (e) => { // listens for when the stop toggle is checked
    handleToggle('end', e.target.checked);
})

datesEL.addEventListener('click', (e) => { // listens for when a day on the calendar is clicked (aka selected)
    const day = e.target.closest('.real-day'); // travels up the DOM to find the day with the specified class
    if (!day || !datesEL.contains(day)) return; // blocks dummy days from being selected

    const allSelected = datesEL.querySelectorAll('.selected');
    allSelected.forEach(d => d.classList.remove('selected')) // ensures that multiple days cannot be selected at the same time

    day.classList.add('selected'); // day officially becomes selected
    onDaySelected(day);
})

// ensures that toggles are only checked if the selected day is in the respective array
function onDaySelected(selectedEL) {
    const dayNum = parseInt(selectedEL.textContent);
    const dateKey = `${month + 1}-${dayNum}-${year}`;

    startEL.checked = false;
    stopEL.checked = false;

    if (expStartDates.includes(dateKey)) startEL.checked = true;
    if (expEndDates.includes(dateKey)) stopEL.checked = true;
}

export {
    dmObj, dateObj,
    month, year,
    displayCalendar
};