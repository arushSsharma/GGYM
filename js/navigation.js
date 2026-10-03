// js/navigation.js

export function initNavigation() {
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const navItems = document.querySelectorAll('.bottom-nav .nav-item');

  navItems.forEach((item) => {
    const href = item.getAttribute('href');
    if (href === currentPath) {
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');
    } else {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    }
  });
}

// Auto-run if bottom navigation is in DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNavigation);
} else {
  initNavigation();
}