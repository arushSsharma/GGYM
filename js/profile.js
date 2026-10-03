// js/profile.js
import { initAuthGuard } from './auth-guard.js';
import { getUserProfile, updateUserProfile, addWeightLog } from './firestore.js';
import { logoutUser } from './auth.js';
import { calculateBMI, calculateBMR, calculateTargetCalories } from './calculator.js';
import { showToast, getTodayDateString } from './utils.js';

let activeUser = null;
let currentProfile = null;

// UI Elements
const avatarLetter = document.getElementById('avatar-letter');
const displayName = document.getElementById('user-display-name');
const displayEmail = document.getElementById('user-display-email');

const specWeight = document.getElementById('spec-weight');
const specTarget = document.getElementById('spec-target');
const specTargetDelta = document.getElementById('spec-target-delta');
const specHeight = document.getElementById('spec-height');
const specHeightFt = document.getElementById('spec-height-ft');
const specBmi = document.getElementById('spec-bmi');
const specBmiClass = document.getElementById('spec-bmi-class');
const specGoal = document.getElementById('spec-goal');
const specActivity = document.getElementById('spec-activity');

// Modals
const weightModal = document.getElementById('modal-log-weight');
const profileModal = document.getElementById('modal-edit-profile');
const openWeightBtn = document.getElementById('btn-open-log-weight');
const openProfileBtn = document.getElementById('btn-open-edit-profile');
const closeWeightBtn = document.getElementById('btn-close-weight-modal');
const closeProfileBtn = document.getElementById('btn-close-profile-modal');

// Forms
const weightForm = document.getElementById('form-log-weight');
const inputNewWeight = document.getElementById('input-new-weight');
const inputWeightDate = document.getElementById('input-weight-date');
const submitWeightBtn = document.getElementById('btn-submit-weight');

const profileForm = document.getElementById('form-edit-profile');
const editName = document.getElementById('edit-profile-name');
const editAge = document.getElementById('edit-profile-age');
const editGender = document.getElementById('edit-profile-gender');
const editHeight = document.getElementById('edit-profile-height');
const editTarget = document.getElementById('edit-profile-target');
const editGoal = document.getElementById('edit-profile-goal');
const editActivity = document.getElementById('edit-profile-activity');
const submitProfileBtn = document.getElementById('btn-submit-profile-edit');

const logoutBtn = document.getElementById('btn-logout');

initAuthGuard(async (user) => {
  if (!user) return;
  activeUser = user;
  await loadAndRenderProfile();
  setupModals();
});

async function loadAndRenderProfile() {
  try {
    currentProfile = await getUserProfile(activeUser.uid);
    if (!currentProfile) return;

    // Avatar Letter & Header
    const nameStr = currentProfile.name || activeUser.displayName || activeUser.email.split('@')[0];
    displayName.textContent = nameStr;
    displayEmail.textContent = activeUser.email;
    avatarLetter.textContent = (nameStr[0] || 'G').toUpperCase();

    // Baseline Metrics
    const w = currentProfile.weightKg || 0;
    const targetW = currentProfile.targetWeightKg || 0;
    const h = currentProfile.heightCm || 0;

    specWeight.textContent = w ? `${w.toFixed(1)} kg` : '--';
    specTarget.textContent = targetW ? `${targetW.toFixed(1)} kg` : '--';

    if (w && targetW) {
      const diff = (w - targetW).toFixed(1);
      specTargetDelta.textContent = diff === '0.0' ? 'Target achieved' : `${diff > 0 ? '+' : ''}${diff} kg to goal`;
    }

    specHeight.textContent = h ? `${h.toFixed(1)} cm` : '--';
    if (h) {
      const inchesTotal = h / 2.54;
      const feet = Math.floor(inchesTotal / 12);
      const inches = Math.round(inchesTotal % 12);
      specHeightFt.textContent = `${feet}' ${inches}"`;
    }

    const { bmi, category } = calculateBMI(w, h);
    specBmi.textContent = bmi || '--';
    specBmiClass.textContent = category || '--';

    const goalLabels = {
      general_fitness: 'General Fitness',
      build_muscle: 'Hypertrophy',
      strength: 'Strength & Power',
      fat_loss: 'Fat Loss'
    };
    specGoal.textContent = goalLabels[currentProfile.fitnessGoal] || 'General';

    const activityLabels = {
      sedentary: 'Sedentary',
      light: 'Lightly Active',
      moderate: 'Moderate',
      active: 'Active',
      very_active: 'Very Active'
    };
    specActivity.textContent = activityLabels[currentProfile.activityLevel] || 'Moderate';

  } catch (err) {
    console.error('Error loading profile:', err);
    showToast('Failed to load profile parameters', 'error');
  }
}

