// js/dashboard.js
import { initAuthGuard } from './auth-guard.js';
import { getUserProfile, getWorkouts, getWeightLogs } from './firestore.js';
import { calculateStreak, animateValue, formatDateLabel, getTodayDateString } from './utils.js';

const motivationalQuotes = [
  "Train for your life. Track it properly.",
  "Small daily disciplines compound into massive physical strength.",
  "Every heavy set rewires your baseline capability.",
  "Action precedes motivation. Show up on the platform.",
  "Form first, load second, consistency always."
];

initAuthGuard(async (user) => {
  if (!user) return;

  try {
    // Parallel data fetch
    const [profile, workouts, weightLogs] = await Promise.all([
      getUserProfile(user.uid),
      getWorkouts(user.uid, 50),
      getWeightLogs(user.uid, 100)
    ]);

    renderDashboard({ user, profile, workouts, weightLogs });
  } catch (err) {
    console.error('Error loading dashboard metrics:', err);
  }
});

function renderDashboard({ user, profile, workouts = [], weightLogs = [] }) {
  // 1. User Header & Motivation
  const nameEl = document.getElementById('dash-user-name');
  const dateEl = document.getElementById('dash-date-str');
  const quoteEl = document.getElementById('dash-motivation');

  const displayName = profile?.name || user.displayName || 'Athlete';
  nameEl.textContent = displayName;

  const now = new Date();
  dateEl.textContent = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
  quoteEl.textContent = randomQuote;

  // 2. Weights & Delta
  const weightEl = document.getElementById('stat-weight');
  const weightDeltaEl = document.getElementById('stat-weight-delta');

  let currentWeight = profile?.weightKg || 0;
  if (weightLogs.length > 0) {
    currentWeight = weightLogs[weightLogs.length - 1].weightKg;
  }

  weightEl.textContent = currentWeight ? currentWeight.toFixed(1) : '--';

  if (weightLogs.length >= 2) {
    const prev = weightLogs[weightLogs.length - 2].weightKg;
    const diff = currentWeight - prev;
    const sign = diff > 0 ? '+' : '';
    weightDeltaEl.textContent = `${sign}${diff.toFixed(1)} kg from last log`;
    if (diff < 0) weightDeltaEl.className = 'stat-delta positive';
    else if (diff > 0) weightDeltaEl.className = 'stat-delta negative';
  } else {
    weightDeltaEl.textContent = 'Baseline recorded';
  }

  // 3. BMI & Category
  const bmiEl = document.getElementById('stat-bmi');
  const bmiCatEl = document.getElementById('stat-bmi-cat');
  bmiEl.textContent = profile?.bmi ? profile.bmi.toFixed(1) : '--';
  
  if (profile?.bmi) {
    if (profile.bmi < 18.5) bmiCatEl.textContent = 'Underweight';
    else if (profile.bmi < 24.9) bmiCatEl.textContent = 'Normal range';
    else if (profile.bmi < 29.9) bmiCatEl.textContent = 'Overweight';
    else bmiCatEl.textContent = 'Obese';
  }

  // 4. Target Calories
  const calEl = document.getElementById('stat-calories');
  const calGoalEl = document.getElementById('stat-goal-label');
  if (profile?.dailyCalories) {
    animateValue(calEl, 0, profile.dailyCalories, 500);
  } else {
    calEl.textContent = '--';
  }

  const goalMap = {
    build_muscle: 'Hypertrophy Surplus',
    strength: 'Strength Maintenance',
    fat_loss: 'Caloric Deficit',
    general_fitness: 'Maintenance'
  };
  calGoalEl.textContent = goalMap[profile?.fitnessGoal] || 'Daily Target';

  // 5. Streak
  const streakEl = document.getElementById('stat-streak');
  const workoutDates = workouts.map(w => w.date);
  const streakCount = calculateStreak(workoutDates);
  animateValue(streakEl, 0, streakCount, 500);

  // 6. Mon–Sun Weekly Consistency Dots
  renderWeeklyDots(workoutDates);

  // 7. Goal Progress Bar
  renderGoalProgress(currentWeight, profile?.targetWeightKg);

  // 8. Recent Workout Summary Card
  renderRecentWorkout(workouts[0]);
}

