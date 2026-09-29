const TOTAL_GAME_MINUTES = 240;
const REQUIRED_POSITIONS = ["PG", "SG", "SF", "PF", "C"];
let players = [];
let teams = [];
let selectedUserTeamId = null;
let selectedOpponentTeamId = null;
let matchLocked = false;
let previewValid = false;
let previewBusy = false;

const $ = id => document.getElementById(id);

async function api(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.message || "Erreur serveur.");
    return data;
}

function getTotalMinutes() {
    return players.reduce((total, p) => total + Number(p.minutes || 0), 0);
}

function getEligiblePositions(player) {
    return String(player.position || "")
        .split("/")
        .map(p => p.trim().toUpperCase())
        .filter(Boolean);
}

function positionCoverage(playersList) {
    const result = {};
    for (const pos of REQUIRED_POSITIONS) result[pos] = false;

    function search(index, used) {
        if (index === REQUIRED_POSITIONS.length) return true;
        const pos = REQUIRED_POSITIONS[index];
        for (let i = 0; i < playersList.length; i++) {
            if (used.has(i)) continue;
            if (!getEligiblePositions(playersList[i]).includes(pos)) continue;
            used.add(i);
            if (search(index + 1, used)) return true;
            used.delete(i);
        }
        return false;
    }
    const ok = search(0, new Set());
    return ok;
}

function getStarterPositionCoverage() {
    return positionCoverage(players.filter(p => p.starter));
}

function renderTeamSelectors() {
    const user = $("userTeamSelect");
    const opponent = $("opponentTeamSelect");
    user.innerHTML = "";
    opponent.innerHTML = "";

    teams.forEach(team => {
        const label = team.playable
            ? `${team.name} (${team.player_count} joueurs)`
            : `${team.name} — effectif incomplet (${team.player_count} joueurs)`;
        const a = new Option(label, team.id);
        const b = new Option(label, team.id);
        a.disabled = !team.playable;
        b.disabled = !team.playable;
        user.add(a);
        opponent.add(b);
    });

    const playable = teams.filter(t => t.playable);
    if (playable.length) user.value = playable[0].id;
    if (playable.length > 1) opponent.value = playable[1].id;
    selectedUserTeamId = user.value || null;
    selectedOpponentTeamId = opponent.value || null;
}

function updateHeader() {
    const user = teams.find(t => t.id === selectedUserTeamId);
    const opp = teams.find(t => t.id === selectedOpponentTeamId);
    const userName = user?.name || "—";
    const oppName = opp?.name || "—";
    $("teamTitle").textContent = userName;
    $("homeHeader").textContent = userName;
    $("awayHeader").textContent = oppName;
    $("footerTeam").textContent = userName;
    $("footerOpponent").textContent = `Adversaire : ${oppName}`;
    $("rosterTitle").textContent = `Effectif — ${userName}`;
}

function showAvailability(message, error = false) {
    const box = $("teamAvailability");
    box.textContent = message;
    box.classList.remove("hidden", "error", "success");
    box.classList.add(error ? "error" : "success");
}

function renderRotationList() {
    const target = $("rotationList");
    target.innerHTML = "";

    players.forEach(player => {
        const row = document.createElement("div");
        row.className = `rotation-player-row ${Number(player.minutes) === 0 ? "inactive-player" : ""}`;

        const starter = document.createElement("input");
        starter.type = "checkbox";
        starter.className = "starter-checkbox";
        starter.checked = !!player.starter;
        starter.title = "Titulaire";
        starter.addEventListener("change", () => {
            const current = players.filter(p => p.starter).length;
            if (!starter.checked) {
                player.starter = false;
            } else if (current < 5) {
                player.starter = true;
                if (Number(player.minutes) === 0) player.minutes = 30;
            } else {
                starter.checked = false;
                return;
            }
            previewValid = false;
            renderRotationList();
            updateTotal();
            refreshPregameTimeline();
        });

        const info = document.createElement("div");
        const completeness = player.rating_complete ? "" : " · profil ratings partiel";
        info.innerHTML = `<div class="player-name">${player.name}</div><div class="player-meta">Ext ${player.outside ?? "—"} · Int ${player.inside ?? "—"} · Ath ${player.athleticism ?? "—"} · Créa ${player.playmaking ?? "—"} · Déf ${player.defense ?? "—"} · Reb ${player.rebounding ?? "—"} · Sta ${player.stamina ?? "—"}${completeness}</div>`;

        const position = document.createElement("div");
        position.className = "position-pill";
        position.textContent = player.position;

        const profile = document.createElement("div");
        profile.className = "profile-pill";
        profile.textContent = `OVR ${player.overall}`;

        const naturalRole = document.createElement("div");
        naturalRole.className = "role-display";
        naturalRole.textContent = player.role;
        naturalRole.title = "Rôle naturel calculé automatiquement à partir des ratings disponibles.";

        const minutes = document.createElement("input");
        minutes.type = "number";
        minutes.min = "0";
        minutes.max = "48";
        minutes.step = "1";
        minutes.className = "minute-input";
        minutes.value = player.minutes;
        minutes.addEventListener("change", () => {
            let value = Number(minutes.value);
            if (!Number.isFinite(value)) value = 0;
            player.minutes = Math.max(0, Math.min(48, Math.round(value)));
            minutes.value = player.minutes;
            row.classList.toggle("inactive-player", player.minutes === 0);
            previewValid = false;
            updateTotal();
            refreshPregameTimeline();
        });

        row.append(starter, info, position, profile, naturalRole, minutes);
        target.appendChild(row);
    });
}

