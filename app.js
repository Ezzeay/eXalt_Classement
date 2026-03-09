const ADMIN_CREDENTIALS = [
    { username: "exalt_2025", password: "exalt_2025" },
    { username: "eXalt_2025", password: "eXalt_2025" },
];

const STORAGE_KEYS = {
    auth: "eXalt_auth",
    role: "eXalt_role",
    teams: "eXalt_teams",
    history: "eXalt_history",
};

const ROLES = {
    admin: "admin",
    guest: "guest",
};

const UI = {
    maxHistory: 200,
    toastDurationMs: 2200,
};

const localLogicFallback = {
    sanitizeParticipants(raw) {
        return String(raw || "")
            .split(/[,\n]/)
            .map((name) => name.trim())
            .filter(Boolean);
    },
    escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    },
    normalizeTeam(entry) {
        if (!entry || typeof entry !== "object") {
            return null;
        }

        const name = typeof entry.name === "string" ? entry.name.trim() : "";
        if (!name) {
            return null;
        }

        const points = Number(entry.points);
        const participants = Array.isArray(entry.participants)
            ? entry.participants
                .filter((participant) => typeof participant === "string")
                .map((participant) => participant.trim())
                .filter(Boolean)
            : [];

        return {
            id: typeof entry.id === "string" && entry.id ? entry.id : "generated-id",
            name,
            participants,
            points: Number.isFinite(points) ? points : 0,
        };
    },
    normalizeHistory(entry) {
        if (!entry || typeof entry !== "object") {
            return null;
        }

        const message = typeof entry.message === "string" ? entry.message.trim() : "";
        if (!message) {
            return null;
        }

        return {
            id: typeof entry.id === "string" && entry.id ? entry.id : "generated-id",
            message,
            createdAt: typeof entry.createdAt === "string" && entry.createdAt ? entry.createdAt : new Date().toISOString(),
        };
    },
    sortTeams(teams) {
        return [...teams].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
    },
};

const Logic = globalThis.ExaltLogic || localLogicFallback;
const logicSanitizeParticipants = Logic.sanitizeParticipants;
const logicEscapeHtml = Logic.escapeHtml;
const logicNormalizeTeam = Logic.normalizeTeam;
const logicNormalizeHistory = Logic.normalizeHistory;
const logicSortTeams = Logic.sortTeams;

const loginScreen = document.getElementById("login-screen");
const mainApp = document.getElementById("main-app");
const loginForm = document.getElementById("login-form");
const guestLoginBtn = document.getElementById("guest-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const resetDataBtn = document.getElementById("reset-data-btn");
const createTeamForm = document.getElementById("create-team-form");
const teamManagement = document.getElementById("team-management");
const teamsList = document.getElementById("teams-list");
const rankingBody = document.getElementById("ranking-body");
const historyLog = document.getElementById("history-log");
const podium = document.getElementById("podium");
const currentUser = document.getElementById("current-user");
const currentRoleEl = document.getElementById("current-role");

const metricTeams = document.getElementById("metric-teams");
const metricParticipants = document.getElementById("metric-participants");
const metricPoints = document.getElementById("metric-points");

const loginLogo = document.getElementById("login-logo");
const headerLogo = document.getElementById("header-logo");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const teamNameInput = document.getElementById("team-name");
const teamParticipantsInput = document.getElementById("team-participants");

function safeParseArray(storageKey) {
    try {
        const parsed = JSON.parse(localStorage.getItem(storageKey) || "[]");
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

let teams = safeParseArray(STORAGE_KEYS.teams)
    .map((entry) => logicNormalizeTeam(entry))
    .filter(Boolean)
    .map((team) => ({ ...team, id: team.id === "generated-id" ? crypto.randomUUID() : team.id }));

let history = safeParseArray(STORAGE_KEYS.history)
    .map((entry) => logicNormalizeHistory(entry))
    .filter(Boolean)
    .map((entry) => ({ ...entry, id: entry.id === "generated-id" ? crypto.randomUUID() : entry.id }))
    .slice(0, UI.maxHistory);

function getSessionRole() {
    return localStorage.getItem(STORAGE_KEYS.role) || ROLES.admin;
}

function isGuestMode() {
    return getSessionRole() === ROLES.guest;
}

function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEYS.auth) === "1";
}

function canManageData() {
    return !isGuestMode();
}

function setSession(role) {
    localStorage.setItem(STORAGE_KEYS.auth, "1");
    localStorage.setItem(STORAGE_KEYS.role, role);
}

function isAdminCredentialsValid(username, password) {
    const normalizedUsername = String(username || "").trim().toLowerCase();
    const normalizedPassword = String(password || "").trim().toLowerCase();

    return ADMIN_CREDENTIALS.some((creds) => {
        return creds.username.toLowerCase() === normalizedUsername && creds.password.toLowerCase() === normalizedPassword;
    });
}

function clearSession() {
    localStorage.removeItem(STORAGE_KEYS.auth);
    localStorage.removeItem(STORAGE_KEYS.role);
}

function persistState() {
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
}

function showToast(message, isError = false) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    if (isError) {
        toast.style.background = "#dc3545";
    }

    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), UI.toastDurationMs);
}

