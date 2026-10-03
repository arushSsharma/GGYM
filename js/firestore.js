// js/firestore.js
import { db } from './firebase-config.js';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js';

// ====================================================================
// USER PROFILE OPERATIONS
// ====================================================================

/**
 * Fetch a user's core profile document
 */
export async function getUserProfile(uid) {
  if (!uid) throw new Error('Missing UID for profile lookup');
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data() : null;
}

/**
 * Update user profile attributes
 */
export async function updateUserProfile(uid, data) {
  if (!uid) throw new Error('Missing UID for profile update');
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

// ====================================================================
// WORKOUT SESSION OPERATIONS
// ====================================================================

/**
 * Create a new workout session record under users/{uid}/workouts/{workoutId}
 * Also increments totalWorkouts count and updates lastWorkoutDate on user profile
 */
export async function createWorkout(uid, workoutData) {
  if (!uid) throw new Error('Missing UID for workout logging');

  const workoutsCol = collection(db, 'users', uid, 'workouts');
  const newWorkoutRef = doc(workoutsCol);
  const workoutId = newWorkoutRef.id;

  const payload = {
    workoutId,
    date: workoutData.date, // YYYY-MM-DD
    startedAt: workoutData.startedAt, // ISO string
    completedAt: workoutData.completedAt, // ISO string
    workoutType: workoutData.workoutType || 'General',
    durationMinutes: Number(workoutData.durationMinutes) || 0,
    totalExercises: Number(workoutData.totalExercises) || 0,
    completedExercises: Number(workoutData.completedExercises) || 0,
    totalSets: Number(workoutData.totalSets) || 0,
    totalReps: Number(workoutData.totalReps) || 0,
    totalVolume: Number(workoutData.totalVolume) || 0,
    notes: workoutData.notes || '',
    exercises: workoutData.exercises || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(newWorkoutRef, payload);

  // Sync summary metrics to root profile
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  const currentTotal = userSnap.exists() ? (userSnap.data().totalWorkouts || 0) : 0;

  await updateDoc(userRef, {
    totalWorkouts: currentTotal + 1,
    lastWorkoutDate: workoutData.date,
    updatedAt: serverTimestamp()
  });

  return workoutId;
}

/**
 * Retrieve recent workouts ordered by date descending
 */
export async function getWorkouts(uid, maxResults = 50) {
  if (!uid) return [];
  const workoutsCol = collection(db, 'users', uid, 'workouts');
  const q = query(workoutsCol, orderBy('date', 'desc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => docSnap.data());
}

/**
 * Update an existing workout record
 */
export async function updateWorkout(uid, workoutId, updatedFields) {
  if (!uid || !workoutId) throw new Error('Missing UID or workoutId for update');
  const workoutRef = doc(db, 'users', uid, 'workouts', workoutId);
  await updateDoc(workoutRef, {
    ...updatedFields,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a past workout record
 */
export async function deleteWorkout(uid, workoutId) {
  if (!uid || !workoutId) throw new Error('Missing UID or workoutId for deletion');
  const workoutRef = doc(db, 'users', uid, 'workouts', workoutId);
  await deleteDoc(workoutRef);
}

// ====================================================================
// WEIGHT LOG OPERATIONS
// ====================================================================

/**
 * Record a body weight measurement under users/{uid}/weightLogs
 * Also keeps the current weight on the root profile document in sync
 */
export async function addWeightLog(uid, weightKg, dateStr) {
  if (!uid || !weightKg) throw new Error('Invalid parameters for weight log');
  const parsedWeight = parseFloat(weightKg);

  const logsCol = collection(db, 'users', uid, 'weightLogs');
  const newLogRef = doc(logsCol);

  await setDoc(newLogRef, {
    logId: newLogRef.id,
    weightKg: parsedWeight,
    date: dateStr,
    createdAt: serverTimestamp()
  });

  // Keep root profile in sync with latest weight
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    weightKg: parsedWeight,
    updatedAt: serverTimestamp()
  });

  return newLogRef.id;
}

/**
 * Retrieve chronological weight history for tracking & charts
 */
export async function getWeightLogs(uid, maxResults = 100) {
  if (!uid) return [];
  const logsCol = collection(db, 'users', uid, 'weightLogs');
  const q = query(logsCol, orderBy('date', 'asc'), limit(maxResults));
  const snapshot = await getDocs(q);

  return snapshot.docs.map(docSnap => docSnap.data());
}