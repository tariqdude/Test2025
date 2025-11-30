/**
 * Setup spotlight effect for cards
 * Cards with class 'card-spotlight' will have a mouse-tracking gradient
 */
export function setupSpotlight() {
  const cards = document.querySelectorAll('.card-spotlight');

  cards.forEach(card => {
    if (!(card instanceof HTMLElement)) return;

    card.addEventListener('mousemove', (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    });
  });
}

// Run on initial load
if (document.readyState === 'complete') {
  setupSpotlight();
} else {
  document.addEventListener('DOMContentLoaded', setupSpotlight);
}

// Run on View Transitions navigation
document.addEventListener('astro:page-load', setupSpotlight);
