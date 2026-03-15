const STORAGE_KEY = "roll-journal-manual-tracker";

const state = loadState();

const focusForm = document.querySelector("#focus-form");
const progressForm = document.querySelector("#progress-form");
const struggleForm = document.querySelector("#struggle-form");

const focusCard = document.querySelector("#focus-card");
const progressList = document.querySelector("#progress-list");
const struggleItems = document.querySelector("#struggle-items");
const planBoard = document.querySelector("#plan-board");
const suggestionPreview = document.querySelector("#suggestion-preview");

focusForm.addEventListener("submit", handleFocusSave);
progressForm.addEventListener("submit", handleProgressSave);
struggleForm.addEventListener("submit", handleStruggleSave);
document.querySelector("#struggle-title").addEventListener("input", renderSuggestionPreview);
document.querySelector("#struggle-pattern").addEventListener("input", renderSuggestionPreview);
document.querySelector("#focus-position").addEventListener("change", renderSuggestionPreview);

progressList.addEventListener("click", handleProgressActions);
struggleItems.addEventListener("click", handleStruggleActions);

render();
renderSuggestionPreview();

function handleFocusSave(event) {
  event.preventDefault();
  state.focus = {
    title: document.querySelector("#focus-title").value.trim(),
    position: document.querySelector("#focus-position").value,
    status: document.querySelector("#focus-status").value,
    note: document.querySelector("#focus-note").value.trim()
  };
  persistAndRender();
}

function handleProgressSave(event) {
  event.preventDefault();
  state.progress.unshift({
    id: makeId(),
    title: document.querySelector("#progress-title").value.trim(),
    status: document.querySelector("#progress-status").value,
    evidence: document.querySelector("#progress-evidence").value.trim(),
    nextStep: document.querySelector("#progress-next-step").value.trim()
  });
  persistAndRender();
  progressForm.reset();
}

function handleStruggleSave(event) {
  event.preventDefault();
  const suggestions = getStruggleSuggestions(
    document.querySelector("#struggle-title").value.trim(),
    document.querySelector("#struggle-pattern").value.trim(),
    state.focus.position
  );

  state.struggles.unshift({
    id: makeId(),
    title: document.querySelector("#struggle-title").value.trim(),
    severity: document.querySelector("#struggle-severity").value,
    pattern: document.querySelector("#struggle-pattern").value.trim(),
    cause: document.querySelector("#struggle-cause").value.trim() || suggestions.cause,
    fix: document.querySelector("#struggle-fix").value.trim() || suggestions.fix,
    test: document.querySelector("#struggle-test").value.trim() || suggestions.test,
    suggestionCue: suggestions.cue,
    status: "Working"
  });
  persistAndRender();
  struggleForm.reset();
  document.querySelector("#struggle-severity").value = "Medium";
  renderSuggestionPreview();
}

function handleProgressActions(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }
  state.progress = state.progress.filter((item) => item.id !== button.dataset.progressId);
  persistAndRender();
}

function handleStruggleActions(event) {
  const button = event.target.closest("button");
  if (!button) {
    return;
  }

  const item = state.struggles.find((entry) => entry.id === button.dataset.struggleId);
  if (!item) {
    return;
  }

  if (button.classList.contains("struggle-advance")) {
    item.status = nextStruggleStatus(item.status);
  }

  if (button.classList.contains("struggle-delete")) {
    state.struggles = state.struggles.filter((entry) => entry.id !== item.id);
  }

  persistAndRender();
}

function render() {
  renderFocus();
  renderProgress();
  renderStruggles();
  renderPlan();
}

function renderSuggestionPreview() {
  const title = document.querySelector("#struggle-title").value.trim();
  const pattern = document.querySelector("#struggle-pattern").value.trim();
  const position = state.focus.position || document.querySelector("#focus-position").value;

  if (!title && !pattern) {
    suggestionPreview.innerHTML = '<div class="empty-state">Suggestion preview will show up here as you describe the struggle area.</div>';
    return;
  }

  const suggestions = getStruggleSuggestions(title, pattern, position);
  suggestionPreview.innerHTML = `
    <strong>Suggested support</strong>
    <ul>
      <li><span>Likely cause:</span> ${escapeHtml(suggestions.cause)}</li>
      <li><span>Drill or fix:</span> ${escapeHtml(suggestions.fix)}</li>
      <li><span>Next live test:</span> ${escapeHtml(suggestions.test)}</li>
      <li><span>Coaching cue:</span> ${escapeHtml(suggestions.cue)}</li>
    </ul>
  `;
}

function renderFocus() {
  const focus = state.focus;
  focusCard.innerHTML = focus.title
    ? `
        <strong>${escapeHtml(focus.title)}</strong>
        <p>${escapeHtml(focus.position)} • ${escapeHtml(focus.status)}</p>
        <p>${escapeHtml(focus.note || "No note yet.")}</p>
      `
    : '<div class="empty-state">Add your current focus to anchor the rest of the tracker.</div>';

  document.querySelector("#focus-title").value = focus.title || "";
  document.querySelector("#focus-position").value = focus.position || "Guard";
  document.querySelector("#focus-status").value = focus.status || "New";
  document.querySelector("#focus-note").value = focus.note || "";
}