function formatDateTime(isoDate) {
    const dt = new Date(isoDate);
    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(dt);
}

function addHistoryEntry(message) {
    history.unshift({
        id: crypto.randomUUID(),
        message,
        createdAt: new Date().toISOString(),
    });

    if (history.length > UI.maxHistory) {
        history = history.slice(0, UI.maxHistory);
    }
}

function participantsAsChips(participants) {
    if (!participants.length) {
        return '<span class="participant-chip">Aucun participant</span>';
    }

    return participants.map((name) => `<span class="participant-chip">${logicEscapeHtml(name)}</span>`).join("");
}

function sortedTeams() {
    return logicSortTeams(teams);
}

function getRankBadgeClass(index) {
    if (index === 0) {
        return "rank-badge top1";
    }
    if (index === 1) {
        return "rank-badge top2";
    }
    if (index === 2) {
        return "rank-badge top3";
    }
    return "rank-badge";
}

function updateAuthUI() {
    const loggedIn = isAuthenticated();
    loginScreen.classList.toggle("app-hidden", loggedIn);
    mainApp.classList.toggle("app-hidden", !loggedIn);

    if (!loggedIn) {
        return;
    }

    if (isGuestMode()) {
        currentUser.textContent = "invité";
        currentRoleEl.textContent = "Lecture seule";
        teamManagement.classList.add("app-hidden");
        resetDataBtn.classList.add("app-hidden");
        return;
    }

    currentUser.textContent = ADMIN_CREDENTIALS[0].username;
    currentRoleEl.textContent = "Admin";
    teamManagement.classList.remove("app-hidden");
    resetDataBtn.classList.remove("app-hidden");
}

function renderMetrics() {
    const participantsCount = teams.reduce((sum, team) => sum + team.participants.length, 0);
    const pointsCount = teams.reduce((sum, team) => sum + team.points, 0);

    metricTeams.textContent = String(teams.length);
    metricParticipants.textContent = String(participantsCount);
    metricPoints.textContent = String(pointsCount);
}

function renderTeams() {
    teamsList.innerHTML = "";

    if (!teams.length) {
        teamsList.innerHTML = '<p class="empty-state">Aucune équipe pour le moment.</p>';
        return;
    }

    teams.forEach((team) => {
        const wrapper = document.createElement("div");
        wrapper.className = "team-item card";

        wrapper.innerHTML = `
            <div class="team-item-head">
                <strong>${logicEscapeHtml(team.name)}</strong>
                <span class="circle-chip"><span class="ci">🏆</span><span class="cn">${team.points} pts</span></span>
            </div>
            <div class="participants-wrap">${participantsAsChips(team.participants)}</div>
            <form class="inline-points-form" data-team-id="${team.id}">
                <input type="number" name="points" placeholder="Ajouter / retirer des points" required>
                <button class="confirm-btn" type="submit">Valider</button>
                <button class="cancel-btn js-delete" type="button">Supprimer</button>
            </form>
        `;

        teamsList.appendChild(wrapper);
    });
}

function renderRanking() {
    rankingBody.innerHTML = "";

    const ordered = sortedTeams();
    if (!ordered.length) {
        rankingBody.innerHTML = '<tr><td colspan="4" class="empty-state">Aucun classement disponible.</td></tr>';
        return;
    }

    ordered.forEach((team, index) => {
        const row = document.createElement("tr");
        const badgeClass = getRankBadgeClass(index);

        row.innerHTML = `
            <td><span class="${badgeClass}">${index + 1}</span></td>
            <td>${logicEscapeHtml(team.name)}</td>
            <td class="ranking-participants">${participantsAsChips(team.participants)}</td>
            <td><strong>${team.points}</strong></td>
        `;

        rankingBody.appendChild(row);
    });
}

function renderPodium() {
    podium.innerHTML = "";
    const ordered = sortedTeams().slice(0, 3);

    if (!ordered.length) {
        podium.innerHTML = '<p class="empty-state">Aucun podium pour le moment.</p>';
        return;
    }

    const podiumOrder = [ordered[1], ordered[0], ordered[2]].filter(Boolean);
    podiumOrder.forEach((team) => {
        const rank = ordered.findIndex((entry) => entry.id === team.id) + 1;
        const card = document.createElement("article");
        card.className = `podium-card place-${rank}`;
        card.innerHTML = `
            <div class="podium-rank">#${rank}</div>
            <strong>${logicEscapeHtml(team.name)}</strong>
            <small>${team.points} pts</small>
        `;
        podium.appendChild(card);
    });
}

