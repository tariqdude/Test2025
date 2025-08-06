// Theme switching functionality
function setTheme(themeName) {
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('preferred-theme', themeName);
  
  // Dispatch theme change event
  window.dispatchEvent(new CustomEvent('theme-changed', {
    detail: { theme: themeName }
  }));
}

function getPreferredTheme() {
  const saved = localStorage.getItem('preferred-theme');
  if (saved) return saved;
  
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Initialize theme on page load
document.addEventListener('DOMContentLoaded', function() {
  const preferredTheme = getPreferredTheme();
  setTheme(preferredTheme);
});

// Listen for system theme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
  if (!localStorage.getItem('preferred-theme')) {
    setTheme(e.matches ? 'dark' : 'light');
  }
});

// Export theme utilities to global scope
window.themeUtils = {
  setTheme: setTheme,
  getPreferredTheme: getPreferredTheme,
  availableThemes: ['dark', 'light', 'cyberpunk']
};
