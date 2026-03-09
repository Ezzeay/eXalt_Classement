const {
    sanitizeParticipants,
    escapeHtml,
    normalizeTeam,
    normalizeHistory,
    sortTeams,
} = require("../logic.js");

describe("logic.sanitizeParticipants", () => {
    it("splits by comma and newline and trims entries", () => {
        const result = sanitizeParticipants(" Alice, Bob\n  Charlie  ,\n");
        expect(result).toEqual(["Alice", "Bob", "Charlie"]);
    });
});

describe("logic.escapeHtml", () => {
    it("escapes dangerous html chars", () => {
        expect(escapeHtml('<script>"x" & y</script>')).toBe("&lt;script&gt;&quot;x&quot; &amp; y&lt;/script&gt;");
    });
});

describe("logic.normalizeTeam", () => {
    it("normalizes a valid team object", () => {
        const team = normalizeTeam({
            id: "t1",
            name: " Team A ",
            participants: [" Alice ", "", 7, "Bob"],
            points: "12",
        });

        expect(team).toEqual({
            id: "t1",
            name: "Team A",
            participants: ["Alice", "Bob"],
            points: 12,
        });
    });

    it("returns null when team is invalid", () => {
        expect(normalizeTeam(null)).toBeNull();
        expect(normalizeTeam({ name: "   " })).toBeNull();
    });
});

describe("logic.normalizeHistory", () => {
    it("normalizes history with defaults", () => {
        const result = normalizeHistory({ message: "  Created  " });
        expect(result.message).toBe("Created");
        expect(result.id).toBe("generated-id");
        expect(typeof result.createdAt).toBe("string");
    });
});

describe("logic.sortTeams", () => {
    it("sorts by points desc then name asc", () => {
        const sorted = sortTeams([
            { name: "Zeta", points: 10 },
            { name: "Alpha", points: 10 },
            { name: "Beta", points: 12 },
        ]);

        expect(sorted.map((t) => t.name)).toEqual(["Beta", "Alpha", "Zeta"]);
    });
});
