"use strict";

export function sortDates(arr) {
  return arr.sort((a, b) => {
    const [am, ad, ay] = a.split("-").map(Number);
    const [bm, bd, by] = b.split("-").map(Number);
    const da = new Date(ay, am - 1, ad);
    const db = new Date(by, bm - 1, bd);
    return da - db; // if negative: a comes before b, if positive: a comes after b
  });
}

export function getMatchingEndDate(cycleStart, expEndDates) {
    let startTime = cycleStart.getTime();
    let matchingEnd = null;

    for (let end of expEndDates) {
        let [em, ed, ey] = end.split("-").map(Number);
        let endDate = new Date(ey, em - 1, ed);

        // end date must be AFTER the start AND must be the earliest such end
        if (endDate.getTime() >= startTime) {
            if (matchingEnd === null || endDate < matchingEnd) {
                matchingEnd = endDate;
            }
        }
    }

    return matchingEnd;
}

export function nextPredictionMessage(predictedStartDate, today, countdownEL, projectionEL, dmObj) {
    const daysUntilNext = Math.ceil((predictedStartDate - today) / (1000 * 3600 * 24));
        if (daysUntilNext < 0) {
            countdownEL.innerHTML = `${Math.abs(daysUntilNext)} days late`;
        } else if (daysUntilNext === 1) {
            countdownEL.innerHTML = `1 day left`;
        } else {
            countdownEL.innerHTML = `${daysUntilNext} days left`;
        }

        projectionEL.innerHTML = `Projected start date is ${dmObj.months[predictedStartDate.getMonth()]} ${predictedStartDate.getDate()}`;
}