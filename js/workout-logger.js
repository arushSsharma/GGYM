// js/workout-logger.js
import { initAuthGuard } from './auth-guard.js';
import { createWorkout } from './firestore.js';
import { showToast, getTodayDateString } from './utils.js';

let activeUser = null;
let workoutSession = null;
let timerInterval = null;

const typeSelect = document.getElementById('workout-type-select');
const workoutNameHeading = document.getElementById('logger-workout-name');
const exercisesContainer = document.getElementById('logger-exercises-list');
const generalNotesInput = document.getElementById('workout-general-notes');
const progressText = document.getElementById('logger-sets-progress');
const progressBar = document.getElementById('logger-progress-bar');
const finishBtn = document.getElementById('btn-finish-workout');
const timerDisplay = document.getElementById('session-timer-display');

initAuthGuard((user) => {
  if (!user) return;
  activeUser = user;
  initSession();
});

function initSession() {
  // Check if an in-progress session exists in localStorage
  const savedSession = localStorage.getItem('ggym-current-workout');

  if (savedSession) {
    try {
      workoutSession = JSON.parse(savedSession);
    } catch (e) {
      console.error('Error parsing stored session:', e);
      workoutSession = null;
    }
  }

  // If no saved session, initialize from selected routine template
  if (!workoutSession) {
    const routineCategory = localStorage.getItem('ggym-active-category') || 'Chest';
    const storedRoutine = localStorage.getItem('ggym-routine');
    let routineExercises = [];

    if (storedRoutine) {
      try {
        routineExercises = JSON.parse(storedRoutine);
      } catch (e) {
        routineExercises = [];
      }
    }

    workoutSession = {
      workoutType: mapCategoryToTitle(routineCategory),
      startedAt: new Date().toISOString(),
      date: getTodayDateString(),
      notes: '',
      exercises: routineExercises.map(ex => ({
        exerciseId: ex.exerciseId || ex.name.toLowerCase().replace(/\s+/g, '-'),
        name: ex.name,
        category: ex.category || routineCategory,
        notes: '',
        sets: Array.from({ length: ex.sets || 3 }, (_, i) => ({
          setNumber: i + 1,
          weightKg: ex.defaultWeight !== undefined ? ex.defaultWeight : 20,
          reps: ex.defaultReps || 10,
          completed: false
        }))
      }))
    };

    saveSessionState();
  }

  // Sync controls with session state
  typeSelect.value = workoutSession.workoutType || 'Chest & Push';
  workoutNameHeading.textContent = workoutSession.workoutType || 'Workout Session';
  generalNotesInput.value = workoutSession.notes || '';

  startSessionTimer();
  renderExercises();
  updateProgress();

  // Attach global event listeners
  typeSelect.addEventListener('change', (e) => {
    workoutSession.workoutType = e.target.value;
    workoutNameHeading.textContent = e.target.value;
    saveSessionState();
  });

  generalNotesInput.addEventListener('input', (e) => {
    workoutSession.notes = e.target.value;
    saveSessionState();
  });

  finishBtn.addEventListener('click', handleFinishWorkout);
}

function mapCategoryToTitle(category) {
  const titles = {
    Chest: 'Chest & Push',
    Back: 'Back & Pull',
    Shoulders: 'Shoulders & Delts',
    Legs: 'Legs & Lower Body',
    Arms: 'Arms (Biceps & Triceps)',
    Core: 'Core & Abdominals',
    Strength: 'Full Body Strength',
    Custom: 'Custom Workout'
  };
  return titles[category] || `${category} Session`;
}