function renderProgress() {
  progressList.innerHTML = state.progress.length
    ? state.progress.map((item) => `
        <li>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.status)}</p>
          <p>${escapeHtml(item.evidence || "No evidence yet.")}</p>
          <p>${escapeHtml(item.nextStep || "No next step yet.")}</p>
          <div class="list-actions">
            <button class="ghost-button" type="button" data-progress-id="${item.id}">Remove</button>
          </div>
        </li>
      `).join("")
    : '<li class="empty-state">Your progress areas will show up here.</li>';
}

function renderStruggles() {
  struggleItems.innerHTML = state.struggles.length
    ? state.struggles.map((item) => `
        <li>
          <strong>${escapeHtml(item.title)}</strong>
          <p>${escapeHtml(item.severity)} severity • ${escapeHtml(item.status)}</p>
          <p><span class="inline-label">Pattern:</span> ${escapeHtml(item.pattern || "No pattern yet.")}</p>
          <p><span class="inline-label">Cause:</span> ${escapeHtml(item.cause || "No cause yet.")}</p>
          <p><span class="inline-label">Fix:</span> ${escapeHtml(item.fix || "No fix yet.")}</p>
          <p><span class="inline-label">Next test:</span> ${escapeHtml(item.test || "No next test yet.")}</p>
          <p><span class="inline-label">Cue:</span> ${escapeHtml(item.suggestionCue || "No cue yet.")}</p>
          <div class="list-actions">
            <button class="ghost-button struggle-advance" type="button" data-struggle-id="${item.id}">Advance status</button>
            <button class="ghost-button struggle-delete" type="button" data-struggle-id="${item.id}">Remove</button>
          </div>
        </li>
      `).join("")
    : '<li class="empty-state">Your manual struggle areas will show up here.</li>';
}

function renderPlan() {
  const topProgress = state.progress[0];
  const topStruggle = state.struggles[0];
  const plan = [];

  if (state.focus.title) {
    plan.push(`Main focus: ${state.focus.title}`);
  }
  if (topProgress) {
    plan.push(`Keep building: ${topProgress.title}. Next step: ${topProgress.nextStep || "keep reinforcing it in live rounds."}`);
  }
  if (topStruggle) {
    plan.push(`Main struggle: ${topStruggle.title}. Fix: ${topStruggle.fix || "slow the reps down and clarify the mechanic."}`);
    plan.push(`Next live test: ${topStruggle.test || "pick one cue and judge success by whether you hit it on time."}`);
  }

  planBoard.innerHTML = plan.length
    ? `<ul>${plan.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : '<div class="empty-state">As you add a focus, progress areas, and struggles, your next-step plan will show up here.</div>';
}

function nextStruggleStatus(current) {
  const order = ["Working", "Improving", "Managed"];
  const index = order.indexOf(current);
  return order[(index + 1) % order.length];
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      focus: saved?.focus || { title: "", position: "Guard", status: "New", note: "" },
      progress: Array.isArray(saved?.progress) ? saved.progress : [],
      struggles: Array.isArray(saved?.struggles) ? saved.struggles : []
    };
  } catch {
    return {
      focus: { title: "", position: "Guard", status: "New", note: "" },
      progress: [],
      struggles: []
    };
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function getStruggleSuggestions(title, pattern, position) {
  const text = `${title} ${pattern}`.toLowerCase();

  if (text.includes("flatten") || text.includes("frame") || text.includes("knee shield")) {
    return {
      cause: "Your frame may be collapsing before your hips move, so you are arriving late to structure.",
      fix: "Do 3 sets of frame-to-knee-shield recovery reps with a pause at full structure.",
      test: "In your next two rounds, judge success only by whether your top frame arrives before the pressure settles.",
      cue: "Frame first, hips second, underhook third."
    };
  }

  if (text.includes("back") || text.includes("seatbelt") || text.includes("hand fight")) {
    return {
      cause: "You may be reacting after the control is fully locked instead of winning the hand fight early.",
      fix: "Do 3 sets of hand-fight to shoulder-hide reps before class.",
      test: "Use the first sign of chest-to-back connection as your cue to peel hands immediately.",
      cue: "Hands before hips."
    };
  }

  if (text.includes("takedown") || text.includes("shot") || text.includes("standing")) {
    return {
      cause: "Your entry may be visible early, or your feet may be too square before penetration.",
      fix: "Shadow 3 sets of level changes into angle-step entries and penetration steps.",
      test: "Commit to one setup-to-shot sequence per round instead of changing plans mid-entry.",
      cue: "Setup, level change, angle, go."
    };
  }

  return {
    cause: `This ${position.toLowerCase()} issue likely needs a clearer first beat, so slow reps and earlier structure should help.`,
    fix: "Do 3 sets of slow shadow reps for the exact moment the position breaks down, then add one focused live-round cue.",
    test: "Pick one small cue for the next class and measure success only by whether you hit it on time.",
    cue: "Earlier decision, cleaner structure."
  };
}

function makeId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
