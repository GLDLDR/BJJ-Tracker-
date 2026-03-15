const STORAGE_KEY = "roll-journal-data-v2";

const defaultState = {
  profile: {
    name: "",
    belt: "White",
    academy: "",
    game: "",
    focus: "",
    workingOn: "",
    branches: freshBranches()
  },
  sessions: [],
  goals: [],
  techniques: [],
  studyItems: []
};

const DRILL_LIBRARY = {
  "Guard|Guard retention": [
    "3 x 1 minute hip escape to square recoveries",
    "2 x 10 seated guard leg-pummel cycles each side",
    "2 x 45 seconds inversion prep or shoulder roll entries"
  ],
  "Half Guard|Frames breaking down": [
    "3 x 12 frame-to-knee-shield entries on each side",
    "2 x 10 underhook get-up motions",
    "2 x 45 seconds side crunch to elbow-knee connection work"
  ],
  "Side Control|Escapes timing": [
    "3 x 10 bridge to shrimp combinations",
    "2 x 10 elbow-knee recoveries",
    "2 x 45 seconds frame placement holds"
  ],
  "Mount|Escapes timing": [
    "3 x 10 trap-and-roll bridges each side",
    "3 x 10 elbow escape hip scoots",
    "2 x 30 seconds explosive bridge intervals"
  ],
  "Back|Finishing mechanics": [
    "3 x 10 seatbelt to choking-arm path reps",
    "2 x 45 seconds hand-fight and peel sequences",
    "2 x 30 seconds squeeze-and-release finish mechanics"
  ],
  "Standing|Takedown entries": [
    "3 x 1 minute stance motion and level changes",
    "3 x 10 penetration-step shadow reps",
    "2 x 30 seconds angle-step entries"
  ],
  "Turtle|Grip fighting": [
    "3 x 45 seconds hand-fight and elbow-knee connection",
    "2 x 10 sit-out to square-up motions",
    "2 x 10 front-headlock defense hand paths"
  ],
  "Scramble|Balance and base": [
    "3 x 30 seconds technical standups",
    "3 x 30 seconds sprawls to stance recovery",
    "2 x 10 shin-box getups"
  ]
};

const state = loadState();

const profileForm = document.querySelector("#profile-form");
const sessionForm = document.querySelector("#session-form");
const goalForm = document.querySelector("#goal-form");
const techniqueForm = document.querySelector("#technique-form");
const studyForm = document.querySelector("#study-form");

const profileCard = document.querySelector("#profile-card");
const pathCard = document.querySelector("#path-card");
const sessionList = document.querySelector("#session-list");
const goalList = document.querySelector("#goal-list");
const techniqueList = document.querySelector("#technique-list");
const studyList = document.querySelector("#study-list");
const coachCard = document.querySelector("#coach-card");
const weeklyGrid = document.querySelector("#weekly-grid");
const gamePlan = document.querySelector("#game-plan");
const focusStrip = document.querySelector("#focus-strip");
const selfTestOutput = document.querySelector("#self-test-output");

const statSessions = document.querySelector("#stat-sessions");
const statHours = document.querySelector("#stat-hours");
const statRounds = document.querySelector("#stat-rounds");
const statStreak = document.querySelector("#stat-streak");
const statTheme = document.querySelector("#stat-theme");
const statProblem = document.querySelector("#stat-problem");
const todayFocus = document.querySelector("#today-focus");
const focusSupport = document.querySelector("#focus-support");

const sessionIdInput = document.querySelector("#session-id");
const sessionSubmit = document.querySelector("#session-submit");
const sessionCancel = document.querySelector("#session-cancel");
const BRANCH_TYPES = [
  { key: "primary", label: "Primary attack" },
  { key: "secondary", label: "Secondary attack" },
  { key: "fallback", label: "Fallback" },
  { key: "escape", label: "Escape route" }
];

document.querySelector("#session-date").value = todayString();
hydrateProfileForm();
bindEvents();
render();

