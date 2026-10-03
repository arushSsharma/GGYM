// js/history.js
import { initAuthGuard } from './auth-guard.js';
import { getWorkouts, updateWorkout, deleteWorkout } from './firestore.js';
import { showToast, formatDateLabel, getTodayDateString } from './utils.js';

let activeUser = null;
let workoutsCache = [];

const groupsWrapper = document.getElementById('history-groups-wrapper');
const totalSessionsVal = document.getElementById('total-sessions-val');
const totalSetsVal = document.getElementById('total-sets-val');
const totalVolumeVal = document.getElementById('total-volume-val');

// Modal Elements
const editModal = document.getElementById('edit-workout-modal');
const editForm = document.getElementById('edit-workout-form');
const editIdInput = document.getElementById('edit-workout-id');
const editTypeInput = document.getElementById('edit-workout-type');
const editDurationInput = document.getElementById('edit-duration');
const editNotesInput = document.getElementById('edit-notes');
const closeEditBtn = document.getElementById('btn-close-edit');

const deleteModal = document.getElementById('delete-confirm-modal');
const deleteTargetInput = document.getElementById('delete-target-id');
const closeDeleteBtn = document.getElementById('btn-close-delete');
const cancelDeleteBtn = document.getElementById('btn-cancel-delete');
const confirmDeleteBtn = document.getElementById('btn-confirm-delete');

initAuthGuard(async (user) => {
  if (!user) return;
  activeUser = user;
  await loadAndRenderHistory();
  setupModals();
});

async function loadAndRenderHistory() {
  try {
    workoutsCache = await getWorkouts(activeUser.uid, 50);
    renderSummaryMetrics();
    renderGroupedWorkouts();
  } catch (err) {
    console.error('Error loading workouts history:', err);
    showToast('Failed to load workout archive', 'error');
  }
}

function renderSummaryMetrics() {
  const totalSessions = workoutsCache.length;
  const totalSets = workoutsCache.reduce((sum, w) => sum + (Number(w.totalSets) || 0), 0);
  const totalVolumeKg = workoutsCache.reduce((sum, w) => sum + (Number(w.totalVolume) || 0), 0);
  const volumeTons = (totalVolumeKg / 1000).toFixed(1);

  totalSessionsVal.textContent = totalSessions;
  totalSetsVal.textContent = totalSets;
  totalVolumeVal.textContent = volumeTons;
}

