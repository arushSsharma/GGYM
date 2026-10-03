// js/progress.js
import { initAuthGuard } from './auth-guard.js';
import { getUserProfile, getWorkouts, getWeightLogs } from './firestore.js';
import { calculateStreak, animateValue, formatDateLabel } from './utils.js';

initAuthGuard(async (user) => {
  if (!user) return;

  try {
    const [profile, workouts, weightLogs] = await Promise.all([
      getUserProfile(user.uid),
      getWorkouts(user.uid, 50),
      getWeightLogs(user.uid, 100)
    ]);

    renderAnalytics({ profile, workouts, weightLogs });
  } catch (err) {
    console.error('Error compiling progress analytics:', err);
  }
});

function renderAnalytics({ profile, workouts = [], weightLogs = [] }) {
  // 1. Compute & Render Macro Stats
  const totalWorkouts = workouts.length;
  const currentStreak = calculateStreak(workouts.map(w => w.date));
  const totalSets = workouts.reduce((sum, w) => sum + (Number(w.totalSets) || 0), 0);
  const totalVolumeKg = workouts.reduce((sum, w) => sum + (Number(w.totalVolume) || 0), 0);
  const totalVolumeTons = (totalVolumeKg / 1000).toFixed(1);

  animateValue(document.getElementById('stat-total-workouts'), 0, totalWorkouts);
  animateValue(document.getElementById('stat-current-streak'), 0, currentStreak);
  animateValue(document.getElementById('stat-total-sets'), 0, totalSets);
  document.getElementById('stat-total-volume').textContent = `${totalVolumeTons} t`;

  // 2. Render Bodyweight Trend SVG Chart
  renderWeightChart(weightLogs);

  // 3. Render Session Volume SVG Bar Chart
  renderVolumeChart(workouts);

  // 4. Compute & Render Personal Records
  renderPersonalRecords(workouts);
}

/**
 * Builds manual responsive SVG line chart with gradient area
 */