function bindEvents() {
  profileForm.addEventListener("submit", handleProfileSave);
  sessionForm.addEventListener("submit", handleSessionSave);
  goalForm.addEventListener("submit", handleGoalSave);
  techniqueForm.addEventListener("submit", handleTechniqueSave);
  studyForm.addEventListener("submit", handleStudySave);

  sessionCancel.addEventListener("click", resetSessionForm);

  sessionList.addEventListener("click", handleSessionActions);
  goalList.addEventListener("click", handleGoalActions);
  techniqueList.addEventListener("click", handleTechniqueActions);
  studyList.addEventListener("click", handleStudyActions);
  pathCard.addEventListener("click", handlePathActions);

  document.querySelector("#jump-to-log").addEventListener("click", () => {
    document.querySelector("#log-panel").scrollIntoView({ behavior: "smooth", block: "start" });
    document.querySelector("#session-techniques").focus();
  });

  document.querySelector("#export-data").addEventListener("click", exportData);
  document.querySelector("#import-data").addEventListener("change", importData);
  document.querySelector("#run-self-test").addEventListener("click", runSelfTest);
}

function handleProfileSave(event) {
  event.preventDefault();
  state.profile = {
    name: document.querySelector("#profile-name").value.trim(),
    belt: document.querySelector("#profile-belt").value,
    academy: document.querySelector("#profile-academy").value.trim(),
    game: document.querySelector("#profile-game").value.trim(),
    focus: document.querySelector("#profile-focus").value.trim(),
    workingOn: document.querySelector("#profile-working-on").value.trim(),
    branches: {
      primary: uniqueItems(splitItems(document.querySelector("#profile-primary-branches").value)),
      secondary: uniqueItems(splitItems(document.querySelector("#profile-secondary-branches").value)),
      fallback: uniqueItems(splitItems(document.querySelector("#profile-fallback-branches").value)),
      escape: uniqueItems(splitItems(document.querySelector("#profile-escape-branches").value))
    }
  };
  persistAndRender();
}

function handleSessionSave(event) {
  event.preventDefault();

  const session = {
    id: sessionIdInput.value || makeId(),
    date: document.querySelector("#session-date").value,
    type: document.querySelector("#session-type").value,
    duration: Number(document.querySelector("#session-duration").value),
    intensity: document.querySelector("#session-intensity").value,
    energy: document.querySelector("#session-energy").value,
    techniques: splitItems(document.querySelector("#session-techniques").value),
    position: document.querySelector("#session-position").value,
    problemTag: document.querySelector("#session-problem-tag").value,
    rounds: Number(document.querySelector("#session-rounds").value),
    rollQuality: document.querySelector("#session-roll-quality").value,
    partner: document.querySelector("#session-partner").value.trim(),
    wins: document.querySelector("#session-wins").value.trim(),
    lessons: document.querySelector("#session-lessons").value.trim(),
    studyTarget: document.querySelector("#session-study-target").value.trim(),
    homeIdea: document.querySelector("#session-home-idea").value.trim()
  };

  const existingIndex = state.sessions.findIndex((entry) => entry.id === session.id);

  if (existingIndex >= 0) {
    state.sessions[existingIndex] = session;
  } else {
    state.sessions.unshift(session);
  }

  if (session.studyTarget) {
    const hasExistingStudyItem = state.studyItems.some(
      (item) => item.title.toLowerCase() === session.studyTarget.toLowerCase()
    );

    if (!hasExistingStudyItem) {
      state.studyItems.unshift({
        id: makeId(),
        title: session.studyTarget,
        source: "Session review",
        action: session.homeIdea || session.lessons || "Review the position before your next class.",
        done: false,
        createdAt: new Date().toISOString()
      });
    }
  }

  state.sessions.sort((a, b) => new Date(b.date) - new Date(a.date));
  persistAndRender();
  resetSessionForm();
}

function handleGoalSave(event) {
  event.preventDefault();
  const title = document.querySelector("#goal-title").value.trim();

  if (!title) {
    return;
  }

  state.goals.unshift({
    id: makeId(),
    title,
    note: document.querySelector("#goal-note").value.trim(),
    createdAt: new Date().toISOString()
  });

  persistAndRender();
  goalForm.reset();
}

function handleTechniqueSave(event) {
  event.preventDefault();
  const name = document.querySelector("#technique-name").value.trim();

  if (!name) {
    return;
  }

  state.techniques.unshift({
    id: makeId(),
    name,
    category: document.querySelector("#technique-category").value,
    detail: document.querySelector("#technique-detail").value.trim()
  });

  persistAndRender();
  techniqueForm.reset();
}

