// function for past entry collapsable

export function Collapsibles(){
    const collapsibles = document.querySelectorAll(".collapsible");
    collapsibles.forEach((item) => {
        item.addEventListener("click", () => {
            console.log("Collapsible clicked!");
            item.classList.toggle("active");
            const content = item.nextElementSibling;
            if (content.style.maxHeight) {
                content.style.maxHeight = null;
            } else {
                content.style.maxHeight = content.scrollHeight + "px";
            }
        });
    });
}