function renderWeightChart(logs = []) {
  const container = document.getElementById('weight-chart-wrapper');
  const deltaIndicator = document.getElementById('weight-trend-delta');

  if (!logs || logs.length < 2) {
    container.innerHTML = `
      <div class="chart-empty-state">
        <svg width="48" height="48" viewBox="0 0 96 96" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
          <circle cx="48" cy="48" r="32"></circle>
          <path d="M32 48h32" stroke-dasharray="3 3"></path>
        </svg>
        <p style="font-weight: 700; font-size: 0.88rem; margin-bottom: 2px;">Need at least 2 weight logs</p>
        <p class="text-muted" style="font-size: 0.75rem;">Log updates in Profile to chart your trend line.</p>
      </div>
    `;
    deltaIndicator.textContent = 'Awaiting entries';
    return;
  }

  // Calculate Net Delta
  const first = logs[0].weightKg;
  const latest = logs[logs.length - 1].weightKg;
  const diff = latest - first;
  const sign = diff > 0 ? '+' : '';
  deltaIndicator.textContent = `${sign}${diff.toFixed(1)} kg overall`;
  deltaIndicator.className = `chart-delta-indicator ${diff <= 0 ? 'positive' : 'negative'}`;

  // SVG Geometry Dimensions
  const W = 360;
  const H = 160;
  const padLeft = 32;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;

  const weights = logs.map(l => l.weightKg);
  const minW = Math.floor(Math.min(...weights)) - 2;
  const maxW = Math.ceil(Math.max(...weights)) + 2;

  const getX = (index) => padLeft + (index / (logs.length - 1)) * (W - padLeft - padRight);
  const getY = (val) => padTop + (1 - (val - minW) / (maxW - minW)) * (H - padTop - padBottom);

  const points = logs.map((l, i) => `${getX(i).toFixed(1)},${getY(l.weightKg).toFixed(1)}`);
  const polylineStr = points.join(' ');
  const areaPolygonStr = `${getX(0)},${H - padBottom} ${polylineStr} ${getX(logs.length - 1)},${H - padBottom}`;

  // Sample Date Labels for X-Axis (Start, Middle, End)
  const xLabels = [
    { text: formatDateLabel(logs[0].date), x: getX(0) },
    { text: formatDateLabel(logs[Math.floor(logs.length / 2)].date), x: getX(Math.floor(logs.length / 2)) },
    { text: formatDateLabel(logs[logs.length - 1].date), x: getX(logs.length - 1) }
  ];

  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="weightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#C8FF3D" stop-opacity="0.28" />
          <stop offset="100%" stop-color="#C8FF3D" stop-opacity="0.0" />
        </linearGradient>
      </defs>

      <!-- Horizontal Guide Gridlines -->
      <line x1="${padLeft}" y1="${getY(minW)}" x2="${W - padRight}" y2="${getY(minW)}" class="chart-grid-line" />
      <line x1="${padLeft}" y1="${getY((minW + maxW) / 2)}" x2="${W - padRight}" y2="${getY((minW + maxW) / 2)}" class="chart-grid-line" />
      <line x1="${padLeft}" y1="${getY(maxW)}" x2="${W - padRight}" y2="${getY(maxW)}" class="chart-grid-line" />

      <!-- Y-Axis Value Labels -->
      <text x="${padLeft - 6}" y="${getY(maxW) + 3}" text-anchor="end" class="chart-axis-text">${maxW}</text>
      <text x="${padLeft - 6}" y="${getY((minW + maxW) / 2) + 3}" text-anchor="end" class="chart-axis-text">${Math.round((minW + maxW) / 2)}</text>
      <text x="${padLeft - 6}" y="${getY(minW) + 3}" text-anchor="end" class="chart-axis-text">${minW}</text>

      <!-- Gradient Area Fill Under Curve -->
      <polygon points="${areaPolygonStr}" class="chart-area-fill" />

      <!-- High-Precision Polyline -->
      <polyline points="${polylineStr}" class="chart-polyline" />

      <!-- Vertex Dots -->
      ${logs.map((l, i) => `
        <circle cx="${getX(i)}" cy="${getY(l.weightKg)}" r="3" class="chart-data-point" />
      `).join('')}

      <!-- X-Axis Date Markers -->
      ${xLabels.map(l => `
        <text x="${l.x}" y="${H - 6}" text-anchor="middle" class="chart-axis-text">${l.text}</text>
      `).join('')}
    </svg>
  `;
}

/**
 * Builds manual responsive SVG bar chart for session training load
 */
function renderVolumeChart(workouts = []) {
  const container = document.getElementById('volume-chart-wrapper');

  if (!workouts || workouts.length === 0) {
    container.innerHTML = `
      <div class="chart-empty-state">
        <svg width="48" height="48" viewBox="0 0 96 96" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 8px;">
          <line x1="24" y1="72" x2="24" y2="40"></line>
          <line x1="48" y1="72" x2="48" y2="24"></line>
          <line x1="72" y1="72" x2="72" y2="56"></line>
        </svg>
        <p style="font-weight: 700; font-size: 0.88rem; margin-bottom: 2px;">No training load recorded</p>
        <p class="text-muted" style="font-size: 0.75rem;">Finished workouts will populate your volume load.</p>
      </div>
    `;
    return;
  }

  // Work with chronological order (oldest to latest), capped to recent 7
  const slice = [...workouts].reverse().slice(-7);

  const W = 360;
  const H = 160;
  const padLeft = 36;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 26;

  const volumes = slice.map(w => Number(w.totalVolume) || 0);
  const maxVol = Math.max(...volumes, 500);

  const usableWidth = W - padLeft - padRight;
  const barSlot = usableWidth / slice.length;
  const barWidth = Math.min(24, barSlot * 0.55);

  container.innerHTML = `
    <svg class="svg-chart" viewBox="0 0 ${W} ${H}">
      <defs>
        <linearGradient id="strengthBarGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#C8FF3D" />
          <stop offset="100%" stop-color="#9FCC20" />
        </linearGradient>
      </defs>

      <!-- Baseline and Max Guidelines -->
      <line x1="${padLeft}" y1="${H - padBottom}" x2="${W - padRight}" y2="${H - padBottom}" class="chart-grid-line" />
      <line x1="${padLeft}" y1="${padTop}" x2="${W - padRight}" y2="${padTop}" class="chart-grid-line" />

      <!-- Y Axis Values -->
      <text x="${padLeft - 6}" y="${padTop + 4}" text-anchor="end" class="chart-axis-text">${Math.round(maxVol)}</text>
      <text x="${padLeft - 6}" y="${H - padBottom}" text-anchor="end" class="chart-axis-text">0</text>

      <!-- Bars + X Dates -->
      ${slice.map((w, i) => {
        const vol = Number(w.totalVolume) || 0;
        const barH = (vol / maxVol) * (H - padTop - padBottom);
        const x = padLeft + (i * barSlot) + (barSlot - barWidth) / 2;
        const y = H - padBottom - barH;

        return `
          <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth}" height="${barH.toFixed(1)}" class="chart-bar" />
          <text x="${(x + barWidth / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" class="chart-axis-text">${formatDateLabel(w.date)}</text>
        `;
      }).join('')}
    </svg>
  `;
}

/**
 * Computes all-time Personal Records across all workouts
 */
function renderPersonalRecords(workouts = []) {
  const container = document.getElementById('pr-list-container');
  const exerciseMaxMap = {};

  workouts.forEach(w => {
    (w.exercises || []).forEach(ex => {
      (ex.sets || []).forEach(set => {
        if (set.completed && Number(set.weightKg) > 0) {
          const currentWeight = Number(set.weightKg);
          if (!exerciseMaxMap[ex.name] || currentWeight > exerciseMaxMap[ex.name].maxWeight) {
            exerciseMaxMap[ex.name] = {
              exerciseName: ex.name,
              maxWeight: currentWeight,
              date: w.date
            };
          }
        }
      });
    });
  });

  const prEntries = Object.values(exerciseMaxMap).sort((a, b) => b.maxWeight - a.maxWeight);

  if (prEntries.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 20px 10px;">
        <svg width="48" height="48" viewBox="0 0 96 96" fill="none" stroke="var(--muted)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 6px;">
          <circle cx="48" cy="40" r="22"></circle>
          <path d="M34 58l-8 24 22-8 22 8-8-24"></path>
        </svg>
        <p style="font-weight: 700; font-size: 0.88rem; margin-bottom: 2px;">No PRs Established</p>
        <p class="text-muted" style="font-size: 0.75rem;">Log completed weighted sets to record personal records.</p>
      </div>
    `;
    return;
  }

  // Display top 4 records
  container.innerHTML = prEntries.slice(0, 4).map(pr => `
    <article class="pr-item">
      <div class="pr-left-wrap">
        <div class="pr-medal-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="8" r="7"></circle>
            <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline>
          </svg>
        </div>
        <div>
          <div class="pr-exercise-name">${pr.exerciseName}</div>
          <div class="pr-exercise-date">Set on ${formatDateLabel(pr.date)}</div>
        </div>
      </div>
      <div class="pr-weight-pill text-num">${pr.maxWeight} kg</div>
    </article>
  `).join('');
}