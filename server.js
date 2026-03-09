const express = require("express");
const path = require("node:path");
const fs = require("node:fs");
const { Low } = require("lowdb");
const { JSONFile } = require("lowdb/node");

const app = express();
const PORT = process.env.PORT || 3000;

const dataDir = path.join(__dirname, "data");
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "exalt_classement.json");
const adapter = new JSONFile(dbPath);
const db = new Low(adapter, { teams: [], history: [] });

app.use(express.json());
app.use(express.static(__dirname));

function uuid() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function initDb() {
    await db.read();
    db.data ||= { teams: [], history: [] };
    db.data.teams ||= [];
    db.data.history ||= [];
    await db.write();
}

function sortHistoryDesc(items) {
    return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function currentState() {
    return {
        teams: db.data.teams,
        history: sortHistoryDesc(db.data.history),
    };
}

async function insertHistory(message) {
    db.data.history.push({
        id: uuid(),
        message,
        createdAt: new Date().toISOString(),
    });

    db.data.history = sortHistoryDesc(db.data.history).slice(0, 200);
    await db.write();
}

app.get("/api/state", (_req, res) => {
    res.json(currentState());
});

app.post("/api/teams", async (req, res) => {
    const name = String(req.body?.name || "").trim();
    const participants = Array.isArray(req.body?.participants)
        ? req.body.participants.map((p) => String(p).trim()).filter(Boolean)
        : [];

    if (!name) {
        return res.status(400).json({ error: "Team name is required" });
    }

    const lowerName = name.toLowerCase();
    const existing = db.data.teams.find((team) => String(team.name).toLowerCase() === lowerName);
    if (existing) {
        return res.status(409).json({ error: "Team already exists" });
    }

    db.data.teams.push({
        id: uuid(),
        name,
        participants,
        points: 0,
    });

    await insertHistory(`Équipe créée: ${name}`);
    await db.write();
    return res.status(201).json({ ok: true });
});

app.patch("/api/teams/:id/points", async (req, res) => {
    const teamId = String(req.params.id || "").trim();
    const delta = Number(req.body?.delta);

    if (!teamId || Number.isNaN(delta) || delta === 0) {
        return res.status(400).json({ error: "Invalid team id or points delta" });
    }

    const team = db.data.teams.find((item) => item.id === teamId);
    if (!team) {
        return res.status(404).json({ error: "Team not found" });
    }

    team.points += delta;
    await insertHistory(`${team.name}: ${delta > 0 ? "+" : ""}${delta} pts (manuel)`);
    await db.write();
    return res.json({ ok: true });
});

app.delete("/api/teams/:id", async (req, res) => {
    const teamId = String(req.params.id || "").trim();
    const team = db.data.teams.find((item) => item.id === teamId);

    if (!team) {
        return res.status(404).json({ error: "Team not found" });
    }

    db.data.teams = db.data.teams.filter((item) => item.id !== teamId);
    await insertHistory(`Équipe supprimée: ${team.name}`);
    await db.write();
    return res.json({ ok: true });
});

app.post("/api/reset", async (_req, res) => {
    db.data.teams = [];
    db.data.history = [];
    await insertHistory("Données réinitialisées par l'admin");
    await db.write();
    res.json({ ok: true });
});

app.get("*", (_req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

async function startServer() {
    await initDb();
    app.listen(PORT, () => {
        console.log(`eXalt Classement server running on http://localhost:${PORT}`);
    });
}

startServer();
