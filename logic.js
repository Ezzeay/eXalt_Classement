function sanitizeParticipants(raw) {
    return String(raw || "")
        .split(/[,\n]/)
        .map((name) => name.trim())
        .filter(Boolean);
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function normalizeTeam(entry) {
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
}

function normalizeHistory(entry) {
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
}

function sortTeams(teams) {
    return [...teams].sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
}

const ExaltLogic = {
    sanitizeParticipants,
    escapeHtml,
    normalizeTeam,
    normalizeHistory,
    sortTeams,
};

if (typeof module !== "undefined" && module.exports) {
    module.exports = ExaltLogic;
}

globalThis.ExaltLogic = ExaltLogic;