function updateCoverageDisplay() {
    const target = $("positionCoverage");
    if (!target) return;
    const active = players.filter(p => Number(p.minutes) > 0);
    let html = "";
    for (const pos of REQUIRED_POSITIONS) {
        const capacity = active.reduce((sum, p) => getEligiblePositions(p).includes(pos) ? sum + Number(p.minutes || 0) : sum, 0);
        const ok = capacity >= 48;
        html += `<div class="position-coverage-item ${ok ? "ok" : "bad"}"><div><strong>${pos}</strong><span>${capacity}/48 min</span></div><div class="position-coverage-bar"><span style="width:${Math.min(100, Math.max(0, capacity / 48 * 100))}%"></span></div></div>`;
    }
    target.innerHTML = html;
}

function setRotationStatus(message, type = "error") {
    const warning = $("rotationWarning");
    warning.classList.remove("hidden", "error", "success");
    warning.classList.add(type);
    warning.textContent = message;
}

function updateTotal() {
    const total = getTotalMinutes();
    const starterCount = players.filter(p => p.starter).length;
    const badge = $("minuteTotal");
    const button = $("launchButton");

    badge.textContent = `${total} / ${TOTAL_GAME_MINUTES} min`;
    badge.classList.remove("valid", "invalid");
    updateCoverageDisplay();

    button.disabled = true;

    if (!selectedUserTeamId || !selectedOpponentTeamId) {
        setRotationStatus("Choisis les deux équipes.");
        badge.classList.add("invalid");
        return;
    }
    if (starterCount !== 5) {
        setRotationStatus(`Il faut exactement 5 titulaires (${starterCount}/5).`);
        badge.classList.add("invalid");
        return;
    }
    if (!getStarterPositionCoverage()) {
        setRotationStatus("Le cinq majeur doit couvrir PG, SG, SF, PF et C.");
        badge.classList.add("invalid");
        return;
    }
    if (total !== TOTAL_GAME_MINUTES) {
        setRotationStatus(total < TOTAL_GAME_MINUTES ? `Il manque ${TOTAL_GAME_MINUTES - total} minutes.` : `Il y a ${total - TOTAL_GAME_MINUTES} minutes en trop.`);
        badge.classList.add("invalid");
        return;
    }
    if (previewBusy) {
        setRotationStatus("Validation de la rotation en cours…", "success");
        badge.classList.add("valid");
        return;
    }
    if (!previewValid) {
        setRotationStatus("Rotation chiffrée valide, mais la timeline réelle n'est pas encore validée. Actualise la projection.", "error");
        badge.classList.add("invalid");
        return;
    }

    setRotationStatus(`✅ 5 titulaires · 240 minutes · rotation réellement construite.`, "success");
    badge.classList.add("valid");
    button.disabled = matchLocked;
}

function chooseAutomaticStartersIfNeeded() {
    if (players.filter(p => p.starter).length === 5 && getStarterPositionCoverage()) return;

    const ordered = [...players].sort((a, b) => Number(b.overall) - Number(a.overall));
    let best = null;
    let bestScore = -Infinity;

    function search(index, chosen, used) {
        if (chosen.length === 5) {
            if (!positionCoverage(chosen)) return;
            const score = chosen.reduce((s, p) => s + Number(p.overall), 0);
            if (score > bestScore) {
                bestScore = score;
                best = chosen.slice();
            }
            return;
        }
        if (index >= ordered.length) return;
        for (let i = index; i < ordered.length; i++) {
            if (used.has(i)) continue;
            used.add(i);
            chosen.push(ordered[i]);
            search(i + 1, chosen, used);
            chosen.pop();
            used.delete(i);
        }
    }
    search(0, [], new Set());
    if (best) {
        const chosen = new Set(best);
        players.forEach(p => p.starter = chosen.has(p));
    }
}

