// js/exercises.js
import { initAuthGuard } from './auth-guard.js';
import { showToast } from './utils.js';

// Comprehensive catalog of 22 foundational movements
export const EXERCISE_DATABASE = [
  // CHEST
  {
    exerciseId: 'barbell-bench-press',
    name: 'Barbell Bench Press',
    category: 'Chest',
    primaryMuscle: 'Pectoralis Major',
    equipment: 'Barbell & Bench',
    tier: 'Compound',
    recommendedRange: '8–10 reps',
    cues: 'Retract scapulae into bench, grip slightly wider than shoulders, lower under control to mid-sternum, drive up without flaring elbows.'
  },
  {
    exerciseId: 'incline-dumbbell-press',
    name: 'Incline Dumbbell Press',
    category: 'Chest',
    primaryMuscle: 'Clavicular Pectoralis (Upper Chest)',
    equipment: 'Dumbbells & 30° Incline Bench',
    tier: 'Primary',
    recommendedRange: '8–12 reps',
    cues: 'Set bench to 30°, maintain neutral wrist alignment, descend until dumbbells align with upper chest, press with squeeze.'
  },
  {
    exerciseId: 'cable-chest-fly',
    name: 'Cable Chest Fly',
    category: 'Chest',
    primaryMuscle: 'Sternal Pectoralis',
    equipment: 'Dual Cable Pulley',
    tier: 'Isolation',
    recommendedRange: '12–15 reps',
    cues: 'Slight bend in elbows, brace core with staggered stance, pull handles together in hugging arc, control the eccentric stretch.'
  },
  {
    exerciseId: 'push-ups',
    name: 'Deficit Push-Up',
    category: 'Chest',
    primaryMuscle: 'Pectorals & Core',
    equipment: 'Bodyweight',
    tier: 'Bodyweight',
    recommendedRange: '12–20 reps',
    cues: 'Tuck pelvis, maintain rigid straight line from heels to crown, lower chest to touch floor, lock out triceps at apex.'
  },

  // BACK
  {
    exerciseId: 'lat-pulldown',
    name: 'Lat Pulldown',
    category: 'Back',
    primaryMuscle: 'Latissimus Dorsi',
    equipment: 'Cable Lat Machine',
    tier: 'Primary',
    recommendedRange: '10–12 reps',
    cues: 'Grip outside shoulder width, depress shoulder blades before bending elbows, pull bar to collarbone, control rise.'
  },
  {
    exerciseId: 'seated-cable-row',
    name: 'Seated Cable Row',
    category: 'Back',
    primaryMuscle: 'Rhomboids & Mid-Traps',
    equipment: 'Low Cable Row',
    tier: 'Primary',
    recommendedRange: '10–12 reps',
    cues: 'Upright torso with soft knees, drive elbows back close to torso, squeeze shoulder blades together for 1-second hold.'
  },
  {
    exerciseId: 'dumbbell-single-arm-row',
    name: 'Single-Arm Dumbbell Row',
    category: 'Back',
    primaryMuscle: 'Lats & Posterior Deltoid',
    equipment: 'Dumbbell & Flat Bench',
    tier: 'Primary',
    recommendedRange: '10–12 reps',
    cues: 'Hand and knee planted firmly, neutral spine, pull dumbbell toward hip pocket rather than straight vertical.'
  },
  {
    exerciseId: 'face-pulls',
    name: 'Cable Face Pull',
    category: 'Back',
    primaryMuscle: 'Rear Delts & Rotator Cuff',
    equipment: 'Cable Rope Attachment',
    tier: 'Isolation',
    recommendedRange: '12–15 reps',
    cues: 'Set rope at eye height, pull thumbs backward toward ears while externally rotating shoulders, pause at contraction.'
  },

  // SHOULDERS
  {
    exerciseId: 'overhead-press',
    name: 'Dumbbell Shoulder Press',
    category: 'Shoulders',
    primaryMuscle: 'Anterior & Lateral Deltoid',
    equipment: 'Dumbbells',
    tier: 'Primary',
    recommendedRange: '8–12 reps',
    cues: 'Elbows slightly forward in scapular plane (not flared 90°), press upward directly over crown, control return to chin height.'
  },
  {
    exerciseId: 'lateral-raises',
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    primaryMuscle: 'Lateral Deltoid',
    equipment: 'Dumbbells',
    tier: 'Isolation',
    recommendedRange: '12–15 reps',
    cues: 'Slight torso forward lean, lead with elbows up to parallel, pour imaginary water at top, strictly avoid swinging.'
  },
  {
    exerciseId: 'reverse-pec-deck',
    name: 'Rear Delt Machine Fly',
    category: 'Shoulders',
    primaryMuscle: 'Posterior Deltoids',
    equipment: 'Pec Deck Machine',
    tier: 'Isolation',
    recommendedRange: '12–15 reps',
    cues: 'Chest flush with pad, arms parallel to ground with soft elbow lock, push handles outward and back without shrugging.'
  },
  {
    exerciseId: 'dumbbell-front-raise',
    name: 'Dumbbell Front Raise',
    category: 'Shoulders',
    primaryMuscle: 'Anterior Deltoid',
    equipment: 'Dumbbells',
    tier: 'Isolation',
    recommendedRange: '12–15 reps',
    cues: 'Neutral grip or overhand, lift weight in front to eye line, prevent torso rocking by engaging glutes and abs.'
  },

  // LEGS
  {
    exerciseId: 'goblet-squat',
    name: 'Goblet Squat',
    category: 'Legs',
    primaryMuscle: 'Quadriceps & Glutes',
    equipment: 'Kettlebell or Dumbbell',
    tier: 'Compound',
    recommendedRange: '8–12 reps',
    cues: 'Hold weight tight against sternum, push knees outward tracking toes, descend until hip crease clears knee parallel.'
  },
  {
    exerciseId: 'romanian-deadlift',
    name: 'Dumbbell Romanian Deadlift (RDL)',
    category: 'Legs',
    primaryMuscle: 'Hamstrings & Posterior Chain',
    equipment: 'Dumbbells',
    tier: 'Primary',
    recommendedRange: '8–10 reps',
    cues: 'Soft bend in knees, push hips directly backward as if touching a wall, lower weights along shins until hamstring tension peaks.'
  },
  {
    exerciseId: 'leg-press',
    name: '45-Degree Leg Press',
    category: 'Legs',
    primaryMuscle: 'Quadriceps',
    equipment: 'Incline Leg Press Machine',
    tier: 'Primary',
    recommendedRange: '10–12 reps',
    cues: 'Feet shoulder-width on platform center, lower carriage until knees reach 90°, press through whole foot without locking knees.'
  },
  {
    exerciseId: 'standing-calf-raise',
    name: 'Standing Calf Raise',
    category: 'Legs',
    primaryMuscle: 'Gastrocnemius & Soleus',
    equipment: 'Machine / Step Block',
    tier: 'Isolation',
    recommendedRange: '15–20 reps',
    cues: 'Full deep stretch at the bottom for 1 second, explode onto balls of feet, hold 2-second peak isometric contraction.'
  },

  // ARMS
  {
    exerciseId: 'barbell-bicep-curl',
    name: 'EZ-Bar Bicep Curl',
    category: 'Arms',
    primaryMuscle: 'Biceps Brachii',
    equipment: 'EZ Barbell',
    tier: 'Isolation',
    recommendedRange: '10–12 reps',
    cues: 'Pin elbows to ribcage, curl bar upward while contracting biceps, control descent without swinging torso.'
  },
  {
    exerciseId: 'tricep-rope-pushdown',
    name: 'Tricep Rope Pushdown',
    category: 'Arms',
    primaryMuscle: 'Triceps (Lateral Head)',
    equipment: 'Cable Rope',
    tier: 'Isolation',
    recommendedRange: '12–15 reps',
    cues: 'Fix upper arms vertically, push rope straight down and flare ends apart at bottom for complete tricep lockout.'
  },
  {
    exerciseId: 'hammer-curls',
    name: 'Dumbbell Hammer Curl',
    category: 'Arms',
    primaryMuscle: 'Brachialis & Forearms',
    equipment: 'Dumbbells',
    tier: 'Isolation',
    recommendedRange: '10–12 reps',
    cues: 'Palms face inward throughout entire ROM, curl dumbbell toward front shoulder, emphasize controlled eccentric release.'
  },
  {
    exerciseId: 'skull-crushers',
    name: 'Lying Tricep Extension',
    category: 'Arms',
    primaryMuscle: 'Triceps (Long Head)',
    equipment: 'EZ Bar & Flat Bench',
    tier: 'Isolation',
    recommendedRange: '10–12 reps',
    cues: 'Angled slightly back from vertical, hinge strictly at elbows to lower bar to forehead, press back to initial angle.'
  },

  // CORE
  {
    exerciseId: 'plank',
    name: 'Standard Forearm Plank',
    category: 'Core',
    primaryMuscle: 'Transverse Abdominis',
    equipment: 'Bodyweight & Mat',
    tier: 'Stability',
    recommendedRange: '30–60s hold',
    cues: 'Elbows under shoulders, squeeze glutes and quads, maintain neutral cervical spine, pull elbows toward toes isometrically.'
  },
  {
    exerciseId: 'hanging-leg-raise',
    name: 'Hanging Knee / Leg Raise',
    category: 'Core',
    primaryMuscle: 'Lower Rectus Abdominis',
    equipment: 'Pull-Up Bar',
    tier: 'Core',
    recommendedRange: '10–15 reps',
    cues: 'Dead-hang with engaged shoulders, tilt pelvis upward to bring knees to chest, lower without swinging momentum.'
  },

  // COMPOUND / STRENGTH
  {
    exerciseId: 'trap-bar-deadlift',
    name: 'Trap Bar Deadlift',
    category: 'Strength',
    primaryMuscle: 'Full Body Posterior & Quads',
    equipment: 'Hex / Trap Bar',
    tier: 'Compound',
    recommendedRange: '5–8 reps',
    cues: 'Stand center of hex bar, hinge hips down to grip handles, pack lats, push floor away through mid-foot.'
  }
];

