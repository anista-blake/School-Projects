    // Character count logic for title and content
    document.addEventListener('DOMContentLoaded', () => {
    const title = document.getElementById('title');
    const content = document.getElementById('content');
    const titleCount = document.getElementById('titleCount');
    const contentCount = document.getElementById('contentCount');
    const titleLimit = 100;
    const contentLimit = 500;

    const updateCount = (el, counter, limit) => {
        const length = el.value.length;
        counter.textContent = `${length} / ${limit}`;
        //optional: change color if nearing limit
        counter.style.color = length > limit * 0.9 ? '#d9534f' : '';
    };
    if(title && content){

    title?.addEventListener('input', () => updateCount(title, titleCount, titleLimit));
    content?.addEventListener('input', () => updateCount(content, contentCount, contentLimit));

    updateCount(title, titleCount, titleLimit);
    updateCount(content, contentCount, contentLimit);
    }

    // added functionality so that the cancel button works with the character count code
    const cancelBtn = document.getElementById("cancel-btn");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", () => {
            // Disable HTML form validation when cancel is pressed
            const form = cancelBtn.closest("form");
            if (form) {
                form.noValidate = true;
            }
        });
    }

});