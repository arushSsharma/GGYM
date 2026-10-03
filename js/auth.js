// js/auth.js
import { auth, db } from './firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js';
import { doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';
import { showToast } from './utils.js';

const googleProvider = new GoogleAuthProvider();

/**
 * Create default user document in Firestore on initial registration
 */
async function initializeUserDoc(user) {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: user.uid,
      name: user.displayName || user.email.split('@')[0],
      email: user.email,
      photoURL: user.photoURL || null,
      age: null,
      gender: null,
      heightCm: null,
      weightKg: null,
      targetWeightKg: null,
      fitnessGoal: null,
      activityLevel: null,
      dailyCalories: null,
      bmr: null,
      bmi: null,
      currentStreak: 0,
      totalWorkouts: 0,
      lastWorkoutDate: null,
      completedOnboarding: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}

/**
 * Register with Email and Password
 */
export async function registerWithEmail(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await initializeUserDoc(userCredential.user);
    window.location.replace('onboarding.html');
  } catch (error) {
    showToast(error.message.replace('Firebase: ', ''), 'error');
    throw error;
  }
}

/**
 * Sign in with Email and Password
 */
export async function loginWithEmail(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, 'users', userCredential.user.uid));
    
    if (userSnap.exists() && userSnap.data().completedOnboarding) {
      window.location.replace('dashboard.html');
    } else {
      window.location.replace('onboarding.html');
    }
  } catch (error) {
    showToast(error.message.replace('Firebase: ', ''), 'error');
    throw error;
  }
}

/**
 * Sign in with Google
 */
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await initializeUserDoc(user);
      window.location.replace('onboarding.html');
    } else if (userSnap.data().completedOnboarding) {
      window.location.replace('dashboard.html');
    } else {
      window.location.replace('onboarding.html');
    }
  } catch (error) {
    showToast(error.message.replace('Firebase: ', ''), 'error');
    throw error;
  }
}

/**
 * Send Password Reset Email
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    showToast('Password reset link sent to your email', 'success');
  } catch (error) {
    showToast(error.message.replace('Firebase: ', ''), 'error');
    throw error;
  }
}

/**
 * Sign Out and Clear Session Cache
 */
export async function logoutUser() {
  try {
    await signOut(auth);
    localStorage.removeItem('ggym-routine');
    localStorage.removeItem('ggym-active-category');
    localStorage.removeItem('ggym-custom-routine');
    localStorage.removeItem('ggym-current-workout');
    window.location.replace('login.html');
  } catch (error) {
    showToast('Failed to sign out', 'error');
  }
}