function renderWeeklyDots(workoutDates = []) {
  const container = document.getElementById('week-dots-container');
  const countLabel = document.getElementById('weekly-count-label');
  container.innerHTML = '';

  const today = new Date();
  const currentDayOfWeek = today.getDay(); // 0 is Sun, 1 is Mon...
  // Calculate Monday of current week
  const monday = new Date(today);
  const diffToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const daysShort = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayStr = getTodayDateString();
  let weekCompletedCount = 0;

  for (let i = 0; i < 7; i++) {
    const loopDate = new Date(monday);
    loopDate.setDate(monday.getDate() + i);

    const year = loopDate.getFullYear();
    const month = String(loopDate.getMonth() + 1).padStart(2, '0');
    const day = String(loopDate.getDate()).padStart(2, '0');
    const loopDateStr = `${year}-${month}-${day}`;

    const isDone = workoutDates.includes(loopDateStr);
    if (isDone) weekCompletedCount++;
    const isToday = loopDateStr === todayStr;

    const col = document.createElement('div');
    col.className = 'week-day-col';

    const lbl = document.createElement('span');
    lbl.className = 'week-day-name';
    lbl.textContent = daysShort[i];

    const dot = document.createElement('div');
    dot.className = `week-dot ${isDone ? 'active streak-dot-active' : ''} ${isToday ? 'is-today' : ''}`;

    col.appendChild(lbl);
    col.appendChild(dot);
    container.appendChild(col);
  }

  countLabel.textContent = `${weekCompletedCount} of 7 days`;
}

function renderGoalProgress(current, target) {
  const fillEl = document.getElementById('goal-progress-fill');
  const percentEl = document.getElementById('goal-percent');
  const currentLbl = document.getElementById('goal-start-lbl');
  const targetLbl = document.getElementById('goal-target-lbl');

  if (!current || !target) {
    fillEl.style.width = '0%';
    percentEl.textContent = '0%';
    return;
  }

  currentLbl.textContent = `Current: ${current.toFixed(1)} kg`;
  targetLbl.textContent = `Target: ${target.toFixed(1)} kg`;

  // Measure delta proximity
  const diff = Math.abs(current - target);
  let progress = Math.max(0, Math.min(100, Math.round(100 - (diff * 5))));
  if (diff === 0) progress = 100;

  fillEl.style.width = `${progress}%`;
  percentEl.textContent = `${progress}%`;
}

function renderRecentWorkout(latest) {
  const container = document.getElementById('recent-workout-content');
  if (!latest) {
    // Empty State SVG
    container.innerHTML = `
      <div style="text-align: center; padding: 18px 0;">
        <svg width="64" height="64" viewBox="0 0 96 96" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
          <path d="M16 48h64M24 36v24M72 36v24M32 40v16M64 40v16"></path>
          <path d="M48 20 A28 28 0 0 1 76 48" stroke-dasharray="4 4"></path>
        </svg>
        <p style="font-weight: 700; font-size: 0.88rem; margin-bottom: 2px;">No workouts logged yet</p>
        <p class="text-muted" style="font-size: 0.78rem;">Complete your first training session to start your streak.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div>
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 style="font-size: 1rem; font-weight: 700;">${latest.workoutType || 'Workout Session'}</h3>
        <span class="text-muted" style="font-size: 0.78rem;">${formatDateLabel(latest.date)}</span>
      </div>
      <div class="recent-meta-grid">
        <div class="meta-item">
          <div class="meta-val text-num">${latest.totalSets || 0}</div>
          <div class="meta-lbl">Sets</div>
        </div>
        <div class="meta-item">
          <div class="meta-val text-num">${latest.totalReps || 0}</div>
          <div class="meta-lbl">Reps</div>
        </div>
        <div class="meta-item">
          <div class="meta-val text-num">${latest.totalVolume ? Math.round(latest.totalVolume) : 0}</div>
          <div class="meta-lbl">Vol (kg)</div>
        </div>
      </div>
    </div>
  `;
}