let activeFilter = 'All';
let searchQuery = '';

initAuthGuard((user) => {
  if (!user) return;
  setupFilterChips();
  setupSearch();
  renderExercises();
});

function setupFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderExercises();
    });
  });
}

function setupSearch() {
  const searchInput = document.getElementById('exercise-search-input');
  const clearBtn = document.getElementById('btn-clear-search');

  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    clearBtn.classList.toggle('active', searchQuery.length > 0);
    renderExercises();
  });

  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchQuery = '';
    clearBtn.classList.remove('active');
    renderExercises();
    searchInput.focus();
  });
}

function renderExercises() {
  const container = document.getElementById('exercises-container');
  const countLabel = document.getElementById('results-count-label');
  container.innerHTML = '';

  // Filter by category and search keyword
  const filtered = EXERCISE_DATABASE.filter(ex => {
    const matchesCategory = activeFilter === 'All' || ex.category === activeFilter;
    const matchesSearch = !searchQuery || 
      ex.name.toLowerCase().includes(searchQuery) ||
      ex.primaryMuscle.toLowerCase().includes(searchQuery) ||
      ex.equipment.toLowerCase().includes(searchQuery) ||
      ex.category.toLowerCase().includes(searchQuery);

    return matchesCategory && matchesSearch;
  });

  countLabel.textContent = `${filtered.length} exercise${filtered.length === 1 ? '' : 's'} found`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px 14px;">
        <svg width="48" height="48" viewBox="0 0 96 96" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
          <circle cx="48" cy="48" r="32"></circle>
          <line x1="28" y1="28" x2="68" y2="68"></line>
        </svg>
        <p style="font-weight: 700; margin-bottom: 2px;">No matching movements</p>
        <p class="text-muted" style="font-size: 0.78rem;">Try another keyword or select All Movements.</p>
      </div>
    `;
    return;
  }

  // Load custom routine to mark already-selected items
  let customRoutine = [];
  try {
    const stored = localStorage.getItem('ggym-custom-routine');
    if (stored) customRoutine = JSON.parse(stored);
  } catch (e) {
    customRoutine = [];
  }
  const selectedIds = new Set(customRoutine.map(e => e.exerciseId));

  filtered.forEach(ex => {
    const card = document.createElement('article');
    card.className = 'lib-exercise-card';
    const isAdded = selectedIds.has(ex.exerciseId);

    card.innerHTML = `
      <div class="lib-card-top">
        <h3 class="lib-ex-name">${ex.name}</h3>
        <span class="lib-cat-pill">${ex.category}</span>
      </div>

      <div class="lib-meta-info">
        <span><strong>Target:</strong> ${ex.primaryMuscle}</span>
        <span><strong>Equip:</strong> ${ex.equipment}</span>
        <span><strong>Rep Target:</strong> ${ex.recommendedRange}</span>
      </div>

      <p class="lib-cues-text">${ex.cues}</p>

      <div class="lib-card-actions">
        <span class="text-muted" style="font-size: 0.72rem; font-weight: 600;">${ex.tier} Movement</span>
        <button type="button" class="btn-add-to-routine ${isAdded ? 'added' : ''}" data-id="${ex.exerciseId}">
          ${isAdded ? '✓ In Custom Split' : '+ Add to Routine'}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach selection listeners
  container.querySelectorAll('.btn-add-to-routine:not(.added)').forEach(btn => {
    btn.onclick = () => {
      const exId = btn.dataset.id;
      const targetEx = EXERCISE_DATABASE.find(e => e.exerciseId === exId);
      if (targetEx) {
        addExerciseToRoutine(targetEx, btn);
      }
    };
  });
}

function addExerciseToRoutine(exercise, buttonEl) {
  let customRoutine = [];
  try {
    const stored = localStorage.getItem('ggym-custom-routine');
    if (stored) customRoutine = JSON.parse(stored);
  } catch (e) {
    customRoutine = [];
  }

  // Add exercise template object
  customRoutine.push({
    exerciseId: exercise.exerciseId,
    name: exercise.name,
    category: exercise.category,
    sets: 3,
    defaultReps: 10,
    defaultWeight: 20
  });

  localStorage.setItem('ggym-custom-routine', JSON.stringify(customRoutine));
  localStorage.setItem('ggym-routine', JSON.stringify(customRoutine));
  localStorage.setItem('ggym-active-category', 'Custom');

  buttonEl.classList.add('added');
  buttonEl.textContent = '✓ In Custom Split';
  showToast(`Added ${exercise.name} to Custom Routine`, 'success');
}