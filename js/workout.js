// js/workout.js
import { initAuthGuard } from './auth-guard.js';
import { showToast } from './utils.js';

// Pre-defined beginner-to-intermediate routine mappings
const routineMap = {
  Chest: {
    title: 'Chest & Push',
    focus: 'Pectorals, Anterior Deltoids, Triceps',
    badge: 'Standard Split',
    exercises: [
      { exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', category: 'Chest', sets: 4, defaultReps: 10, defaultWeight: 40 },
      { exerciseId: 'incline-dumbbell-press', name: 'Incline Dumbbell Press', category: 'Chest', sets: 3, defaultReps: 10, defaultWeight: 16 },
      { exerciseId: 'cable-chest-fly', name: 'Cable Chest Fly', category: 'Chest', sets: 3, defaultReps: 12, defaultWeight: 12 },
      { exerciseId: 'push-ups', name: 'Push-Ups', category: 'Chest', sets: 3, defaultReps: 15, defaultWeight: 0 }
    ]
  },
  Back: {
    title: 'Back & Pull',
    focus: 'Latissimus Dorsi, Rhomboids, Biceps',
    badge: 'Standard Split',
    exercises: [
      { exerciseId: 'lat-pulldown', name: 'Lat Pulldown', category: 'Back', sets: 4, defaultReps: 10, defaultWeight: 45 },
      { exerciseId: 'seated-cable-row', name: 'Seated Cable Row', category: 'Back', sets: 3, defaultReps: 10, defaultWeight: 40 },
      { exerciseId: 'dumbbell-single-arm-row', name: 'Single-Arm Dumbbell Row', category: 'Back', sets: 3, defaultReps: 12, defaultWeight: 18 },
      { exerciseId: 'face-pulls', name: 'Face Pulls', category: 'Back', sets: 3, defaultReps: 15, defaultWeight: 15 }
    ]
  },
  Shoulders: {
    title: 'Shoulders & Delts',
    focus: 'Anterior, Lateral & Posterior Deltoids',
    badge: 'Isolation Split',
    exercises: [
      { exerciseId: 'overhead-press', name: 'Dumbbell Shoulder Press', category: 'Shoulders', sets: 4, defaultReps: 10, defaultWeight: 14 },
      { exerciseId: 'lateral-raises', name: 'Dumbbell Lateral Raise', category: 'Shoulders', sets: 4, defaultReps: 12, defaultWeight: 8 },
      { exerciseId: 'reverse-pec-deck', name: 'Rear Delt Fly', category: 'Shoulders', sets: 3, defaultReps: 15, defaultWeight: 25 },
      { exerciseId: 'dumbbell-front-raise', name: 'Front Dumbbell Raise', category: 'Shoulders', sets: 3, defaultReps: 12, defaultWeight: 8 }
    ]
  },
  Legs: {
    title: 'Legs & Lower Body',
    focus: 'Quadriceps, Hamstrings, Glutes, Calves',
    badge: 'Lower Compound',
    exercises: [
      { exerciseId: 'goblet-squat', name: 'Goblet Squat', category: 'Legs', sets: 4, defaultReps: 10, defaultWeight: 20 },
      { exerciseId: 'romanian-deadlift', name: 'Dumbbell Romanian Deadlift', category: 'Legs', sets: 3, defaultReps: 10, defaultWeight: 24 },
      { exerciseId: 'leg-press', name: 'Leg Press', category: 'Legs', sets: 3, defaultReps: 12, defaultWeight: 80 },
      { exerciseId: 'standing-calf-raise', name: 'Calf Raises', category: 'Legs', sets: 4, defaultReps: 15, defaultWeight: 20 }
    ]
  },
  Arms: {
    title: 'Arms (Biceps & Triceps)',
    focus: 'Biceps Brachii, Triceps Lateral/Long Heads',
    badge: 'Arm Hypertrophy',
    exercises: [
      { exerciseId: 'barbell-bicep-curl', name: 'Barbell Bicep Curl', category: 'Arms', sets: 3, defaultReps: 10, defaultWeight: 20 },
      { exerciseId: 'tricep-rope-pushdown', name: 'Tricep Rope Pushdown', category: 'Arms', sets: 3, defaultReps: 12, defaultWeight: 20 },
      { exerciseId: 'hammer-curls', name: 'Dumbbell Hammer Curl', category: 'Arms', sets: 3, defaultReps: 12, defaultWeight: 12 },
      { exerciseId: 'skull-crushers', name: 'Lying Tricep Extension', category: 'Arms', sets: 3, defaultReps: 10, defaultWeight: 15 }
    ]
  },
  Core: {
    title: 'Core & Abdominals',
    focus: 'Rectus Abdominis, Obliques, Transverse',
    badge: 'Core Stability',
    exercises: [
      { exerciseId: 'plank', name: 'Plank Hold', category: 'Core', sets: 3, defaultReps: 30, defaultWeight: 0 },
      { exerciseId: 'hanging-leg-raise', name: 'Hanging Knee Raise', category: 'Core', sets: 3, defaultReps: 12, defaultWeight: 0 },
      { exerciseId: 'russian-twist', name: 'Russian Twist', category: 'Core', sets: 3, defaultReps: 20, defaultWeight: 5 },
      { exerciseId: 'ab-wheel-rollout', name: 'Ab Wheel Rollout', category: 'Core', sets: 3, defaultReps: 10, defaultWeight: 0 }
    ]
  },
  Strength: {
    title: 'Full Body Strength',
    focus: 'Compound Baseline Power',
    badge: 'Foundational',
    exercises: [
      { exerciseId: 'trap-bar-deadlift', name: 'Trap Bar Deadlift', category: 'Strength', sets: 4, defaultReps: 6, defaultWeight: 60 },
      { exerciseId: 'barbell-bench-press', name: 'Barbell Bench Press', category: 'Strength', sets: 4, defaultReps: 6, defaultWeight: 50 },
      { exerciseId: 'goblet-squat', name: 'Heavy Goblet Squat', category: 'Strength', sets: 4, defaultReps: 8, defaultWeight: 28 },
      { exerciseId: 'lat-pulldown', name: 'Heavy Lat Pulldown', category: 'Strength', sets: 4, defaultReps: 8, defaultWeight: 50 }
    ]
  },
  Custom: {
    title: 'Custom Workout',
    focus: 'User Selected Routine',
    badge: 'Personalized',
    exercises: []
  }
};

let currentCategory = 'Chest';
let activeRoutine = [];

initAuthGuard((user, profileData) => {
  if (!user) return;

  // Determine starting category: check localStorage first, then profile goal mapping
  const savedCat = localStorage.getItem('ggym-active-category');
  if (savedCat && routineMap[savedCat]) {
    currentCategory = savedCat;
  } else if (profileData?.fitnessGoal === 'strength') {
    currentCategory = 'Strength';
  }

  setupCategoryChips();
  loadCategoryRoutine(currentCategory);
  setupActions();
});

function setupCategoryChips() {
  const chips = document.querySelectorAll('.category-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const cat = chip.dataset.category;
      currentCategory = cat;
      loadCategoryRoutine(cat);
    });
  });
}

