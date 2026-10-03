// js/auth-guard.js
import { auth, db } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

const protectedPages = [
  'onboarding.html',
  'dashboard.html',
  'workout.html',
  'log-workout.html',
  'history.html',
  'progress.html',
  'calculator.html',
  'exercises.html',
  'profile.html'
];

const publicPages = ['index.html', 'login.html', 'register.html'];

/**
 * Extract clean filename from current pathname
 */
function getCurrentPage() {
  const path = window.location.pathname;
  const page = path.split('/').pop();
  return page === '' ? 'index.html' : page;
}

/**
 * Route protection listener
 */
export function initAuthGuard(callback) {
  const currentPage = getCurrentPage();

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Unauthenticated user attempting to access a protected page
      if (protectedPages.includes(currentPage)) {
        window.location.replace('login.html');
        return;
      }
      if (callback) callback(null);
    } else {
      // Authenticated user on a public page or onboarding
      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const data = snap.exists() ? snap.data() : null;
        const completed = data?.completedOnboarding === true;

        if (publicPages.includes(currentPage)) {
          if (completed) {
            window.location.replace('dashboard.html');
          } else {
            window.location.replace('onboarding.html');
          }
          return;
        }

        if (currentPage === 'onboarding.html' && completed) {
          window.location.replace('dashboard.html');
          return;
        }

        if (callback) callback(user, data);
      } catch (err) {
        console.error('Guard auth state check error:', err);
        if (callback) callback(user, null);
      }
    }
  });
}