function chooseAutoBench() {
    const starters = players.filter(p => p.starter);
    const bench = players.filter(p => !p.starter).sort((a, b) => Number(b.overall) - Number(a.overall));
    const selected = [];
    const uncovered = new Set(REQUIRED_POSITIONS);

    while (selected.length < 5 && uncovered.size > 0) {
        let best = null;
        let bestScore = -Infinity;
        for (const p of bench) {
            if (selected.includes(p)) continue;
            const cover = getEligiblePositions(p).filter(pos => uncovered.has(pos)).length;
            const score = cover * 1000 + Number(p.overall);
            if (score > bestScore) {
                best = p;
                bestScore = score;
            }
        }
        if (!best) break;
        selected.push(best);
        getEligiblePositions(best).forEach(pos => uncovered.delete(pos));
    }
    for (const p of bench) {
        if (selected.length >= 5) break;
        if (!selected.includes(p)) selected.push(p);
    }
    return selected;
}

async function applyAutomaticMinutes() {
    if (!players.length || previewBusy) return;
    chooseAutomaticStartersIfNeeded();
    const bench = chooseAutoBench();
    players.forEach(p => { p.minutes = 0; });
    players.filter(p => p.starter).forEach(p => { p.minutes = 30; });
    bench.forEach(p => { p.minutes = 18; });
    renderRotationList();
    previewValid = false;
    updateTotal();
    await refreshPregameTimeline();
}

function shortName(name) {
    const parts = name.split(" ");
    if (parts.length === 1) return parts[0];
    return parts.length > 2 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : `${parts[0][0]}. ${parts[1]}`;
}

function renderPregameTimeline(timeline) {
    const target = $("pregameTimeline");
    if (!timeline || !timeline.length) {
        target.innerHTML = `<div class="timeline-empty">Aucune projection disponible.</div>`;
        return;
    }
    const positions = REQUIRED_POSITIONS;
    let html = `<div class="pregame-legend"><span>Chaque colonne = 1 minute. Une colonne complète montre les 5 joueurs réellement prévus sur le terrain.</span></div>`;
    html += `<div class="pregame-grid-wrap"><div class="pregame-grid">`;
    html += `<div class="pregame-corner">POSTE</div>`;
    timeline.forEach(slot => {
        const cls = slot.minute_in_quarter === 1 ? " minute-start-quarter" : "";
        html += `<div class="pregame-minute-header${cls}" title="Quart ${slot.quarter}, minute ${slot.minute_in_quarter}">${slot.minute}</div>`;
    });
    positions.forEach(pos => {
        html += `<div class="pregame-position">${pos}</div>`;
        timeline.forEach(slot => {
            const player = slot.players.find(p => p.position === pos);
            html += `<div class="pregame-cell" title="${player ? player.name : "—"}">${player ? shortName(player.name) : "—"}</div>`;
        });
    });
    html += `</div></div>`;
    html += `<div class="pregame-quarter-labels"><span>Q1 · 1–12</span><span>Q2 · 13–24</span><span>Q3 · 25–36</span><span>Q4 · 37–48</span></div>`;
    target.innerHTML = html;
}

async function refreshPregameTimeline() {
    if (!selectedUserTeamId || !players.length) return;

    const basicValid = players.filter(p => p.starter).length === 5 &&
        getStarterPositionCoverage() &&
        getTotalMinutes() === TOTAL_GAME_MINUTES;

    if (!basicValid) {
        previewValid = false;
        $("pregameTimeline").innerHTML = `<div class="timeline-empty">La timeline sera générée quand les 5 titulaires, les postes et les 240 minutes seront valides.</div>`;
        updateTotal();
        return;
    }

    previewBusy = true;
    previewValid = false;
    updateTotal();
    $("pregameTimeline").innerHTML = `<div class="timeline-empty">Construction de la rotation exacte…</div>`;

    try {
        const data = await api("/api/rotation-preview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team_id: selectedUserTeamId, rotation: players })
        });
        renderPregameTimeline(data.timeline);
        previewValid = true;
    } catch (error) {
        $("pregameTimeline").innerHTML = `<div class="timeline-empty error-box">${error.message}</div>`;
    } finally {
        previewBusy = false;
        updateTotal();
    }
}

