// dashboard.js
// Collapsible journal entry behavior for dashboard
document.addEventListener('DOMContentLoaded', function () {
  const journalBox = document.querySelector('.journal-box');
  const journalContent = document.querySelector('.journal-content');

  if (!journalBox || !journalContent) return; // nothing to do

  // Ensure content starts collapsed
  journalContent.style.maxHeight = '0px';

  const toggle = () => {
    const isOpen = journalBox.classList.contains('active');

    if (isOpen) {
      // collapse
      journalContent.style.maxHeight = '0px';
      journalBox.classList.remove('active');
    } else {
      // expand to fit content
      const full = journalContent.scrollHeight;
      journalContent.style.maxHeight = full + 'px';
      journalBox.classList.add('active');
    }
  };

  // Click to toggle
  journalBox.addEventListener('click', toggle);

  // Keyboard accessibility: Enter or Space
  journalBox.setAttribute('tabindex', '0');
  journalBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  });

  // If content changes dynamically (e.g., loaded later), adjust expanded height
  const resizeObserver = new ResizeObserver(() => {
    if (journalBox.classList.contains('active')) {
      journalContent.style.maxHeight = journalContent.scrollHeight + 'px';
    }
  });

  resizeObserver.observe(journalContent);
});
