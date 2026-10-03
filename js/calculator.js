// js/calculator.js

/**
 * Calculate Body Mass Index (BMI)
 * Formula: weight (kg) / [height (m)]^2
 */
export function calculateBMI(weightKg, heightCm) {
  if (!weightKg || !heightCm || heightCm <= 0) return { bmi: 0, category: 'Unknown' };
  
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  let category = 'Normal';
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi >= 25 && bmi < 29.9) category = 'Overweight';
  else if (bmi >= 30) category = 'Obese';

  return { bmi, category };
}

/**
 * Calculate Basal Metabolic Rate (BMR) using Mifflin–St Jeor Equation
 * Men:   (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
 * Women: (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
 * Other: default to average offset (-78)
 */
export function calculateBMR(weightKg, heightCm, ageYears, gender = 'male') {
  if (!weightKg || !heightCm || !ageYears) return 0;

  const base = (10 * weightKg) + (6.25 * heightCm) - (5 * ageYears);
  
  if (gender === 'male') {
    return Math.round(base + 5);
  } else if (gender === 'female') {
    return Math.round(base - 161);
  } else {
    return Math.round(base - 78);
  }
}

/**
 * Calculate Total Daily Energy Expenditure (TDEE) and Target Calories
 * Multipliers:
 * - Sedentary: 1.2
 * - Light: 1.375
 * - Moderate: 1.55
 * - Active: 1.725
 * - Very Active: 1.9
 *
 * Goal Adjustments:
 * - Fat Loss: -20% (-500 kcal approx)
 * - Build Muscle: +10%
 * - Strength: +5%
 * - General Fitness: maintenance (0%)
 */
export function calculateTargetCalories(bmr, activityLevel = 'moderate', fitnessGoal = 'general_fitness') {
  if (!bmr || bmr <= 0) return 0;

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };

  const goalModifiers = {
    fat_loss: 0.80,       // 20% deficit
    build_muscle: 1.10,   // 10% surplus
    strength: 1.05,       // 5% surplus
    general_fitness: 1.00 // Maintenance
  };

  const multiplier = activityMultipliers[activityLevel] || 1.55;
  const modifier = goalModifiers[fitnessGoal] || 1.0;

  const maintenance = bmr * multiplier;
  return Math.round(maintenance * modifier);
}