function renderRoster() {
    const body = $("rosterTable");
    body.innerHTML = players.map(p => `<tr><td><strong>${p.name}</strong></td><td>${p.position}</td><td><strong>${p.overall}</strong></td><td>${p.outside ?? "—"}</td><td>${p.inside ?? "—"}</td><td>${p.athleticism ?? "—"}</td><td>${p.playmaking ?? "—"}</td><td>${p.defense ?? "—"}</td><td>${p.rebounding ?? "—"}</td><td>${p.stamina ?? "—"}</td><td>${p.role}${p.rating_complete ? "" : "*"}</td></tr>`).join("");
}

function readTactics() {
    const ids = ["offenseStyle","tempo","threePointFocus","ballMovement","transitionOffense","pickAndRollFrequency","postUpFrequency","driveFrequency","primaryOption","shotSelection","offensiveRebound","defenseStyle","pressure","helpDefense","pickAndRollCoverage","defensivePriority","transitionDefense","defensiveRebound","foulAggression"];
    return Object.fromEntries(ids.map(id => [id, $(id).value]));
}

function playerStatsTable(team) {
    return `<div class="result-team-section"><h3>${team.name}</h3><div class="team-stats-grid"><div><span>PTS</span><strong>${team.stats.points}</strong></div><div><span>REB</span><strong>${team.stats.rebounds}</strong></div><div><span>AST</span><strong>${team.stats.assists}</strong></div><div><span>TOV</span><strong>${team.stats.turnovers}</strong></div><div><span>Fautes</span><strong>${team.stats.fouls}</strong></div><div><span>LF</span><strong>${team.stats.free_throws_made}/${team.stats.free_throws_attempted}</strong></div><div><span>FG%</span><strong>${team.stats.fg_pct}%</strong></div><div><span>3P%</span><strong>${team.stats.three_pct}%</strong></div></div><div class="result-table-wrap"><table class="result-table"><thead><tr><th>Joueur</th><th>Min</th><th>Pts</th><th>Reb</th><th>Ast</th><th>TOV</th><th>Fautes</th><th>LF</th><th>FG</th><th>3PT</th></tr></thead><tbody>${team.players.map(p => `<tr><td><strong>${p.name}</strong><small>${p.position} · OVR ${p.overall}</small></td><td>${p.minutes}</td><td>${p.points}</td><td>${p.rebounds}</td><td>${p.assists}</td><td>${p.turnovers}</td><td>${p.fouls}</td><td>${p.free_throws_made}/${p.free_throws_attempted}</td><td>${p.shots_made}/${p.shots_attempted}</td><td>${p.three_made}/${p.three_attempted}</td></tr>`).join("")}</tbody></table></div></div>`;
}

function renderTimeline(timeline, team1Name, team2Name) {
    const target = $("timelineContent");
    if (!timeline || !timeline.length) {
        target.innerHTML = `<div class="timeline-empty">Aucune donnée de rotation disponible.</div>`;
        return;
    }
    let html = `<div class="timeline-header"><div><strong>${team1Name}</strong><span>équipe gérée</span></div><div><strong>${team2Name}</strong><span>adversaire</span></div></div>`;
    let lastQuarter = 0;
    timeline.forEach(slot => {
        if (slot.quarter !== lastQuarter) {
            html += `<div class="quarter-divider">QUARTER ${slot.quarter}</div>`;
            lastQuarter = slot.quarter;
        }
        const home = slot.team1.map(p => `<span class="timeline-player"><b>${p.position}</b>${p.name}</span>`).join("");
        const away = slot.team2.map(p => `<span class="timeline-player"><b>${p.position}</b>${p.name}</span>`).join("");
        html += `<div class="timeline-row"><div class="timeline-minute"><strong>${slot.minute_in_quarter}</strong><small>${slot.clock_start}–${slot.clock_end}</small></div><div class="timeline-lineup">${home}</div><div class="timeline-lineup">${away}</div></div>`;
    });
    target.innerHTML = html;
}

async function loadRoster(teamId) {
    const data = await api(`/api/roster?team_id=${encodeURIComponent(teamId)}`);
    players = data.players;
    previewValid = false;
    renderRotationList();
    renderRoster();
    updateTotal();
    await refreshPregameTimeline();
}

