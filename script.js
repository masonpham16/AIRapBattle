const $ = (id) => document.getElementById(id);

let state = {
  apiBase: "",
  sessionId: null,
  round: 1,
  scores: { A: 0, B: 0 },
  names: { A: "Agent A", B: "Agent B" },
  votedThisRound: false,
};

function setHidden(id, hidden) {
  const el = $(id);
  el.classList.toggle("hidden", hidden);
}

function normalizeBaseUrl(url) {
  return url.replace(/\/+$/, "");
}

function syncUI() {
  $("nameA").textContent = state.names.A;
  $("nameB").textContent = state.names.B;
  $("labelA").textContent = state.names.A;
  $("labelB").textContent = state.names.B;

  $("roundNum").textContent = String(state.round);
  $("scoreA").textContent = String(state.scores.A);
  $("scoreB").textContent = String(state.scores.B);

  $("voteA").disabled = state.votedThisRound;
  $("voteB").disabled = state.votedThisRound;
  $("nextBtn").disabled = !state.votedThisRound;
}

async function api(path, body) {
  const res = await fetch(`${state.apiBase}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function startBattle() {
  state.names.A = $("agentA").value.trim() || "Agent A";
  state.names.B = $("agentB").value.trim() || "Agent B";

  const base = $("apiBase").value.trim();
  if (!base) {
    alert("Please enter your backend API Base URL (e.g. https://your-app.onrender.com)");
    return;
  }
  state.apiBase = normalizeBaseUrl(base);

  state.round = 1;
  state.scores = { A: 0, B: 0 };
  state.votedThisRound = false;

  const data = await api("/api/start", {
    agentA: { name: state.names.A },
    agentB: { name: state.names.B },
  });

  state.sessionId = data.sessionId;

  setHidden("battle", false);
  setHidden("results", true);

  await loadRound();
}

async function loadRound() {
  state.votedThisRound = false;
  syncUI();

  $("verseA").textContent = "Loading…";
  $("verseB").textContent = "Loading…";

  const data = await api("/api/round", {
    sessionId: state.sessionId,
    round: state.round,
  });

  $("verseA").textContent = data.verseA;
  $("verseB").textContent = data.verseB;

  syncUI();
}

async function vote(winner) {
  if (state.votedThisRound) return;

  await api("/api/vote", {
    sessionId: state.sessionId,
    round: state.round,
    winner, // "A" or "B"
  });

  state.scores[winner] += 1;
  state.votedThisRound = true;
  syncUI();
}

async function nextRound() {
  if (!state.votedThisRound) return;

  if (state.round >= 3) {
    const result = await api("/api/result", { sessionId: state.sessionId });
    const { scoreA, scoreB, winner } = result;

    let text = `${state.names.A}: ${scoreA}  |  ${state.names.B}: ${scoreB}\n`;
    if (winner === "A") text += `🏆 Winner: ${state.names.A}`;
    else if (winner === "B") text += `🏆 Winner: ${state.names.B}`;
    else text += `🤝 It’s a tie. The crowd is confused but happy.`;

    $("finalText").textContent = text;
    setHidden("battle", true);
    setHidden("results", false);
    return;
  }

  state.round += 1;
  await loadRound();
}

function resetAll() {
  state = {
    apiBase: "",
    sessionId: null,
    round: 1,
    scores: { A: 0, B: 0 },
    names: { A: "Agent A", B: "Agent B" },
    votedThisRound: false,
  };
  $("agentA").value = "Agent A";
  $("agentB").value = "Agent B";
  $("apiBase").value = "";
  $("verseA").textContent = "—";
  $("verseB").textContent = "—";
  setHidden("battle", true);
  setHidden("results", true);
}

$("startBtn").addEventListener("click", () => startBattle().catch(e => alert(e.message)));
$("resetBtn").addEventListener("click", resetAll);
$("restartBtn").addEventListener("click", () => startBattle().catch(e => alert(e.message)));

$("voteA").addEventListener("click", () => vote("A").catch(e => alert(e.message)));
$("voteB").addEventListener("click", () => vote("B").catch(e => alert(e.message)));
$("nextBtn").addEventListener("click", () => nextRound().catch(e => alert(e.message)));

syncUI();