function renderGroupedWorkouts() {
  groupsWrapper.innerHTML = '';

  if (workoutsCache.length === 0) {
    groupsWrapper.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px 16px;">
        <svg width="64" height="64" viewBox="0 0 96 96" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 10px;">
          <path d="M16 48h64M24 36v24M72 36v24M32 40v16M64 40v16"></path>
          <path d="M48 20 A28 28 0 0 1 76 48" stroke-dasharray="4 4"></path>
        </svg>
        <h3 style="font-size: 1rem; margin-bottom: 4px;">No History Found</h3>
        <p class="text-muted" style="font-size: 0.8rem; margin-bottom: 14px;">Complete your first training session to view archived logs.</p>
        <a href="workout.html" class="btn btn-primary" style="display: inline-flex;">Start a Workout</a>
      </div>
    `;
    return;
  }

  const todayStr = getTodayDateString();
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const groups = {
    today: [],
    thisWeek: [],
    previous: []
  };

  workoutsCache.forEach(workout => {
    const wDate = new Date(workout.date + 'T00:00:00');
    if (workout.date === todayStr) {
      groups.today.push(workout);
    } else if (wDate >= sevenDaysAgo) {
      groups.thisWeek.push(workout);
    } else {
      groups.previous.push(workout);
    }
  });

  if (groups.today.length > 0) {
    renderGroupSection('Today', groups.today);
  }
  if (groups.thisWeek.length > 0) {
    renderGroupSection('This Week', groups.thisWeek);
  }
  if (groups.previous.length > 0) {
    renderGroupSection('Previous Sessions', groups.previous);
  }

  attachCardEvents();
}

function renderGroupSection(title, list) {
  const section = document.createElement('section');
  section.className = 'history-section-group';

  const heading = document.createElement('h2');
  heading.className = 'history-group-title';
  heading.textContent = title;
  section.appendChild(heading);

  const listContainer = document.createElement('div');
  listContainer.className = 'history-list';

  list.forEach(w => {
    const card = document.createElement('article');
    card.className = 'workout-item-card';
    card.setAttribute('data-id', w.workoutId);

    const exercisesHTML = (w.exercises || []).map(ex => {
      const setPills = (ex.sets || []).map(s => `
        <span class="set-pill ${s.completed ? 'done' : ''}">
          ${s.weightKg}kg × ${s.reps}
        </span>
      `).join('');

      return `
        <div class="drilldown-exercise-block">
          <div class="drilldown-ex-title">
            <span>${ex.name}</span>
            <span class="text-muted" style="font-weight: 500; font-size: 0.72rem;">${ex.category || ''}</span>
          </div>
          <div class="drilldown-set-pills">
            ${setPills}
          </div>
        </div>
      `;
    }).join('');

    card.innerHTML = `
      <div class="workout-item-header">
        <div class="workout-main-info">
          <h3>${w.workoutType || 'Workout Session'}</h3>
          <span class="workout-item-date">${formatDateLabel(w.date)} • ${w.durationMinutes || 0} min</span>
        </div>
        <span class="workout-badge-chip">${w.completedExercises || w.totalExercises || 0} Exercises</span>
      </div>

      <div class="workout-stats-strip">
        <div class="strip-item">
          <div class="val text-num">${w.totalSets || 0}</div>
          <div class="lbl">Sets</div>
        </div>
        <div class="strip-item">
          <div class="val text-num">${w.totalReps || 0}</div>
          <div class="lbl">Reps</div>
        </div>
        <div class="strip-item">
          <div class="val text-num">${w.totalVolume ? Math.round(w.totalVolume) : 0}</div>
          <div class="lbl">Vol (kg)</div>
        </div>
      </div>

      <button type="button" class="workout-details-toggle" data-target="details-${w.workoutId}">
        <span>Inspect Exercises</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div class="workout-details-content" id="details-${w.workoutId}">
        ${exercisesHTML || '<p class="text-muted" style="font-size:0.75rem;">No exercise breakdown saved.</p>'}
        ${w.notes ? `<p class="text-muted" style="font-size: 0.75rem; margin-top: 8px; font-style: italic;">"${w.notes}"</p>` : ''}
      </div>

      <div class="workout-item-footer">
        <button type="button" class="btn-item-action action-edit" data-id="${w.workoutId}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Edit
        </button>
        <button type="button" class="btn-item-action action-delete" data-id="${w.workoutId}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
          Delete
        </button>
      </div>
    `;

    listContainer.appendChild(card);
  });

  section.appendChild(listContainer);
  groupsWrapper.appendChild(section);
}

function attachCardEvents() {
  // Toggle exercise drilldowns
  document.querySelectorAll('.workout-details-toggle').forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.target;
      const detailsEl = document.getElementById(targetId);
      const isExpanded = detailsEl.classList.toggle('active');
      const arrowSvg = btn.querySelector('svg');
      arrowSvg.style.transform = isExpanded ? 'rotate(180deg)' : 'none';
      arrowSvg.style.transition = 'transform 180ms ease';
    };
  });

  // Edit buttons
  document.querySelectorAll('.action-edit').forEach(btn => {
    btn.onclick = () => {
      const workoutId = btn.dataset.id;
      const workout = workoutsCache.find(w => w.workoutId === workoutId);
      if (!workout) return;

      editIdInput.value = workout.workoutId;
      editTypeInput.value = workout.workoutType || '';
      editDurationInput.value = workout.durationMinutes || 45;
      editNotesInput.value = workout.notes || '';

      editModal.classList.add('active');
    };
  });

  // Delete buttons
  document.querySelectorAll('.action-delete').forEach(btn => {
    btn.onclick = () => {
      deleteTargetInput.value = btn.dataset.id;
      deleteModal.classList.add('active');
    };
  });
}

function setupModals() {
  // Close Edit Modal
  closeEditBtn.onclick = () => editModal.classList.remove('active');

  // Submit Edit Form
  editForm.onsubmit = async (e) => {
    e.preventDefault();
    const workoutId = editIdInput.value;
    const workoutType = editTypeInput.value.trim();
    const durationMinutes = parseInt(editDurationInput.value, 10);
    const notes = editNotesInput.value.trim();

    try {
      await updateWorkout(activeUser.uid, workoutId, {
        workoutType,
        durationMinutes,
        notes
      });
      showToast('Workout log updated', 'success');
      editModal.classList.remove('active');
      await loadAndRenderHistory();
    } catch (err) {
      console.error(err);
      showToast('Failed to update workout log', 'error');
    }
  };

  // Close / Cancel Delete Modal
  const closeDelete = () => deleteModal.classList.remove('active');
  closeDeleteBtn.onclick = closeDelete;
  cancelDeleteBtn.onclick = closeDelete;

  // Confirm Delete
  confirmDeleteBtn.onclick = async () => {
    const workoutId = deleteTargetInput.value;
    if (!workoutId) return;

    try {
      confirmDeleteBtn.disabled = true;
      confirmDeleteBtn.textContent = 'Deleting...';
      await deleteWorkout(activeUser.uid, workoutId);
      showToast('Workout log removed', 'info');
      deleteModal.classList.remove('active');
      await loadAndRenderHistory();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete workout log', 'error');
    } finally {
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete Log';
    }
  };
}