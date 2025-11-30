/**
 * Setup scroll animations using IntersectionObserver
 * Elements with class 'scroll-animate' will fade in when scrolled into view
 */
export function setupScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
  };

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fade-in-up');
        entry.target.classList.remove('opacity-0');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const elements = document.querySelectorAll('.scroll-animate');
  elements.forEach(el => {
    el.classList.add('opacity-0'); // Ensure hidden initially
    observer.observe(el);
  });
}

// Run on initial load if not using View Transitions
if (document.readyState === 'complete') {
  setupScrollAnimations();
} else {
  document.addEventListener('DOMContentLoaded', setupScrollAnimations);
}

// Run on View Transitions navigation
document.addEventListener('astro:page-load', setupScrollAnimations);