function handleStudySave(event) {
  event.preventDefault();
  const title = document.querySelector("#study-title").value.trim();

  if (!title) {
    return;
  }

  state.studyItems.unshift({
    id: makeId(),
    title,
    source: document.querySelector("#study-source").value,
    action: document.querySelector("#study-action").value.trim(),
    done: false,
    createdAt: new Date().toISOString()
  });

  persistAndRender();
  studyForm.reset();
}

function handleSessionActions(event) {
  const actionButton = event.target.closest("button");

  if (!actionButton) {
    return;
  }

  const sessionId = actionButton.dataset.sessionId;
  const session = state.sessions.find((entry) => entry.id === sessionId);

  if (!session) {
    return;
  }

  if (actionButton.classList.contains("timeline__delete")) {
    state.sessions = state.sessions.filter((entry) => entry.id !== sessionId);
    persistAndRender();
    if (sessionIdInput.value === sessionId) {
      resetSessionForm();
    }
    return;
  }

  if (actionButton.classList.contains("timeline__edit")) {
    fillSessionForm(session);
    document.querySelector("#log-panel").scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function handleGoalActions(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  state.goals = state.goals.filter((goal) => goal.id !== button.dataset.goalId);
  persistAndRender();
}

function handleTechniqueActions(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  state.techniques = state.techniques.filter((technique) => technique.id !== button.dataset.techniqueId);
  persistAndRender();
}

function handleStudyActions(event) {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const item = state.studyItems.find((studyItem) => studyItem.id === button.dataset.studyId);

  if (!item) {
    return;
  }

  if (button.classList.contains("study-toggle")) {
    item.done = !item.done;
  }

  if (button.classList.contains("study-delete")) {
    state.studyItems = state.studyItems.filter((studyItem) => studyItem.id !== item.id);
  }

  persistAndRender();
}

function handlePathActions(event) {
  const branch = event.target.closest(".path-branch");

  if (!branch) {
    return;
  }

  const nextFocus = branch.dataset.move;
  const branchType = branch.dataset.branchType;
  const currentFocus = state.profile.workingOn.trim();
  const branches = normalizeBranches(state.profile.branches);
  branches[branchType] = branches[branchType].filter((move) => move !== nextFocus);

  if (currentFocus) {
    branches[branchType].push(currentFocus);
  }

  state.profile.workingOn = nextFocus;
  state.profile.branches = normalizeBranches(branches);
  persistAndRender();
  hydrateProfileForm();
}

function runSelfTest() {
  const snapshot = JSON.stringify(state);
  const results = [];

  try {
    state.profile = {
      ...state.profile,
      workingOn: "Knee shield retention",
      branches: normalizeBranches({
        primary: ["Underhook to dogfight"],
        secondary: ["Wrestle-up single"],
        fallback: ["Recover closed guard"],
        escape: ["Technical standup"]
      })
    };

    render();

    assert(results, state.profile.workingOn === "Knee shield retention", "Seeds a working focus");
    assert(results, pathCard.textContent.includes("Primary attack"), "Renders grouped branch labels");
    assert(results, pathCard.textContent.includes("Underhook to dogfight"), "Shows primary branch content");

    const branchButton = pathCard.querySelector('[data-branch-type="primary"][data-move="Underhook to dogfight"]');
    assert(results, Boolean(branchButton), "Creates clickable branch buttons");

    if (branchButton) {
      branchButton.click();
      assert(results, state.profile.workingOn === "Underhook to dogfight", "Promotes clicked branch into working focus");
      assert(results, normalizeBranches(state.profile.branches).primary.includes("Knee shield retention"), "Rotates previous focus back into same branch lane");
    }

    const passed = results.every((result) => result.pass);
    selfTestOutput.className = `self-test__output ${passed ? "self-test__output--pass" : "self-test__output--fail"}`;
    selfTestOutput.innerHTML = `
      <strong>${passed ? "Self-test passed" : "Self-test found issues"}</strong>
      <ul>${results.map((result) => `<li>${escapeHtml(`${result.pass ? "PASS" : "FAIL"}: ${result.message}`)}</li>`).join("")}</ul>
    `;
  } finally {
    const restored = normalizeState(JSON.parse(snapshot));
    state.profile = restored.profile;
    state.sessions = restored.sessions;
    state.goals = restored.goals;
    state.techniques = restored.techniques;
    state.studyItems = restored.studyItems;
    hydrateProfileForm();
    render();
  }
}

function render() {
  renderProfile();
  renderPathCard();
  renderSessions();
  renderGoals();
  renderTechniques();
  renderStudyItems();
  renderStats();
  renderWeeklyGrid();
  renderGamePlan();
  renderCoach();
  renderFocusStrip();
}

function renderProfile() {
  const { profile } = state;
  const label = profile.name || "Your profile";
  const game = profile.game || "Add your A-game description so the app can stay anchored to how you actually want to win.";
  const focus = profile.focus || "Add a current focus so your reviews and home sessions point at the same problem.";
  const workingOn = profile.workingOn || "Add what you are sharpening right now.";
  const branchSummary = BRANCH_TYPES
    .map(({ key, label }) => {
      const items = profile.branches?.[key] || [];
      return items.length ? `${label}: ${items.join(", ")}` : "";
    })
    .filter(Boolean)
    .join(" • ");

  profileCard.innerHTML = `
    <strong>${escapeHtml(label)}${profile.belt ? ` • ${escapeHtml(profile.belt)} belt` : ""}</strong>
    <p>${escapeHtml(profile.academy || "No academy listed yet.")}</p>
    <p><span class="inline-label">A-game:</span> ${escapeHtml(game)}</p>
    <p><span class="inline-label">Current focus:</span> ${escapeHtml(focus)}</p>
    <p><span class="inline-label">Working on now:</span> ${escapeHtml(workingOn)}</p>
    <p><span class="inline-label">Flow chart:</span> ${escapeHtml(branchSummary || "Add branch options below your current focus.")}</p>
  `;
}

function renderPathCard() {
  const workingOn = state.profile.workingOn;
  const branches = normalizeBranches(state.profile.branches);
  const hasBranches = BRANCH_TYPES.some(({ key }) => branches[key].length > 0);

  if (!workingOn && !hasBranches) {
    pathCard.innerHTML = '<div class="empty-state">Add a current focus and a few move-to options in your profile to build your path.</div>';
    return;
  }

  pathCard.innerHTML = `
    <div class="path-card__current">
      <span class="path-card__label">Working on now</span>
      <strong>${escapeHtml(workingOn || "No current focus yet")}</strong>
    </div>
    <div class="path-card__branches">
      ${hasBranches
        ? BRANCH_TYPES.map(({ key, label }) => renderBranchGroup(key, label, branches[key])).join("")
        : '<div class="empty-state">Add your next branches in the profile form.</div>'}
    </div>
  `;
}

function renderSessions() {
  sessionList.innerHTML = "";

  if (state.sessions.length === 0) {
    sessionList.innerHTML = '<li class="empty-state">Your first session will unlock the coaching, game plan, and consistency views.</li>';
    return;
  }

  const template = document.querySelector("#session-item-template");

  state.sessions
    .slice(0, 8)
    .forEach((session) => {
      const fragment = template.content.cloneNode(true);
      fragment.querySelector(".timeline__date").textContent = formatDate(session.date);
      fragment.querySelector(".timeline__topline").textContent =
        `${session.type} • ${session.duration} min • ${session.rounds || 0} rounds • ${session.intensity || session.rollQuality}`;
      fragment.querySelector(".timeline__tags").innerHTML = [
        makeTag(session.position || "No position"),
        makeTag(session.problemTag || "No problem"),
        session.partner ? makeTag(session.partner) : ""
      ].join("");
      fragment.querySelector(".timeline__techniques").textContent = session.techniques.length
        ? `Worked on: ${session.techniques.join(", ")}`
        : "Worked on: no techniques logged";
      fragment.querySelector(".timeline__wins").textContent = session.wins
        ? `Worked: ${session.wins}`
        : "Worked: no success notes logged";
      fragment.querySelector(".timeline__lessons").textContent = session.lessons
        ? `Review: ${session.lessons}`
        : "Review: no recurring issue logged";
      fragment.querySelector(".timeline__home").textContent = session.homeIdea
        ? `Home reps: ${session.homeIdea}`
        : session.studyTarget
          ? `Home reps: review ${session.studyTarget}`
          : "Home reps: no solo plan logged";
      fragment.querySelector(".timeline__edit").dataset.sessionId = session.id;
      fragment.querySelector(".timeline__delete").dataset.sessionId = session.id;
      sessionList.appendChild(fragment);
    });
}

function renderGoals() {
  goalList.innerHTML = "";

  if (state.goals.length === 0) {
    goalList.innerHTML = '<li class="empty-state">Add one or two goals so your training notes have a clear direction.</li>';
    return;
  }

  state.goals.slice(0, 5).forEach((goal) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${escapeHtml(goal.title)}</strong>
      <p>${escapeHtml(goal.note || "No note yet.")}</p>
      <div class="list-actions">
        <button class="ghost-button" type="button" data-goal-id="${goal.id}">Remove</button>
      </div>
    `;
    goalList.appendChild(item);
  });
}

function renderTechniques() {
  techniqueList.innerHTML = "";

  if (state.techniques.length === 0) {
    techniqueList.innerHTML = '<li class="empty-state">Save the coaching details you want available before open mat or comp class.</li>';
    return;
  }

  state.techniques.slice(0, 6).forEach((technique) => {
    const item = document.createElement("li");
    item.innerHTML = `
      <strong>${escapeHtml(technique.name)} <span class="muted">• ${escapeHtml(technique.category)}</span></strong>
      <p>${escapeHtml(technique.detail || "No detail yet.")}</p>
      <div class="list-actions">
        <button class="ghost-button" type="button" data-technique-id="${technique.id}">Remove</button>
      </div>
    `;
    techniqueList.appendChild(item);
  });
}

function renderStudyItems() {
  studyList.innerHTML = "";

  if (state.studyItems.length === 0) {
    studyList.innerHTML = '<li class="empty-state">Recurring problems and targeted review items will stack up here.</li>';
    return;
  }

  state.studyItems
    .slice()
    .sort((a, b) => Number(a.done) - Number(b.done) || new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6)
    .forEach((item) => {
      const row = document.createElement("li");
      row.className = item.done ? "list-item--done" : "";
      row.innerHTML = `
        <strong>${escapeHtml(item.title)}</strong>
        <p>${escapeHtml(item.source)}${item.action ? ` • ${escapeHtml(item.action)}` : ""}</p>
        <div class="list-actions">
          <button class="ghost-button study-toggle" type="button" data-study-id="${item.id}">
            ${item.done ? "Mark open" : "Mark done"}
          </button>
          <button class="ghost-button study-delete" type="button" data-study-id="${item.id}">Remove</button>
        </div>
      `;
      studyList.appendChild(row);
    });
}

function renderStats() {
  const totalSessions = state.sessions.length;
  const totalMinutes = state.sessions.reduce((sum, session) => sum + (session.duration || 0), 0);
  const totalRounds = state.sessions.reduce((sum, session) => sum + (session.rounds || 0), 0);
  const themeCounts = countValues(state.sessions.flatMap((session) => session.techniques.map((technique) => titleCase(technique.toLowerCase()))));
  const problemCounts = countValues(state.sessions.map((session) => session.problemTag).filter(Boolean));

  statSessions.textContent = String(totalSessions);
  statHours.textContent = formatHours(totalMinutes);
  statRounds.textContent = String(totalRounds);
  statStreak.textContent = formatStreak(calculateStreak(state.sessions));
  statTheme.textContent = topLabel(themeCounts, "None yet");
  statProblem.textContent = topLabel(problemCounts, "None yet");
}

function renderWeeklyGrid() {
  weeklyGrid.innerHTML = "";
  const counts = buildRecentDayCounts(state.sessions, 21);

  counts.forEach((entry) => {
    const cell = document.createElement("div");
    const level = Math.min(entry.count, 3);
    cell.className = `day-cell day-cell--${level}`;
    cell.innerHTML = `<span>${entry.label}</span><strong>${entry.count}</strong>`;
    weeklyGrid.appendChild(cell);
  });
}

function renderGamePlan() {
  const items = buildGamePlan();

  gamePlan.innerHTML = items.length
    ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : '<div class="empty-state">Log sessions, add a goal, or fill out your profile to generate a game plan.</div>';
}

function renderCoach() {
  const latestSession = state.sessions[0];
  const primaryGoal = state.goals[0];
  const studyItem = state.studyItems.find((item) => !item.done);
  const featuredTechnique = state.techniques[0];
  const smartDrills = latestSession ? getSmartDrills(latestSession) : [];

  if (!latestSession && !primaryGoal && !studyItem && !featuredTechnique) {
    todayFocus.textContent = "Log a session and your next rep target will show up here.";
    focusSupport.textContent = "The app uses your latest journal patterns, goals, and study queue to pick a useful next focus.";
    coachCard.innerHTML = `
      <h3>Starter solo session</h3>
      <ul>
        <li>Pick one position you see every week.</li>
        <li>Do 3 rounds of solo movement: shrimping, bridges, technical standups, and sit-outs.</li>
        <li>Write one problem that keeps happening and one movement that helps solve it.</li>
      </ul>
    `;
    return;
  }

  const focus = studyItem?.title || primaryGoal?.title || latestSession?.studyTarget || latestSession?.techniques?.[0] || featuredTechnique?.name;
  const pathFocus = state.profile.workingOn;
  todayFocus.textContent = pathFocus
    ? `Train next around: ${pathFocus}`
    : focus
      ? `Train next around: ${focus}`
      : "Train next around your latest notes.";
  focusSupport.textContent = latestSession?.lessons
    ? `Most recent friction point: ${latestSession.lessons}`
    : primaryGoal?.note || "Your profile, goals, and latest sessions are shaping the plan below.";

  const points = buildCoachPoints(latestSession, primaryGoal, studyItem, featuredTechnique, smartDrills);

  coachCard.innerHTML = `
    <h3>Off-day home session</h3>
    <ul>${points.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
  `;
}

function renderFocusStrip() {
  const openStudyCount = state.studyItems.filter((item) => !item.done).length;
  const streak = calculateStreak(state.sessions);
  const latestSession = state.sessions[0];

  focusStrip.innerHTML = [
    focusChip("Open review items", String(openStudyCount)),
    focusChip("Current streak", formatStreak(streak)),
    focusChip("Latest position", latestSession?.position || "None yet")
  ].join("");
}

function buildCoachPoints(session, goal, studyItem, technique, smartDrills) {
  const points = [];

  if (goal) {
    points.push(`Anchor the session to your main goal: ${goal.title}. Spend your first 10 minutes on the movement pattern behind it.`);
  }

  if (studyItem) {
    points.push(`Your highest-value review item is ${studyItem.title}. Use this next action: ${studyItem.action || "Do 20 slow shadow reps and revisit it before class."}`);
  }

  if (session?.lessons) {
    points.push(`Use your latest live-round problem as the theme: ${session.lessons}. Keep reps slow and technical until the sequence feels clean.`);
  }

  if (session?.position && session?.problemTag) {
    points.push(`Build a micro-session around ${session.position} and ${session.problemTag.toLowerCase()} so your solo work mirrors what is really happening on the mat.`);
  }

  if (technique) {
    points.push(`Touch one known strength too: ${technique.name}. Cue: ${technique.detail || "prioritize timing and connection before speed."}`);
  }

  if (smartDrills.length) {
    points.push(`Solo block: ${smartDrills.join(", ")}.`);
  }

  if (points.length < 4) {
    points.push("Finish with 5 minutes of movement quality: technical standups, bridges, hip escapes, sit-outs, and level changes.");
  }

  return points.slice(0, 5);
}

function buildGamePlan() {
  const items = [];
  const latestSession = state.sessions[0];
  const primaryGoal = state.goals[0];
  const openStudy = state.studyItems.find((item) => !item.done);

  if (state.profile.game) {
    items.push(`A-game identity: ${state.profile.game}`);
  }

  if (state.profile.focus) {
    items.push(`Current focus: ${state.profile.focus}`);
  }

  if (state.profile.workingOn) {
    items.push(`Working on now: ${state.profile.workingOn}`);
  }

  const topBranches = BRANCH_TYPES.flatMap(({ key, label }) =>
    (state.profile.branches?.[key] || []).slice(0, 2).map((item) => `${label}: ${item}`)
  );

  if (topBranches.length) {
    items.push(`Best move-to options: ${topBranches.slice(0, 4).join(" • ")}`);
  }

  if (primaryGoal) {
    items.push(`Primary training goal: ${primaryGoal.title}`);
  }

  if (latestSession?.wins) {
    items.push(`What to keep building: ${latestSession.wins}`);
  }

  if (latestSession?.lessons) {
    items.push(`Most urgent leak to patch: ${latestSession.lessons}`);
  }

  if (openStudy) {
    items.push(`Next study assignment: ${openStudy.title}`);
  }

  return items.slice(0, 6);
}

function fillSessionForm(session) {
  sessionIdInput.value = session.id;
  document.querySelector("#session-date").value = session.date;
  document.querySelector("#session-type").value = session.type;
  document.querySelector("#session-duration").value = String(session.duration);
  document.querySelector("#session-intensity").value = session.intensity || "Moderate";
  document.querySelector("#session-energy").value = session.energy;
  document.querySelector("#session-position").value = session.position;
  document.querySelector("#session-problem-tag").value = session.problemTag;
  document.querySelector("#session-rounds").value = String(session.rounds || 0);
  document.querySelector("#session-roll-quality").value = session.rollQuality;
  document.querySelector("#session-partner").value = session.partner || "";
  document.querySelector("#session-techniques").value = session.techniques.join(", ");
  document.querySelector("#session-wins").value = session.wins || "";
  document.querySelector("#session-lessons").value = session.lessons || "";
  document.querySelector("#session-study-target").value = session.studyTarget || "";
  document.querySelector("#session-home-idea").value = session.homeIdea || "";
  sessionSubmit.textContent = "Update session";
  sessionCancel.hidden = false;
}

function resetSessionForm() {
  sessionForm.reset();
  sessionIdInput.value = "";
  document.querySelector("#session-date").value = todayString();
  document.querySelector("#session-duration").value = "75";
  document.querySelector("#session-rounds").value = "5";
  document.querySelector("#session-intensity").value = "Moderate";
  document.querySelector("#session-energy").value = "Medium";
  document.querySelector("#session-roll-quality").value = "Mixed";
  sessionSubmit.textContent = "Save session";
  sessionCancel.hidden = true;
}

function hydrateProfileForm() {
  document.querySelector("#profile-name").value = state.profile.name || "";
  document.querySelector("#profile-belt").value = state.profile.belt || "White";
  document.querySelector("#profile-academy").value = state.profile.academy || "";
  document.querySelector("#profile-game").value = state.profile.game || "";
  document.querySelector("#profile-focus").value = state.profile.focus || "";
  document.querySelector("#profile-working-on").value = state.profile.workingOn || "";
  const branches = normalizeBranches(state.profile.branches);
  document.querySelector("#profile-primary-branches").value = branches.primary.join(", ");
  document.querySelector("#profile-secondary-branches").value = branches.secondary.join(", ");
  document.querySelector("#profile-fallback-branches").value = branches.fallback.join(", ");
  document.querySelector("#profile-escape-branches").value = branches.escape.join(", ");
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `roll-journal-${todayString()}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function importData(event) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(String(reader.result));
      const merged = normalizeState(imported);
      state.profile = merged.profile;
      state.sessions = merged.sessions;
      state.goals = merged.goals;
      state.techniques = merged.techniques;
      state.studyItems = merged.studyItems;
      hydrateProfileForm();
      persistAndRender();
      resetSessionForm();
    } catch {
      window.alert("That file could not be imported. Please choose a Roll Journal export.");
    } finally {
      event.target.value = "";
    }
  };
  reader.readAsText(file);
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeState(saved);
  } catch {
    return freshState();
  }
}

function persistAndRender() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  render();
}