function startSessionTimer() {
  if (timerInterval) clearInterval(timerInterval);
  const startTime = new Date(workoutSession.startedAt).getTime();

  const update = () => {
    const elapsedSecs = Math.max(0, Math.floor((Date.now() - startTime) / 1000));
    const mins = String(Math.floor(elapsedSecs / 60)).padStart(2, '0');
    const secs = String(elapsedSecs % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  };

  update();
  timerInterval = setInterval(update, 1000);
}

function saveSessionState() {
  localStorage.setItem('ggym-current-workout', JSON.stringify(workoutSession));
}

function renderExercises() {
  exercisesContainer.innerHTML = '';

  if (!workoutSession.exercises || workoutSession.exercises.length === 0) {
    exercisesContainer.innerHTML = `
      <div class="card" style="text-align: center; padding: 24px;">
        <p style="font-weight: 700; margin-bottom: 6px;">No exercises loaded</p>
        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 12px;">Choose a routine plan or add movements.</p>
        <a href="workout.html" class="btn btn-secondary">Select Routine</a>
      </div>
    `;
    return;
  }

  workoutSession.exercises.forEach((exercise, exIdx) => {
    const card = document.createElement('article');
    card.className = 'logger-exercise-card';
    card.innerHTML = `
      <div class="exercise-header-row">
        <div class="exercise-title-group">
          <h3>${exercise.name}</h3>
          <span class="exercise-category-tag">${exercise.category}</span>
        </div>
        <button type="button" class="btn-add-set" data-ex-idx="${exIdx}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add Set
        </button>
      </div>

      <div class="set-grid-header">
        <span>Set</span>
        <span>Kg</span>
        <span>Reps</span>
        <span>Done</span>
        <span></span>
      </div>

      <div class="set-rows-list" id="set-list-${exIdx}"></div>

      <textarea class="form-textarea exercise-notes-input" data-ex-idx="${exIdx}" placeholder="Exercise cues, adjustments, or form feedback...">${exercise.notes || ''}</textarea>
    `;

    const setListContainer = card.querySelector(`#set-list-${exIdx}`);
    exercise.sets.forEach((set, setIdx) => {
      const row = document.createElement('div');
      row.className = 'set-row';
      row.innerHTML = `
        <span class="set-number-label text-num">${set.setNumber}</span>
        <input type="number" step="0.5" min="0" max="999" class="set-input set-weight-input" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" value="${set.weightKg}">
        <input type="number" step="1" min="0" max="999" class="set-input set-reps-input" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" value="${set.reps}">
        <button type="button" class="set-checkbox ${set.completed ? 'completed' : ''}" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" aria-label="Toggle set ${set.setNumber} complete">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
        <button type="button" class="btn-remove-set" data-ex-idx="${exIdx}" data-set-idx="${setIdx}" aria-label="Remove set">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;
      setListContainer.appendChild(row);
    });

    exercisesContainer.appendChild(card);
  });

  bindDynamicListeners();
}

function bindDynamicListeners() {
  // Add set buttons
  document.querySelectorAll('.btn-add-set').forEach(btn => {
    btn.onclick = () => {
      const exIdx = parseInt(btn.dataset.exIdx, 10);
      const sets = workoutSession.exercises[exIdx].sets;
      const lastSet = sets[sets.length - 1];
      const newWeight = lastSet ? lastSet.weightKg : 20;
      const newReps = lastSet ? lastSet.reps : 10;

      sets.push({
        setNumber: sets.length + 1,
        weightKg: newWeight,
        reps: newReps,
        completed: false
      });

      saveSessionState();
      renderExercises();
      updateProgress();
    };
  });

  // Remove set buttons
  document.querySelectorAll('.btn-remove-set').forEach(btn => {
    btn.onclick = () => {
      const exIdx = parseInt(btn.dataset.exIdx, 10);
      const setIdx = parseInt(btn.dataset.setIdx, 10);
      workoutSession.exercises[exIdx].sets.splice(setIdx, 1);
      // Re-index remaining set numbers
      workoutSession.exercises[exIdx].sets.forEach((s, idx) => {
        s.setNumber = idx + 1;
      });
      saveSessionState();
      renderExercises();
      updateProgress();
    };
  });

  // Toggle set completion checkboxes
  document.querySelectorAll('.set-checkbox').forEach(btn => {
    btn.onclick = () => {
      const exIdx = parseInt(btn.dataset.exIdx, 10);
      const setIdx = parseInt(btn.dataset.setIdx, 10);
      const current = workoutSession.exercises[exIdx].sets[setIdx].completed;
      workoutSession.exercises[exIdx].sets[setIdx].completed = !current;
      saveSessionState();
      btn.classList.toggle('completed', !current);
      updateProgress();
    };
  });

  // Weight inputs
  document.querySelectorAll('.set-weight-input').forEach(input => {
    input.oninput = (e) => {
      const exIdx = parseInt(input.dataset.exIdx, 10);
      const setIdx = parseInt(input.dataset.setIdx, 10);
      workoutSession.exercises[exIdx].sets[setIdx].weightKg = parseFloat(e.target.value) || 0;
      saveSessionState();
    };
  });

  // Reps inputs
  document.querySelectorAll('.set-reps-input').forEach(input => {
    input.oninput = (e) => {
      const exIdx = parseInt(input.dataset.exIdx, 10);
      const setIdx = parseInt(input.dataset.setIdx, 10);
      workoutSession.exercises[exIdx].sets[setIdx].reps = parseInt(e.target.value, 10) || 0;
      saveSessionState();
    };
  });

  // Exercise notes inputs
  document.querySelectorAll('.exercise-notes-input').forEach(area => {
    area.oninput = (e) => {
      const exIdx = parseInt(area.dataset.exIdx, 10);
      workoutSession.exercises[exIdx].notes = e.target.value;
      saveSessionState();
    };
  });
}

function updateProgress() {
  let totalSets = 0;
  let completedSets = 0;

  workoutSession.exercises.forEach(ex => {
    ex.sets.forEach(s => {
      totalSets++;
      if (s.completed) completedSets++;
    });
  });

  progressText.textContent = `${completedSets} / ${totalSets} completed`;
  const pct = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;
  progressBar.style.width = `${pct}%`;
}

async function handleFinishWorkout() {
  if (!activeUser) {
    showToast('User authentication not ready', 'error');
    return;
  }

  // Aggregate completion summary numbers
  let totalSets = 0;
  let totalReps = 0;
  let totalVolume = 0;
  let completedExercises = 0;

  workoutSession.exercises.forEach(ex => {
    let exHasCompletedSet = false;
    ex.sets.forEach(set => {
      if (set.completed) {
        totalSets++;
        totalReps += Number(set.reps) || 0;
        totalVolume += (Number(set.weightKg) || 0) * (Number(set.reps) || 0);
        exHasCompletedSet = true;
      }
    });
    if (exHasCompletedSet) completedExercises++;
  });

  if (totalSets === 0) {
    showToast('Check off at least one completed set before finishing', 'warning');
    return;
  }

  const startTime = new Date(workoutSession.startedAt).getTime();
  const durationMinutes = Math.max(1, Math.round((Date.now() - startTime) / 60000));

  const payload = {
    date: workoutSession.date || getTodayDateString(),
    startedAt: workoutSession.startedAt,
    completedAt: new Date().toISOString(),
    workoutType: workoutSession.workoutType || 'Workout Session',
    durationMinutes,
    totalExercises: workoutSession.exercises.length,
    completedExercises,
    totalSets,
    totalReps,
    totalVolume: Math.round(totalVolume),
    notes: workoutSession.notes || '',
    exercises: workoutSession.exercises
  };

  try {
    finishBtn.disabled = true;
    finishBtn.textContent = 'Saving Workout...';

    await createWorkout(activeUser.uid, payload);

    if (timerInterval) clearInterval(timerInterval);
    localStorage.removeItem('ggym-current-workout');

    showToast('Workout successfully saved!', 'success');
    window.location.replace('history.html');
  } catch (err) {
    console.error('Error saving workout session:', err);
    showToast('Failed to save workout. Please retry.', 'error');
    finishBtn.disabled = false;
    finishBtn.textContent = 'Finish Workout';
  }
}