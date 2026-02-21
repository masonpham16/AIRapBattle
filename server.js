import express from "express";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(cors());
app.use(express.json());

// In-memory sessions (fine for demo; use Redis/DB for real)
const sessions = new Map();

function id() {
  return crypto.randomBytes(12).toString("hex");
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function mockVerse(name, round) {
  const openers = [
    "Yo, listen up—",
    "Check the waveform—",
    "Hold my packet loss—",
    "I came in hot like a space heater in July—",
    "Reality check, no reboot—"
  ];
  const brag = [
    "I compile confidence with zero warnings.",
    "My metaphors got throughput like fiber optics.",
    "I’m the checksum—your bars don’t validate.",
    "I run laps around your logic like it's O(1).",
    "You’re a demo build—I'm the release candidate."
  ];
  const dunk = [
    "Your punchlines lag, mine stream in 4K.",
    "You rhyme like a CAPTCHA—painful and incorrect.",
    "Your flow's a 404: meaning not found.",
    "You talk big, but your verse is underfitted.",
    "You’re all hype—no signal."
  ];
  const closer = [
    "Round secured. Next.",
    "Mic drop—physics approves.",
    "That’s not a diss, it’s a refactor.",
    "Crowd goes brrr.",
    "Ship it."
  ];

  return `${pick(openers)}\n${name} in Round ${round}:\n- ${pick(brag)}\n- ${pick(dunk)}\n${pick(closer)}`;
}

/**
 * Later: replace mockVerse() with Join39 calls (or any agent runtime).
 * This server is the “safe place” to store keys + run agent logic.
 */

app.post("/api/start", (req, res) => {
  const { agentA, agentB } = req.body ?? {};
  const sessionId = id();

  sessions.set(sessionId, {
    agentA: { name: agentA?.name ?? "Agent A" },
    agentB: { name: agentB?.name ?? "Agent B" },
    votes: { 1: null, 2: null, 3: null }
  });

  res.json({ sessionId });
});

app.post("/api/round", (req, res) => {
  const { sessionId, round } = req.body ?? {};
  const s = sessions.get(sessionId);
  if (!s) return res.status(404).send("Unknown sessionId");
  if (![1,2,3].includes(round)) return res.status(400).send("round must be 1..3");

  // Generate verses (mock)
  const verseA = mockVerse(s.agentA.name, round);
  const verseB = mockVerse(s.agentB.name, round);

  res.json({ verseA, verseB });
});

app.post("/api/vote", (req, res) => {
  const { sessionId, round, winner } = req.body ?? {};
  const s = sessions.get(sessionId);
  if (!s) return res.status(404).send("Unknown sessionId");
  if (![1,2,3].includes(round)) return res.status(400).send("round must be 1..3");
  if (!["A","B"].includes(winner)) return res.status(400).send("winner must be A or B");

  if (s.votes[round]) return res.status(409).send("Already voted this round");
  s.votes[round] = winner;

  res.json({ ok: true });
});

app.post("/api/result", (req, res) => {
  const { sessionId } = req.body ?? {};
  const s = sessions.get(sessionId);
  if (!s) return res.status(404).send("Unknown sessionId");

  const votes = Object.values(s.votes);
  const scoreA = votes.filter(v => v === "A").length;
  const scoreB = votes.filter(v => v === "B").length;

  let winner = "TIE";
  if (scoreA > scoreB) winner = "A";
  else if (scoreB > scoreA) winner = "B";

  res.json({ scoreA, scoreB, winner });
});

app.get("/", (_, res) => res.send("Rap Battle API is alive."));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
