import { findCondition, getExercisesForCondition, getExercise } from "./therapy-data.js";

const input = document.getElementById("condition-input");
const searchBtn = document.getElementById("condition-search-btn");
const resultEl = document.getElementById("condition-result");
const exercisesEl = document.getElementById("exercises-grid");
const stepsEl = document.getElementById("exercise-steps");
const cameraHint = document.getElementById("camera-select-hint");
const launchBtn = document.getElementById("camera-launch");

let selectedCondition = null;
let selectedExercise = null;

const msg = (ar, en) => (document.documentElement.lang === "en" ? en : ar);
const isEn = () => document.documentElement.lang === "en";

export function getSelectedExercise() {
  return selectedExercise;
}

function renderExercises(condition) {
  const exercises = getExercisesForCondition(condition);
  if (!exercisesEl) return;

  exercisesEl.innerHTML = exercises.map((ex) => `
    <button type="button" class="exercise-card" data-id="${ex.id}" aria-pressed="false">
      <span class="exercise-card-badge">${ex.steps?.length || 3} ${msg("خطوات", "steps")}</span>
      <img src="${ex.image}" alt="" class="exercise-card-img" width="200" height="180" loading="lazy" />
      <div class="exercise-card-body">
        <h4>${isEn() ? ex.nameEn : ex.nameAr}</h4>
        <p>${isEn() ? ex.descEn : ex.descAr}</p>
      </div>
    </button>
  `).join("");

  exercisesEl.hidden = exercises.length === 0;
  exercisesEl.querySelectorAll(".exercise-card").forEach((card) => {
    card.addEventListener("click", () => selectExercise(card.dataset.id));
  });
}

function renderStepGuide(ex) {
  if (!stepsEl || !ex.steps) return;
  const stepsHtml = ex.steps.map((step, i) => `
    <figure class="exercise-step-card">
      <img src="${step.image}" alt="" class="exercise-step-img" loading="lazy" />
      <figcaption>
        <span class="exercise-step-num">${i + 1}</span>
        ${isEn() ? step.textEn : step.textAr}
      </figcaption>
    </figure>
  `).join("");

  stepsEl.hidden = false;
  stepsEl.innerHTML = `
    <h4>${msg("شرح التمرين خطوة بخطوة", "Step-by-step guide")}</h4>
    <div class="exercise-steps-grid">${stepsHtml}</div>
    <p class="exercise-steps-cta">${msg("↓ بعد ما تتعلّمين الخطوات — شغّلي الكاميرا وطبّقي", "↓ Learn the steps — then start camera")}</p>
  `;
}

function selectExercise(id) {
  selectedExercise = getExercise(id);
  if (!selectedExercise) return;

  exercisesEl?.querySelectorAll(".exercise-card").forEach((c) => {
    const on = c.dataset.id === id;
    c.classList.toggle("is-selected", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });

  renderStepGuide(selectedExercise);

  if (cameraHint) {
    cameraHint.hidden = false;
    cameraHint.textContent = msg(
      `✓ ${selectedExercise.nameAr} — اضغطي «ابدأ التمرين»`,
      `✓ ${selectedExercise.nameEn} — tap Start Exercise`
    );
  }

  if (launchBtn) {
    launchBtn.disabled = false;
    const span = launchBtn.querySelector("span");
    if (span) span.textContent = msg("ابدأ التمرين مع الكاميرا", "Start Exercise with Camera");
  }

  const label = document.querySelector(".camera-exercise");
  if (label) label.textContent = isEn() ? selectedExercise.nameEn : selectedExercise.nameAr;

  document.getElementById("therapy-start")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function searchCondition() {
  const query = input?.value || "";
  selectedCondition = findCondition(query);
  selectedExercise = null;

  if (stepsEl) { stepsEl.hidden = true; stepsEl.innerHTML = ""; }
  if (cameraHint) cameraHint.hidden = true;
  if (launchBtn) launchBtn.disabled = true;

  if (!query.trim()) {
    if (resultEl) resultEl.hidden = true;
    if (exercisesEl) { exercisesEl.hidden = true; exercisesEl.innerHTML = ""; }
    return;
  }

  if (resultEl) {
    resultEl.hidden = false;
    if (selectedCondition) {
      resultEl.className = "condition-result condition-result--found";
      resultEl.textContent = msg(
        `✓ ${selectedCondition.nameAr} — ${getExercisesForCondition(selectedCondition).length} تمارين`,
        `✓ ${selectedCondition.nameEn} — ${getExercisesForCondition(selectedCondition).length} exercises`
      );
      renderExercises(selectedCondition);
    } else {
      resultEl.className = "condition-result condition-result--none";
      resultEl.textContent = msg(
        "لم نجد حالة مطابقة — جرّب: انزلاق غضروفي، ركبة، كتف",
        "No match — try: disc herniation, knee, shoulder"
      );
      if (exercisesEl) { exercisesEl.hidden = true; exercisesEl.innerHTML = ""; }
    }
  }
}

searchBtn?.addEventListener("click", searchCondition);
input?.addEventListener("keydown", (e) => { if (e.key === "Enter") searchCondition(); });
input?.addEventListener("input", () => {
  if ((input.value || "").length >= 3) searchCondition();
});

if (launchBtn) launchBtn.disabled = true;

document.querySelectorAll("[data-condition-suggest]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (input) input.value = btn.dataset.conditionSuggest || "";
    searchCondition();
  });
});

export { selectedExercise };
