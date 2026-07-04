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

export function getSelectedExercise() {
  return selectedExercise;
}

function renderExercises(condition) {
  const exercises = getExercisesForCondition(condition);
  if (!exercisesEl) return;

  exercisesEl.innerHTML = exercises.map((ex) => `
    <button type="button" class="exercise-card" data-id="${ex.id}" aria-pressed="false">
      <img src="${ex.image}" alt="" class="exercise-card-img" width="200" height="160" loading="lazy" />
      <div class="exercise-card-body">
        <h4>${document.documentElement.lang === "en" ? ex.nameEn : ex.nameAr}</h4>
        <p>${document.documentElement.lang === "en" ? ex.descEn : ex.descAr}</p>
      </div>
    </button>
  `).join("");

  exercisesEl.hidden = exercises.length === 0;

  exercisesEl.querySelectorAll(".exercise-card").forEach((card) => {
    card.addEventListener("click", () => selectExercise(card.dataset.id));
  });
}

function selectExercise(id) {
  selectedExercise = getExercise(id);
  if (!selectedExercise) return;

  exercisesEl?.querySelectorAll(".exercise-card").forEach((c) => {
    const on = c.dataset.id === id;
    c.classList.toggle("is-selected", on);
    c.setAttribute("aria-pressed", on ? "true" : "false");
  });

  if (stepsEl) {
    const steps = document.documentElement.lang === "en"
      ? selectedExercise.stepsEn
      : selectedExercise.stepsAr;
    stepsEl.hidden = false;
    stepsEl.innerHTML = `
      <h4>${msg("خطوات التمرين", "Exercise Steps")}</h4>
      <ol>${steps.map((s) => `<li>${s}</li>`).join("")}</ol>
      <p class="exercise-steps-cta">${msg("↓ الآن شغّلي الكاميرا وطبّقي التمرين", "↓ Now start camera and practice")}</p>
    `;
  }

  if (cameraHint) {
    cameraHint.hidden = false;
    cameraHint.textContent = msg(
      `✓ ${selectedExercise.nameAr} — اضغطي «ابدأ التمرين»`,
      `✓ ${selectedExercise.nameEn} — tap Start Exercise`
    );
  }

  if (launchBtn) {
    launchBtn.disabled = false;
    launchBtn.querySelector("span")?.replaceChildren(
      document.createTextNode(msg("ابدأ التمرين مع الكاميرا", "Start Exercise with Camera"))
    );
  }

  const label = document.querySelector(".camera-exercise");
  if (label) {
    label.textContent = document.documentElement.lang === "en"
      ? selectedExercise.nameEn
      : selectedExercise.nameAr;
  }

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

window.addEventListener("languagechange", () => {
  if (selectedCondition) renderExercises(selectedCondition);
  if (selectedExercise) selectExercise(selectedExercise.id);
});

/* اقتراحات سريعة */
document.querySelectorAll("[data-condition-suggest]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (input) input.value = btn.dataset.conditionSuggest || "";
    searchCondition();
  });
});

export { selectedExercise };