function renderHistory() {
    historyLog.innerHTML = "";

    if (!history.length) {
        historyLog.innerHTML = '<p class="empty-state">Aucune action enregistrée.</p>';
        return;
    }

    const fragment = document.createDocumentFragment();
    history.forEach((entry) => {
        const item = document.createElement("div");
        item.className = "history-item";
        item.innerHTML = `
            <p>${logicEscapeHtml(entry.message)}</p>
            <small>${formatDateTime(entry.createdAt)}</small>
        `;
        fragment.appendChild(item);
    });

    historyLog.appendChild(fragment);
}

function refreshUI() {
    renderMetrics();
    renderTeams();
    renderRanking();
    renderPodium();
    renderHistory();
    persistState();
}

function handleCreateTeam(event) {
    event.preventDefault();

    if (!canManageData()) {
        showToast("Mode invité: modification non autorisée.", true);
        return;
    }

    const name = teamNameInput.value.trim();
    if (!name) {
        showToast("Le nom de l'équipe est requis.", true);
        return;
    }

    const alreadyExists = teams.some((team) => team.name.toLowerCase() === name.toLowerCase());
    if (alreadyExists) {
        showToast("Cette équipe existe déjà.", true);
        return;
    }

    teams.push({
        id: crypto.randomUUID(),
        name,
        participants: logicSanitizeParticipants(teamParticipantsInput.value),
        points: 0,
    });

    addHistoryEntry(`Équipe créée: ${name}`);
    createTeamForm.reset();
    refreshUI();
    showToast("Équipe ajoutée ✅");
}

function handleTeamActions(event) {
    if (!canManageData()) {
        if (event.type === "submit" || event.target.closest(".js-delete")) {
            event.preventDefault();
            showToast("Mode invité: modification non autorisée.", true);
        }
        return;
    }

    const pointsForm = event.target.closest(".inline-points-form");
    if (pointsForm && event.type === "submit") {
        event.preventDefault();

        const pointsValue = Number(pointsForm.points.value);
        if (Number.isNaN(pointsValue) || pointsValue === 0) {
            showToast("Entre une valeur de points valide.", true);
            return;
        }

        const team = teams.find((entry) => entry.id === pointsForm.dataset.teamId);
        if (!team) {
            return;
        }

        team.points += pointsValue;
        addHistoryEntry(`${team.name}: ${pointsValue > 0 ? "+" : ""}${pointsValue} pts (manuel)`);
        refreshUI();
        showToast("Points mis à jour ✅");
        return;
    }

    const deleteBtn = event.target.closest(".js-delete");
    if (!deleteBtn || event.type !== "click") {
        return;
    }

    const parentForm = deleteBtn.closest(".inline-points-form");
    if (!parentForm) {
        return;
    }

    const deletedTeam = teams.find((team) => team.id === parentForm.dataset.teamId);
    teams = teams.filter((team) => team.id !== parentForm.dataset.teamId);

    if (deletedTeam) {
        addHistoryEntry(`Équipe supprimée: ${deletedTeam.name}`);
    }

    refreshUI();
    showToast("Équipe supprimée");
}

function handleResetData() {
    if (!canManageData()) {
        showToast("Mode invité: modification non autorisée.", true);
        return;
    }

    const shouldReset = globalThis.confirm("Réinitialiser toutes les équipes et l'historique ?");
    if (!shouldReset) {
        return;
    }

    teams = [];
    history = [];
    addHistoryEntry("Données réinitialisées par l'admin");
    createTeamForm.reset();
    refreshUI();
    showToast("Données réinitialisées ✅");
}

function wireSafeImageFallback(imgElement) {
    imgElement.addEventListener("error", () => {
        imgElement.style.display = "none";
    });
}

function handleAdminLogin(event) {
    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (isAdminCredentialsValid(username, password)) {
        setSession(ROLES.admin);
        updateAuthUI();
        refreshUI();
        showToast("Connexion réussie 🚀");
        return;
    }

    showToast("Identifiants incorrects.", true);
}

function handleGuestLogin() {
    setSession(ROLES.guest);
    updateAuthUI();
    refreshUI();
    showToast("Connecté en invité 👀");
}

function handleLogout() {
    clearSession();
    updateAuthUI();
    loginForm.reset();
}

loginForm.addEventListener("submit", handleAdminLogin);
guestLoginBtn.addEventListener("click", handleGuestLogin);
logoutBtn.addEventListener("click", handleLogout);
createTeamForm.addEventListener("submit", handleCreateTeam);
teamsList.addEventListener("submit", handleTeamActions);
teamsList.addEventListener("click", handleTeamActions);
resetDataBtn.addEventListener("click", handleResetData);

wireSafeImageFallback(loginLogo);
wireSafeImageFallback(headerLogo);
updateAuthUI();
refreshUI();
refreshUI();
