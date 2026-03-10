import test from "node:test";
import assert from "node:assert/strict";
import { calcOvulationDays, calcFertileWindow } from "../../bloom/static/js/ct_fertility.js";

test("calcOvulationDays calculated the first ovulation date correctly", () => {
    try {
        const input_cycleLength = 28;
        const input_Start = new Date(2025, 9, 28); // October 28, 2025
        const output = calcOvulationDays(input_cycleLength, input_Start);
        const expected = '11-10-2025';
        assert.deepStrictEqual(output[0], expected);
        console.log('✅ Passed: Cycle length of ', input_cycleLength, ' and start date of ',
            input_Start, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});

test("calcOvulationDays calculated the first ovulation date correctly", () => {
    try {
        const input_cycleLength = 30;
        const input_Start = new Date(2025, 6, 1); // July 1, 2025
        const output = calcOvulationDays(input_cycleLength, input_Start);
        const expected = '7-16-2025';
        assert.deepStrictEqual(output[0], expected);
        console.log('✅ Passed: Cycle length of ', input_cycleLength, ' and start date of ',
            input_Start, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});

test("calcFertileWindow calculated the first fertile date of the next fertile window correctly", () => {
    try {
        const input_cycleLength = 28;
        const input_Start = new Date(2025, 9, 28); // October 28, 2025
        const output_ovulationDays = calcOvulationDays(input_cycleLength, input_Start);

        const input_nextOvulation = output_ovulationDays[0];
        const output = calcFertileWindow(input_cycleLength, input_nextOvulation);
        const expected = '11-5-2025';
        assert.deepStrictEqual(output[0], expected);
        console.log('✅ Passed: Cycle length of ', input_cycleLength, ' and start date of ',
            input_Start, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});

test("calcFertileWindow calculated the last fertile date of the next fertile window correctly", () => {
    try {
        const input_cycleLength = 28;
        const input_Start = new Date(2025, 9, 28); // October 28, 2025
        const output_ovulationDays = calcOvulationDays(input_cycleLength, input_Start);

        const input_nextOvulation = output_ovulationDays[0];
        const output = calcFertileWindow(input_cycleLength, input_nextOvulation);
        const expected = '11-11-2025';
        assert.deepStrictEqual(output[5], expected);
        console.log('✅ Passed: Cycle length of ', input_cycleLength, ' and start date of ',
            input_Start, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});