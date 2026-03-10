import test from "node:test";
import assert from "node:assert/strict";
import { sortDates } from "../../bloom/static/js/ct_helpers.js";

test("sortDates orders dates correctly: all backwards", () => {
    try {
        const input = ["11-27-2025", "10-31-2025", "2-14-2025", "12-25-2024"];
        const output = sortDates(input);
        const expected = ["12-25-2024", "2-14-2025", "10-31-2025", "11-27-2025"];
        assert.deepStrictEqual(output, expected);
        console.log('✅ Passed:', input, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});

test("sortDates orders dates correctly: some misplaced", () => {
    try {
        const input = ["3-15-2025", "1-1-2025", "12-30-2024"];
        const output = sortDates(input);
        const expected = ["12-30-2024", "1-1-2025", "3-15-2025"];
        assert.deepStrictEqual(output, expected);
        console.log('✅ Passed:', input, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});

test("sortDates orders dates correctly: already sorted", () => {
    try {
        const input = ["1-31-2025", "9-12-2025", "10-17-2025"];
        const output = sortDates(input);
        const expected = ["1-31-2025", "9-12-2025", "10-17-2025"];
        assert.deepStrictEqual(output, expected);
        console.log('✅ Passed:', input, '=>', expected);
    } catch (err) {
        console.error('❌ Failed:', err);
    }
});