async function onUserTeamChange() {
    selectedUserTeamId = $("userTeamSelect").value;
    if (selectedUserTeamId === selectedOpponentTeamId) {
        const alternative = teams.find(t => t.playable && t.id !== selectedUserTeamId);
        if (alternative) {
            selectedOpponentTeamId = alternative.id;
            $("opponentTeamSelect").value = alternative.id;
        }
    }
    updateHeader();
    const meta = teams.find(t => t.id === selectedUserTeamId);
    if (!meta?.playable) {
        players = [];
        previewValid = false;
        renderRotationList();
        renderRoster();
        $("pregameTimeline").innerHTML = `<div class="timeline-empty">Cet effectif n'est pas encore disponible dans la base locale.</div>`;
        showAvailability("Cet effectif n'est pas encore disponible dans la base locale.", true);
        updateTotal();
        return;
    }
    try {
        await loadRoster(selectedUserTeamId);
        showAvailability(`✅ Effectif chargé : ${players.length} joueurs.`, false);
    } catch (e) {
        showAvailability(e.message, true);
    }
}

function onOpponentChange() {
    selectedOpponentTeamId = $("opponentTeamSelect").value;
    if (selectedOpponentTeamId === selectedUserTeamId) {
        const alternative = teams.find(t => t.playable && t.id !== selectedUserTeamId);
        if (alternative) {
            selectedOpponentTeamId = alternative.id;
            $("opponentTeamSelect").value = alternative.id;
        }
    }
    updateHeader();
    updateTotal();
}

function lockControls() {
    document.querySelectorAll("input, select, .tab, button").forEach(el => {
        if (el.id !== "closeMatch") el.disabled = true;
    });
}
function unlockControls() {
    document.querySelectorAll("input, select, .tab, button").forEach(el => el.disabled = false);
    updateTotal();
}

document.querySelectorAll(".tab").forEach(tab => tab.addEventListener("click", () => {
    if (matchLocked) return;
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(panel => panel.classList.remove("active"));
    tab.classList.add("active");
    $(tab.dataset.tab).classList.add("active");
}));

$("autoMinutesButton").addEventListener("click", applyAutomaticMinutes);
$("refreshPreviewButton").addEventListener("click", refreshPregameTimeline);
$("userTeamSelect").addEventListener("change", onUserTeamChange);
$("opponentTeamSelect").addEventListener("change", onOpponentChange);

document.querySelectorAll(".result-tab").forEach(tab => tab.addEventListener("click", () => {
    document.querySelectorAll(".result-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".result-panel").forEach(p => p.classList.remove("active"));
    tab.classList.add("active");
    $(tab.dataset.resultTab).classList.add("active");
}));

$("launchButton").addEventListener("click", async () => {
    if (!previewValid || getTotalMinutes() !== TOTAL_GAME_MINUTES || players.filter(p => p.starter).length !== 5) return;
    matchLocked = true;
    $("launchButton").disabled = true;
    $("launchButton").textContent = "SIMULATION...";
    lockControls();
    try {
        const data = await api("/rotation", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                team1_id: selectedUserTeamId,
                team2_id: selectedOpponentTeamId,
                rotation1: players,
                tactics1: readTactics()
            })
        });
        const game = data.result;
        $("homeTeamName").textContent = game.team1.name.toUpperCase();
        $("homeScore").textContent = game.team1.score;
        $("awayTeamName").textContent = game.team2.name.toUpperCase();
        $("awayScore").textContent = game.team2.score;
        $("resultsContent").innerHTML = playerStatsTable(game.team1) + playerStatsTable(game.team2);
        renderTimeline(game.rotation_timeline, game.team1.name, game.team2.name);
        document.querySelectorAll(".result-tab").forEach(t => t.classList.remove("active"));
        document.querySelectorAll(".result-panel").forEach(p => p.classList.remove("active"));
        document.querySelector('.result-tab[data-result-tab="summaryResult"]').classList.add("active");
        $("summaryResult").classList.add("active");
        $("matchOverlay").classList.remove("hidden");
    } catch (error) {
        console.error(error);
        alert("Erreur pendant la simulation : " + error.message);
        matchLocked = false;
        unlockControls();
    } finally {
        $("launchButton").textContent = "▶ LANCER LE MATCH";
        updateTotal();
    }
});

$("closeMatch").addEventListener("click", () => {
    $("matchOverlay").classList.add("hidden");
    matchLocked = false;
    unlockControls();
    updateTotal();
});

(async function init() {
    try {
        const data = await api("/api/teams");
        teams = data.teams;
        renderTeamSelectors();
        updateHeader();
        if (selectedUserTeamId) {
            await loadRoster(selectedUserTeamId);
        }
        const playable = teams.filter(t => t.playable).length;
        const unavailable = teams.length - playable;
        showAvailability(
            unavailable
                ? `✅ ${playable}/30 équipes ont actuellement au moins 5 joueurs dans la base locale. ${unavailable} restent à importer.`
                : "✅ Les 30 effectifs sont disponibles."
        );
    } catch (e) {
        showAvailability(e.message, true);
    }
})();
