"use strict";

export function calcOvulationDays(cycleLength, predictedStart) {    
    let ovulationDates = [];

    let currentOvulationDate = new Date(predictedStart);
    currentOvulationDate.setDate(currentOvulationDate.getDate() + (cycleLength - 15));

    for (let i = 0; i < 12; i++) { // calculates ovulation days for 12 months
        let dateKey = `${currentOvulationDate.getMonth() + 1}-${currentOvulationDate.getDate()}-${currentOvulationDate.getFullYear()}`;
        //console.log(`Ovulation date is: ${dateKey}`);
        ovulationDates.push(dateKey);
        
        currentOvulationDate.setDate(currentOvulationDate.getDate() + (cycleLength - 1))
    }

    return ovulationDates;
}

export function calcFertileWindow(cycleLength, ovulationStartDate) {    
    let fertileDates = [];

    let currentFertileDates = new Date(ovulationStartDate);
    currentFertileDates.setDate(currentFertileDates.getDate() - 5);

    for (let i = 0; i < 12; i++) { // calculates fertile dates for 12 months
        let trackingDate = new Date(currentFertileDates);
        for (let j = 0; j < 6; j++) { // calculates 5 days ahead of ovulation date
            let dateKey = `${trackingDate.getMonth() + 1}-${trackingDate.getDate()}-${trackingDate.getFullYear()}`;
            
            if (j == 5) { // accounts for the day after ovulation date
                trackingDate.setDate(trackingDate.getDate() + 1);
                dateKey = `${trackingDate.getMonth() + 1}-${trackingDate.getDate()}-${trackingDate.getFullYear()}`;
                fertileDates.push(dateKey);
                break;
            }
            trackingDate.setDate(trackingDate.getDate() + 1);
            fertileDates.push(dateKey);
        }
        currentFertileDates.setDate(currentFertileDates.getDate() + (cycleLength - 1));
    }

    return fertileDates;
}