function normalizeState(value) {
  const incoming = value && typeof value === "object" ? value : {};
  const incomingProfile = incoming.profile || {};

  return {
    profile: {
      ...defaultState.profile,
      ...incomingProfile,
      branches: normalizeBranches(incomingProfile.branches, incomingProfile.nextMoves)
    },
    sessions: Array.isArray(incoming.sessions)
      ? incoming.sessions
          .map(normalizeSession)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
      : [],
    goals: Array.isArray(incoming.goals) ? incoming.goals : [],
    techniques: Array.isArray(incoming.techniques) ? incoming.techniques : [],
    studyItems: Array.isArray(incoming.studyItems) ? incoming.studyItems.map(normalizeStudyItem) : []
  };
}

function normalizeSession(session) {
  return {
    id: session.id || makeId(),
    date: session.date || todayString(),
    type: session.type || "Class",
    duration: Number(session.duration) || 0,
    intensity: session.intensity || "Moderate",
    energy: session.energy || "Medium",
    techniques: Array.isArray(session.techniques) ? session.techniques : splitItems(session.techniques || ""),
    position: session.position || "Guard",
    problemTag: session.problemTag || "Guard retention",
    rounds: Number(session.rounds) || 0,
    rollQuality: session.rollQuality || "Mixed",
    partner: session.partner || "",
    wins: session.wins || "",
    lessons: session.lessons || "",
    studyTarget: session.studyTarget || "",
    homeIdea: session.homeIdea || ""
  };
}