function loadCategoryRoutine(category) {
  localStorage.setItem('ggym-active-category', category);

  // Mark chip active
  const chips = document.querySelectorAll('.category-chip');
  chips.forEach(chip => {
    if (chip.dataset.category === category) chip.classList.add('active');
    else chip.classList.remove('active');
  });

  if (category === 'Custom') {
    const customStored = localStorage.getItem('ggym-custom-routine');
    activeRoutine = customStored ? JSON.parse(customStored) : [];
  } else {
    // Clone standard preset
    activeRoutine = JSON.parse(JSON.stringify(routineMap[category].exercises));
  }

  // Update localStorage session routine
  localStorage.setItem('ggym-routine', JSON.stringify(activeRoutine));

  renderRoutineView(category);
}

function renderRoutineView(category) {
  const info = routineMap[category] || routineMap.Chest;
  document.getElementById('routine-title').textContent = info.title;
  document.getElementById('routine-focus').textContent = info.focus;
  document.getElementById('routine-badge').textContent = info.badge;

  const totalSets = activeRoutine.reduce((sum, ex) => sum + (ex.sets || 3), 0);
  document.getElementById('meta-set-count').textContent = totalSets;
  document.getElementById('meta-time-estimate').textContent = `${Math.max(20, totalSets * 3.5).toFixed(0)} min`;
  document.getElementById('exercise-count-label').textContent = `${activeRoutine.length} Exercises`;

  const container = document.getElementById('exercise-list-container');
  container.innerHTML = '';

  if (activeRoutine.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 24px 14px; background: var(--surface); border-radius: var(--radius-md); border: 1px dashed var(--border);">
        <p style="font-weight: 700; margin-bottom: 4px;">No exercises added yet</p>
        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 12px;">Browse the exercise library to populate this custom routine.</p>
        <a href="exercises.html" class="btn btn-secondary" style="font-size: 0.8rem; min-height: 38px;">Browse Exercises</a>
      </div>
    `;
    return;
  }

  activeRoutine.forEach((ex, idx) => {
    const card = document.createElement('div');
    card.className = 'exercise-card';
    card.innerHTML = `
      <div class="exercise-info">
        <div class="exercise-name">${ex.name}</div>
        <div class="exercise-details">
          <span>${ex.sets || 3} sets</span>
          <span>${ex.defaultReps || 10} reps</span>
          <span>${ex.defaultWeight ? `${ex.defaultWeight} kg` : 'Bodyweight'}</span>
        </div>
      </div>
      <div class="exercise-actions">
        <button type="button" class="btn-remove-exercise" data-index="${idx}" aria-label="Remove ${ex.name}">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach removal listeners
  container.querySelectorAll('.btn-remove-exercise').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.index, 10);
      removeExercise(idx);
    });
  });
}

function removeExercise(index) {
  if (index >= 0 && index < activeRoutine.length) {
    const removed = activeRoutine.splice(index, 1)[0];
    localStorage.setItem('ggym-routine', JSON.stringify(activeRoutine));
    if (currentCategory === 'Custom') {
      localStorage.setItem('ggym-custom-routine', JSON.stringify(activeRoutine));
    }
    showToast(`Removed ${removed.name}`, 'info');
    renderRoutineView(currentCategory);
  }
}

function setupActions() {
  const startBtn = document.getElementById('btn-start-session');
  startBtn.addEventListener('click', () => {
    if (!activeRoutine || activeRoutine.length === 0) {
      showToast('Add at least one exercise to start logging', 'warning');
      return;
    }
    // Ensure active routine and active category are locked in localStorage
    localStorage.setItem('ggym-routine', JSON.stringify(activeRoutine));
    localStorage.setItem('ggym-active-category', currentCategory);
    window.location.href = 'log-workout.html';
  });
}