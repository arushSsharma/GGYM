// js/utils.js

/**
 * Toast Notification System
 * Auto-injects container if missing, auto-dismisses after 2600ms
 */
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
    toast.style.transition = 'opacity 180ms ease, transform 180ms ease';
    setTimeout(() => toast.remove(), 180);
  }, 2600);
}

/**
 * Animate numeric counter from 0 to target value (500ms ease-out)
 */
export function animateValue(element, start, end, duration = 500) {
  if (!element) return;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (isReducedMotion) {
    element.textContent = end;
    return;
  }

  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    // Cubic ease-out curve
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(easeOut * (end - start) + start);
    element.textContent = current;
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      element.textContent = end;
    }
  };
  window.requestAnimationFrame(step);
}

/**
 * Calculate consecutive workout streak from an array of workout date strings (YYYY-MM-DD)
 */
export function calculateStreak(workoutDates = []) {
  if (!workoutDates || workoutDates.length === 0) return 0;

  // Deduplicate and sort descending
  const uniqueDates = Array.from(new Set(workoutDates))
    .map(d => new Date(d + 'T00:00:00'))
    .sort((a, b) => b - a);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const latest = uniqueDates[0];
  let streak = 0;

  // Streak is only active if latest workout was today or yesterday
  if (latest.getTime() !== today.getTime() && latest.getTime() !== yesterday.getTime()) {
    return 0;
  }

  let expectedDate = new Date(latest);

  for (let i = 0; i < uniqueDates.length; i++) {
    const current = uniqueDates[i];
    if (current.getTime() === expectedDate.getTime()) {
      streak++;
      expectedDate.setDate(expectedDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Return current date in ISO format YYYY-MM-DD
 */
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date string to readable label (e.g., "Oct 4" or "Today")
 */
export function formatDateLabel(dateString) {
  if (!dateString) return '';
  const today = getTodayDateString();
  if (dateString === today) return 'Today';

  const d = new Date(dateString + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}