function normalizeStudyItem(item) {
  return {
    id: item.id || makeId(),
    title: item.title || "Study item",
    source: item.source || "Session review",
    action: item.action || "",
    done: Boolean(item.done),
    createdAt: item.createdAt || new Date().toISOString()
  };
}

function freshState() {
  return {
    profile: {
      ...defaultState.profile,
      branches: freshBranches()
    },
    sessions: [],
    goals: [],
    techniques: [],
    studyItems: []
  };
}

function freshBranches() {
  return {
    primary: [],
    secondary: [],
    fallback: [],
    escape: []
  };
}

function normalizeBranches(branches, legacyNextMoves = []) {
  const base = freshBranches();
  const source = branches && typeof branches === "object" ? branches : {};
  const legacy = Array.isArray(legacyNextMoves) ? legacyNextMoves : splitItems(legacyNextMoves || "");

  return {
    primary: uniqueItems(Array.isArray(source.primary) ? source.primary : []),
    secondary: uniqueItems(Array.isArray(source.secondary) ? source.secondary : []),
    fallback: uniqueItems(Array.isArray(source.fallback) ? source.fallback : []),
    escape: uniqueItems(
      Array.isArray(source.escape)
        ? source.escape
        : source.escapeRoute && Array.isArray(source.escapeRoute)
          ? source.escapeRoute
          : legacy
    )
  };
}

