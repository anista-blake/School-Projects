document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const fontSwatches = document.querySelectorAll('input.font-size-select');

    colorSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const newColor = swatch.value;
            body.dataset.accentColor = newColor;
        });
    });

    fontSwatches.forEach(swatch => {
        swatch.addEventListener('click', () => {
            const newSize = swatch.value;
            body.dataset.fontSize = newSize;
        });
    });
});