function setupModals() {
  // Open / Close Log Weight Modal
  openWeightBtn.onclick = () => {
    inputNewWeight.value = currentProfile?.weightKg || '';
    inputWeightDate.value = getTodayDateString();
    weightModal.classList.add('active');
  };
  closeWeightBtn.onclick = () => weightModal.classList.remove('active');

  // Submit Weight Log Form
  weightForm.onsubmit = async (e) => {
    e.preventDefault();
    const newWeight = parseFloat(inputNewWeight.value);
    const dateStr = inputWeightDate.value;

    if (!newWeight || !dateStr) {
      showToast('Please specify valid weight and date', 'warning');
      return;
    }

    try {
      submitWeightBtn.disabled = true;
      submitWeightBtn.textContent = 'Saving...';

      // 1. Write weight log document
      await addWeightLog(activeUser.uid, newWeight, dateStr);

      // 2. Re-compute BMI and BMR
      const h = currentProfile?.heightCm || 180;
      const age = currentProfile?.age || 28;
      const gender = currentProfile?.gender || 'male';
      const goal = currentProfile?.fitnessGoal || 'general_fitness';
      const act = currentProfile?.activityLevel || 'moderate';

      const { bmi } = calculateBMI(newWeight, h);
      const bmr = calculateBMR(newWeight, h, age, gender);
      const dailyCalories = calculateTargetCalories(bmr, act, goal);

      await updateUserProfile(activeUser.uid, {
        weightKg: newWeight,
        bmi,
        bmr,
        dailyCalories
      });

      showToast('Weight updated and metabolic targets synced', 'success');
      weightModal.classList.remove('active');
      await loadAndRenderProfile();
    } catch (err) {
      console.error(err);
      showToast('Failed to record weight log', 'error');
    } finally {
      submitWeightBtn.disabled = false;
      submitWeightBtn.textContent = 'Save Measurement';
    }
  };

  // Open / Close Edit Profile Modal
  openProfileBtn.onclick = () => {
    if (!currentProfile) return;
    editName.value = currentProfile.name || '';
    editAge.value = currentProfile.age || 28;
    editGender.value = currentProfile.gender || 'male';
    editHeight.value = currentProfile.heightCm || 180;
    editTarget.value = currentProfile.targetWeightKg || 70;
    editGoal.value = currentProfile.fitnessGoal || 'general_fitness';
    editActivity.value = currentProfile.activityLevel || 'moderate';
    profileModal.classList.add('active');
  };
  closeProfileBtn.onclick = () => profileModal.classList.remove('active');

  // Submit Profile Edit Form
  profileForm.onsubmit = async (e) => {
    e.preventDefault();
    const name = editName.value.trim();
    const age = parseInt(editAge.value, 10);
    const gender = editGender.value;
    const heightCm = parseFloat(editHeight.value);
    const targetWeightKg = parseFloat(editTarget.value);
    const fitnessGoal = editGoal.value;
    const activityLevel = editActivity.value;

    const currentWeight = currentProfile?.weightKg || targetWeightKg;
    const { bmi } = calculateBMI(currentWeight, heightCm);
    const bmr = calculateBMR(currentWeight, heightCm, age, gender);
    const dailyCalories = calculateTargetCalories(bmr, activityLevel, fitnessGoal);

    try {
      submitProfileBtn.disabled = true;
      submitProfileBtn.textContent = 'Saving...';

      await updateUserProfile(activeUser.uid, {
        name,
        age,
        gender,
        heightCm,
        targetWeightKg,
        fitnessGoal,
        activityLevel,
        bmi,
        bmr,
        dailyCalories
      });

      showToast('Profile specifications updated', 'success');
      profileModal.classList.remove('active');
      await loadAndRenderProfile();
    } catch (err) {
      console.error(err);
      showToast('Failed to update profile', 'error');
    } finally {
      submitProfileBtn.disabled = false;
      submitProfileBtn.textContent = 'Save Profile Changes';
    }
  };

  // Handle Logout
  logoutBtn.onclick = async () => {
    if (confirm('Are you sure you want to sign out of GGYM?')) {
      await logoutUser();
    }
  };
}