function renderBranchGroup(key, label, items) {
  if (!items.length) {
    return "";
  }

  return `
    <section class="branch-group">
      <h3>${escapeHtml(label)}</h3>
      <div class="branch-group__list">
        ${items.map((move) => `
          <button class="path-branch" type="button" data-branch-type="${escapeHtml(key)}" data-move="${escapeHtml(move)}">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(move)}</strong>
          </button>
        `).join("")}
      </div>
    </section>
  `;
}

function getSmartDrills(session) {
  const key = `${session.position}|${session.problemTag}`;
  const preset = DRILL_LIBRARY[key];

  if (preset) {
    return preset;
  }

  return [
    "3 x 1 minute shrimping and bridges",
    "3 x 30 seconds technical standups",
    session.homeIdea || `2 x 10 slow shadow reps for ${session.studyTarget || "your main movement pattern"}`
  ];
}

function buildRecentDayCounts(sessions, length) {
  const countsByDay = new Map();

  sessions.forEach((session) => {
    countsByDay.set(session.date, (countsByDay.get(session.date) || 0) + 1);
  });

  return Array.from({ length }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (length - index - 1));
    const key = localDateKey(date);
    return {
      label: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: countsByDay.get(key) || 0
    };
  });
}

function calculateStreak(sessions) {
  if (!sessions.length) {
    return 0;
  }

  const uniqueDays = [...new Set(sessions.map((session) => session.date))].sort((a, b) => new Date(b) - new Date(a));
  let streak = 0;
  let cursor = startOfDay(new Date());

  if (uniqueDays[0] !== localDateKey(cursor)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  for (const day of uniqueDays) {
    const expected = localDateKey(cursor);

    if (day !== expected) {
      break;
    }

    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function countValues(values) {
  return values.reduce((map, value) => {
    map.set(value, (map.get(value) || 0) + 1);
    return map;
  }, new Map());
}

function topLabel(map, fallback) {
  return [...map.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || fallback;
}

function formatHours(totalMinutes) {
  return (totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1);
}

function formatStreak(days) {
  return `${days} day${days === 1 ? "" : "s"}`;
}

function splitItems(value) {
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function uniqueItems(items) {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

function assert(results, condition, message) {
  results.push({ pass: Boolean(condition), message });
}

function focusChip(label, value) {
  return `<div class="focus-chip"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function makeTag(label) {
  return `<span class="tag">${escapeHtml(label)}</span>`;
}

function formatDate(value) {
  return new Date(`${value}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

function todayString() {
  return localDateKey(new Date());
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function titleCase(value) {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
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
