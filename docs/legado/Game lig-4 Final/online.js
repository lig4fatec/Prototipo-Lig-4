(() => {

/* ==================================================
   FIREBASE COMPAT BRIDGE
   Permite que o jogo rode também quando o index.html é aberto
   diretamente (file://), sem depender de ES Modules.
================================================== */
const initializeApp = config => firebase.initializeApp(config);
const getDatabase = () => firebase.database();
const ref = (database, path) => database.ref(path);
const set = (databaseRef, value) => databaseRef.set(value);
const update = (databaseRef, value) => databaseRef.update(value);
const get = databaseRef => databaseRef.get();
const onValue = (databaseRef, callback) => {
    const handler = snapshot => callback(snapshot);
    databaseRef.on("value", handler);
    return () => databaseRef.off("value", handler);
};
const onDisconnect = databaseRef => databaseRef.onDisconnect();
const push = (databaseRef, value) => databaseRef.push(value);
const serverTimestamp = () => firebase.database.ServerValue.TIMESTAMP;

/* ==================================================
   FIREBASE - LIG 4 CHAOS ONLINE
================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyAPodTxHXaDPtrLM1UokItb1p0nkw52MJU",
    authDomain: "lig-4-chaos.firebaseapp.com",
    databaseURL: "https://lig-4-chaos-default-rtdb.firebaseio.com",
    projectId: "lig-4-chaos",
    storageBucket: "lig-4-chaos.firebasestorage.app",
    messagingSenderId: "462267723697",
    appId: "1:462267723697:web:082c9dfe617002ed0d5790",
    measurementId: "G-L3SN3K1L4Y"
};

let db = null;

function ensureFirebase() {
    if (db) return db;

    if (typeof firebase === "undefined" || !firebase.initializeApp || !firebase.database) {
        throw new Error("Firebase não foi carregado. Verifique sua conexão com a internet.");
    }

    const app = firebase.apps && firebase.apps.length
        ? firebase.app()
        : initializeApp(firebaseConfig);

    db = getDatabase(app);
    return db;
}

const onlineScreen = document.getElementById("online-screen");
const onlineWorkspace = document.getElementById("online-workspace");
const onlineMessage = document.getElementById("online-message");
const createRoomBtn = document.getElementById("create-room-btn");
const joinRoomBtn = document.getElementById("join-room-btn");
const onlineBackBtn = document.getElementById("online-back-btn");
const onlineOptions = document.querySelector(".online-options");

const clientIdKey = "lig4chaos_online_client";
let clientId = sessionStorage.getItem(clientIdKey);
if (!clientId) {
    clientId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(clientIdKey, clientId);
}

let role = null;
let roomCode = null;
let roomData = null;
let unsubscribeRoom = null;
let unsubscribeChat = null;
let countdownTimer = null;
let countdownOverlay = null;
let countdownStarted = null;
let leavingRoom = false;
let selectedOnlineColor = "blue";
let selectedOnlineMatches = 1;
let chatInput = null;
let chatList = null;

const colors = ["blue", "red", "purple", "green", "orange", "yellow", "brown"];

function setMessage(text, error = false) {
    if (!onlineMessage) return;
    onlineMessage.textContent = text || "";
    onlineMessage.style.color = error ? "#ff8b8b" : "#7fc3ff";
}

function roomRef() {
    return ref(db, `rooms/${roomCode}`);
}

function roomCodeIsValid(code) {
    return /^\d{6}$/.test(code);
}

function randomRoomCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
}

async function makeRoomCode() {
    ensureFirebase();
    for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomRoomCode();
        const snapshot = await get(ref(db, `rooms/${code}`));
        if (!snapshot.exists()) return code;
    }
    throw new Error("Não foi possível gerar um PIN livre.");
}

function hideBaseOptions() {
    if (onlineOptions) onlineOptions.style.display = "none";
    if (onlineBackBtn) onlineBackBtn.style.display = "none";
}

function showBaseOptions() {
    if (onlineOptions) onlineOptions.style.display = "flex";
    if (onlineBackBtn) onlineBackBtn.style.display = "inline-flex";
    if (onlineWorkspace) {
        onlineWorkspace.style.display = "none";
        onlineWorkspace.innerHTML = "";
    }
    setMessage("");
}

function renderWorkspace(html) {
    if (!onlineWorkspace) return;
    onlineWorkspace.innerHTML = html;
    onlineWorkspace.style.display = "block";
}

function colorButtons(current, disabledColor = null) {
    return colors.map(color => `
        <button type="button" class="online-color ${color} ${current === color ? "selected" : ""} ${disabledColor === color ? "disabled" : ""}" data-online-color="${color}" title="${color}"></button>
    `).join("");
}

function attachColorHandlers(root = onlineWorkspace) {
    root?.querySelectorAll("[data-online-color]").forEach(button => {
        button.addEventListener("click", () => {
            if (button.classList.contains("disabled")) return;
            selectedOnlineColor = button.dataset.onlineColor;
            root.querySelectorAll("[data-online-color]").forEach(item => item.classList.toggle("selected", item.dataset.onlineColor === selectedOnlineColor));
        });
    });
}

function attachMatchHandlers() {
    onlineWorkspace?.querySelectorAll("[data-online-matches]").forEach(button => {
        button.addEventListener("click", () => {
            selectedOnlineMatches = Number(button.dataset.onlineMatches);
            onlineWorkspace.querySelectorAll("[data-online-matches]").forEach(item => item.classList.toggle("selected", Number(item.dataset.onlineMatches) === selectedOnlineMatches));
        });
    });
}

function createForm() {
    selectedOnlineColor = "blue";
    selectedOnlineMatches = 1;
    hideBaseOptions();
    renderWorkspace(`
        <div class="online-panel">
            <div class="online-card">
                <h3>🏠 Criar sala</h3>
                <p>Você será o Jogador 1 e dono da sala. Só você poderá escolher o formato e iniciar a partida.</p>
                <div class="online-form">
                    <div class="online-label">SEU NOME</div>
                    <input id="online-create-name" class="online-input" maxlength="15" autocomplete="off" placeholder="Seu nome">
                    <div class="online-label">SUA COR</div>
                    <div class="online-color-grid">${colorButtons(selectedOnlineColor)}</div>
                    <div class="online-label">FORMATO DA SÉRIE</div>
                    <div class="online-match-grid">
                        <button class="online-match selected" data-online-matches="1">Melhor de 1</button>
                        <button class="online-match" data-online-matches="3">Melhor de 3</button>
                        <button class="online-match" data-online-matches="5">Melhor de 5</button>
                    </div>
                    <div class="online-actions">
                        <button id="online-create-confirm" class="online-primary">CRIAR SALA</button>
                        <button id="online-create-cancel" class="online-secondary">VOLTAR</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    attachColorHandlers();
    attachMatchHandlers();
    document.getElementById("online-create-confirm")?.addEventListener("click", createRoom);
    document.getElementById("online-create-cancel")?.addEventListener("click", showBaseOptions);
}

function joinForm() {
    selectedOnlineColor = "red";
    hideBaseOptions();
    renderWorkspace(`
        <div class="online-panel">
            <div class="online-card">
                <h3>🚪 Entrar em uma sala</h3>
                <p>Digite o PIN que o outro jogador enviou para você.</p>
                <div class="online-form">
                    <div class="online-label">PIN DA SALA</div>
                    <input id="online-join-pin" class="online-input online-pin-input" maxlength="6" inputmode="numeric" autocomplete="off" placeholder="000000">
                    <div class="online-label">SEU NOME</div>
                    <input id="online-join-name" class="online-input" maxlength="15" autocomplete="off" placeholder="Seu nome">
                    <div class="online-label">SUA COR</div>
                    <div class="online-color-grid">${colorButtons(selectedOnlineColor)}</div>
                    <div class="online-actions">
                        <button id="online-join-confirm" class="online-primary">ENTRAR NA SALA</button>
                        <button id="online-join-cancel" class="online-secondary">VOLTAR</button>
                    </div>
                </div>
            </div>
        </div>
    `);
    attachColorHandlers();
    const pin = document.getElementById("online-join-pin");
    pin?.addEventListener("input", () => { pin.value = pin.value.replace(/\D/g, "").slice(0, 6); });
    document.getElementById("online-join-confirm")?.addEventListener("click", joinRoom);
    document.getElementById("online-join-cancel")?.addEventListener("click", showBaseOptions);
}

async function createRoom() {
    try {
        ensureFirebase();
    } catch (error) {
        console.error(error);
        setMessage(error.message || "Firebase não está disponível.", true);
        return;
    }
    const nameInput = document.getElementById("online-create-name");
    const name = nameInput?.value.trim() || "Jogador 1";
    const color = selectedOnlineColor;
    const matches = selectedOnlineMatches;
    setMessage("Criando sala...");

    try {
        roomCode = await makeRoomCode();
        role = "owner";
        const now = Date.now();
        const initial = {
            ownerId: clientId,
            player1: { name, color, clientId },
            player2: null,
            totalMatches: matches,
            currentMatch: 1,
            score: { player1: 0, player2: 0, draws: 0 },
            phase: "waiting",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            game: null
        };
        await set(roomRef(), initial);
        await onDisconnect(roomRef()).set(null);
        listenRoom();
        renderLobby();
    } catch (error) {
        console.error(error);
        setMessage("Não foi possível criar a sala. Tente novamente.", true);
    }
}

async function joinRoom() {
    try {
        ensureFirebase();
    } catch (error) {
        console.error(error);
        setMessage(error.message || "Firebase não está disponível.", true);
        return;
    }
    const pin = document.getElementById("online-join-pin")?.value.trim() || "";
    const name = document.getElementById("online-join-name")?.value.trim() || "Jogador 2";

    if (!roomCodeIsValid(pin)) {
        setMessage("Digite um PIN de 6 números.", true);
        return;
    }

    setMessage("Procurando sala...");

    try {
        const snapshot = await get(ref(db, `rooms/${pin}`));
        if (!snapshot.exists()) {
            setMessage("Sala não encontrada.", true);
            return;
        }
        const data = snapshot.val();
        if (data.player2) {
            setMessage("Essa sala já está cheia.", true);
            return;
        }
        if (data.player1?.color === selectedOnlineColor) {
            setMessage("Escolha uma cor diferente do Jogador 1.", true);
            return;
        }

        roomCode = pin;
        role = "guest";
        await update(roomRef(), {
            player2: { name, color: selectedOnlineColor, clientId },
            updatedAt: serverTimestamp()
        });
        await onDisconnect(ref(db, `rooms/${roomCode}/player2`)).set(null);
        listenRoom();
        renderLobby();
    } catch (error) {
        console.error(error);
        setMessage("Não foi possível entrar na sala.", true);
    }
}

function playerLabel(player) {
    return player?.name || "Aguardando jogador...";
}

function colorHex(color) {
    return {
        blue: "#168cff",
        red: "#ff3b3b",
        purple: "#8e44d6",
        green: "#20b94b",
        orange: "#ff8c18",
        yellow: "#ffd000",
        brown: "#8b5a2b"
    }[color] || "#168cff";
}

function playerLobbyColorPicker(playerNumber, currentColor) {
    const isMyPlayer = (role === "owner" && playerNumber === 1) || (role === "guest" && playerNumber === 2);
    if (!isMyPlayer) return "";
    return `
        <div class="online-player-color-label">ESCOLHA SUA COR</div>
        <div class="online-lobby-color-grid">
            ${colors.map(color => `
                <button type="button" class="online-color ${color} ${currentColor === color ? "selected" : ""}" data-lobby-color="${color}" title="${color}"></button>
            `).join("")}
        </div>
    `;
}

function playerCard(player, number, waiting = false) {
    const color = player?.color || "blue";
    const hex = colorHex(color);
    return `
        <div class="online-player ${waiting ? "waiting" : ""}" style="border-color:${waiting ? "#294d7c" : hex}">
            <div class="online-player-top">
                <span class="online-player-dot" style="background:${hex};color:${hex}"></span>
                <span class="online-player-name">${player ? escapeHtml(playerLabel(player)) : "Aguardando..."}</span>
            </div>
            <div class="online-player-role">${waiting ? "Aguardando alguém entrar" : `JOGADOR ${number}${number === 1 ? " • DONO" : ""}`}</div>
            ${playerLobbyColorPicker(number, color)}
        </div>
    `;
}

async function changeLobbyColor(color) {
    if (!roomCode || !roomData || !colors.includes(color)) return;
    const path = role === "owner" ? `rooms/${roomCode}/player1/color` : `rooms/${roomCode}/player2/color`;
    try {
        await set(ref(db, path), color);
        selectedOnlineColor = color;
    } catch (error) {
        console.error(error);
        setMessage("Não foi possível mudar a cor.", true);
    }
}

function attachLobbyColorHandlers() {
    onlineWorkspace?.querySelectorAll("[data-lobby-color]").forEach(button => {
        button.addEventListener("click", () => changeLobbyColor(button.dataset.lobbyColor));
    });
}

function renderLobby() {
    hideBaseOptions();
    const p1 = roomData?.player1;
    const p2 = roomData?.player2;
    const colorsAreDifferent = !!p1 && !!p2 && p1.color !== p2.color;
    const canStart = role === "owner" && !!p2 && colorsAreDifferent && roomData?.phase === "waiting";
    const ownerText = role === "owner" ? "Você é o dono da sala" : "Aguardando o dono iniciar a partida";
    const colorWarning = p2 && !colorsAreDifferent
        ? `<div class="online-color-warning">⚠️ Os dois jogadores estão com a mesma cor. Escolham cores diferentes para começar.</div>`
        : "";

    renderWorkspace(`
        <div class="online-panel">
            <div class="online-card">
                <div class="online-status">PIN DA SALA</div>
                <div class="online-room-code">${roomCode || "------"}</div>
                <div class="online-status">${ownerText}</div>
            </div>
            <div class="online-card">
                <div class="online-label">JOGADORES</div>
                <div class="online-players">
                    ${playerCard(p1,1,!p1)}
                    ${playerCard(p2,2,!p2)}
                </div>
                ${colorWarning}
                <div class="online-lobby-note">${p2 ? `Melhor de ${roomData.totalMatches}` : "Envie o PIN para o outro jogador entrar."}</div>
                ${role === "owner" ? `
                    <div class="online-actions">
                        <button id="online-start-room" class="online-primary" ${canStart ? "" : "disabled"}>COMEÇAR PARTIDA</button>
                        <button id="online-leave-room" class="online-secondary">SAIR DA SALA</button>
                    </div>
                ` : `
                    <div class="online-actions"><button id="online-leave-room" class="online-secondary">SAIR DA SALA</button></div>
                `}
            </div>
            ${renderChatHtml()}
        </div>
    `);

    document.getElementById("online-start-room")?.addEventListener("click", startSeriesOnline);
    document.getElementById("online-leave-room")?.addEventListener("click", leaveRoom);
    attachLobbyColorHandlers();
    attachChatHandlers();
}

function renderChatHtml() {
    return `
        <div class="online-card">
            <div class="online-label">💬 CHAT DA SALA</div>
            <div id="online-chat-list" class="online-chat"></div>
            <div class="online-chat-row">
                <input id="online-chat-input" class="online-input" maxlength="120" autocomplete="off" placeholder="Digite uma mensagem...">
                <button id="online-chat-send" class="online-primary">ENVIAR</button>
            </div>
        </div>
    `;
}

function attachChatHandlers() {
    chatInput = document.getElementById("online-chat-input");
    chatList = document.getElementById("online-chat-list");
    document.getElementById("online-chat-send")?.addEventListener("click", sendChat);
    chatInput?.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            sendChat();
        }
    });
}

async function sendChat() {
    const text = chatInput?.value.trim();
    if (!text || !roomCode || !roomData) return;

    try {
        ensureFirebase();
        const name = role === "owner"
            ? (roomData.player1?.name || "Jogador 1")
            : (roomData.player2?.name || "Jogador 2");

        // Usa diretamente a API compat do Realtime Database.
        // Isso evita qualquer diferença entre versões do SDK.
        await db.ref(`rooms/${roomCode}/chat`).push({
            name,
            text: text.slice(0, 120),
            clientId,
            at: firebase.database.ServerValue.TIMESTAMP
        });

        if (chatInput) {
            chatInput.value = "";
            chatInput.focus();
        }
    } catch (error) {
        console.error("Erro ao enviar mensagem do chat:", error);
        setMessage("Não foi possível enviar a mensagem. Verifique a conexão com o Firebase.", true);
    }
}

function listenChat() {
    if (!roomCode) return;
    if (unsubscribeChat) unsubscribeChat();

    try {
        ensureFirebase();
        const chatRef = db.ref(`rooms/${roomCode}/chat`);
        const handler = snapshot => {
            const messages = snapshot.val() || {};
            const items = Object.values(messages)
                .sort((a,b) => Number(a.at || 0) - Number(b.at || 0))
                .slice(-60);

            if (!chatList) return;
            chatList.innerHTML = items.map(item =>
                `<div class="online-chat-msg"><strong>${escapeHtml(item.name || "Jogador")}:</strong> ${escapeHtml(item.text || "")}</div>`
            ).join("");
            chatList.scrollTop = chatList.scrollHeight;
        };

        chatRef.on("value", handler);
        unsubscribeChat = () => chatRef.off("value", handler);
    } catch (error) {
        console.error("Erro ao conectar o chat:", error);
        setMessage("Não foi possível conectar o chat ao Firebase.", true);
    }
}

function listenRoom() {
    if (unsubscribeRoom) unsubscribeRoom();
    if (!roomCode) return;
    unsubscribeRoom = onValue(roomRef(), snapshot => {
        if (!snapshot.exists()) {
            if (!leavingRoom) setMessage("A sala foi encerrada.", true);
            cleanupRoomListener();
            if (window.Lig4Game) {
                window.Lig4Game.returnToMode?.();
            } else {
                const mode = document.getElementById("mode-screen");
                if (mode) mode.style.display = "flex";
            }
            showBaseOptions();
            return;
        }

        roomData = snapshot.val();
        handleRoomUpdate(roomData);
        // O lobby cria o HTML do chat; só depois conectamos o listener.
        if (roomData.phase === "waiting") listenChat();
    });
}

function handleRoomUpdate(data) {
    if (!data) return;

    if (data.phase === "waiting") {
        if (onlineScreen?.style.display !== "none") renderLobby();
        return;
    }

    if (data.phase === "countdown") {
        startCountdown(data.countdownStartedAt, data.currentMatch);
        return;
    }

    if (data.phase === "playing") {
        stopCountdown();
        ensureGameStarted(data);
        if (data.game) window.Lig4Game?.applyOnlineState(data.game);
        return;
    }

    if (data.phase === "result") {
        stopCountdown();
        ensureGameStarted(data);
        if (data.game) window.Lig4Game?.applyOnlineState({ ...data.game, phase: "result", gameActive: false });
        if (data.result) window.Lig4Game?.showOnlineResult(data.result, data.score);
        configureResultButtons(data);
        return;
    }

    if (data.phase === "seriesFinished") {
        stopCountdown();
        ensureGameStarted(data);
        if (data.result) window.Lig4Game?.showOnlineResult(data.result, data.score);
        configureFinalResult(data);
        return;
    }

    // Compatibilidade com salas antigas que ainda usam "finished".
    if (data.phase === "finished") {
        stopCountdown();
        ensureGameStarted(data);
        if (data.result) window.Lig4Game?.showOnlineResult(data.result, data.score);
        configureFinalResult(data);
    }
}

function ensureGameStarted(data) {
    const expected1 = data.player1;
    const expected2 = data.player2;
    if (!expected1 || !expected2) return;
    if (window.Lig4Game && (document.getElementById("game-container")?.style.display === "none" || window.__lig4OnlineStartedMatch !== `${data.currentMatch}`)) {
        window.__lig4OnlineStartedMatch = `${data.currentMatch}`;
        window.Lig4Game.startOnlineMatch({
            player1: expected1,
            player2: expected2,
            totalMatches: Number(data.totalMatches) || 1,
            currentMatch: Number(data.currentMatch) || 1,
            score: data.score || { player1:0, player2:0, draws:0 }
        });
        ensureTouchControls();
    }
    ensureTouchControls();
}

function ensureTouchControls() {
    if (document.getElementById("online-game-touch-controls")) return;
    const boardArea = document.querySelector(".board-area");
    if (!boardArea) return;
    const controls = document.createElement("div");
    controls.id = "online-game-touch-controls";
    controls.className = "online-game-touch";
    controls.innerHTML = `
        <button type="button" data-touch="left">←</button>
        <button type="button" data-touch="drop">SOLTAR</button>
        <button type="button" data-touch="right">→</button>
    `;
    boardArea.parentElement?.appendChild(controls);
    controls.querySelector('[data-touch="left"]')?.addEventListener("click", () => window.Lig4Game?.selectOnlineColumn?.((window.__lig4CurrentColumnForTouch ?? 3) - 1));
    controls.querySelector('[data-touch="right"]')?.addEventListener("click", () => window.Lig4Game?.selectOnlineColumn?.((window.__lig4CurrentColumnForTouch ?? 3) + 1));
    controls.querySelector('[data-touch="drop"]')?.addEventListener("click", () => window.Lig4Game?.dropOnlinePiece?.());
    boardArea.addEventListener("click", event => {
        if (!roomCode || !roomData || roomData.phase !== "playing") return;
        if (!canAct()) return;
        const rect = boardArea.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const col = Math.max(0, Math.min(6, Math.floor((x / rect.width) * 7)));
        window.__lig4CurrentColumnForTouch = col;
        window.Lig4Game?.selectOnlineColumn?.(col);
        window.Lig4Game?.dropOnlinePiece?.();
    });
}

async function startSeriesOnline() {
    if (role !== "owner" || !roomData?.player2 || roomData.phase !== "waiting") return;

    // Confirma no Firebase o estado mais recente antes de iniciar.
    // A partida só começa se as cores forem diferentes.
    try {
        const fresh = await get(roomRef());
        if (!fresh.exists()) return;
        const data = fresh.val();
        if (!data.player1 || !data.player2 || data.phase !== "waiting") return;
        if (data.player1.color === data.player2.color) {
            setMessage("Os jogadores precisam estar com cores diferentes para começar.", true);
            renderLobby();
            return;
        }
    } catch (error) {
        console.error(error);
        setMessage("Não foi possível verificar as cores dos jogadores.", true);
        return;
    }

    const started = {
        phase: "countdown",
        currentMatch: 1,
        score: { player1:0, player2:0, draws:0 },
        rematch: { player1:false, player2:false },
        seriesRematch: { player1:false, player2:false },
        result: null,
        countdownStartedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    };
    update(roomRef(), started).catch(error => {
        console.error(error);
        setMessage("Não foi possível iniciar a partida.", true);
    });
}

function startCountdown(startedAt, matchNumber) {
    if (!startedAt) return;
    if (countdownStarted === String(startedAt)) return;
    countdownStarted = String(startedAt);
    stopCountdown(false);

    const overlay = document.createElement("div");
    overlay.className = "online-countdown";
    overlay.innerHTML = `<div class="online-countdown-number">3</div>`;
    document.body.appendChild(overlay);
    countdownOverlay = overlay;

    const number = overlay.querySelector(".online-countdown-number");
    const start = Number(startedAt);
    const render = () => {
        const elapsed = Date.now() - start;
        const remaining = 3 - Math.floor(elapsed / 1000);
        if (remaining > 0) {
            number.textContent = String(remaining);
            countdownTimer = setTimeout(render, 120);
        } else {
            number.textContent = "GO!";
            countdownTimer = setTimeout(() => finishCountdown(matchNumber), 350);
        }
    };
    render();
}

async function finishCountdown(matchNumber) {
    stopCountdown();
    if (role !== "owner" || !roomData) return;
    const fresh = await get(roomRef());
    if (!fresh.exists()) return;
    const data = fresh.val();
    if (data.phase !== "countdown" || Number(data.currentMatch) !== Number(matchNumber)) return;

    const initialGame = {
        board: Array.from({length:6}, () => Array(7).fill(0)),
        currentPlayer: 1,
        frozenColumns: Array(7).fill(0),
        boardFlipped: false,
        powers: {
            1: {bomb:true,flip:true,ice:true,electric:true},
            2: {bomb:true,flip:true,ice:true,electric:true}
        },
        gameActive: true,
        currentMatch: Number(data.currentMatch) || 1,
        score: data.score || {player1:0,player2:0,draws:0},
        phase: "playing"
    };

    await update(roomRef(), {
        phase: "playing",
        game: initialGame,
        result: null,
        rematch: {player1:false,player2:false},
        updatedAt: serverTimestamp()
    });
}

function stopCountdown(resetKey = true) {
    if (countdownTimer) clearTimeout(countdownTimer);
    countdownTimer = null;
    countdownOverlay?.remove();
    countdownOverlay = null;
    if (resetKey) countdownStarted = null;
}

function currentPlayerNumber() {
    return role === "owner" ? 1 : 2;
}

function canAct() {
    return !!roomData && roomData.phase === "playing" && Number(roomData.game?.currentPlayer) === currentPlayerNumber();
}

function gameSnapshot() {
    const game = window.__lig4ReadState?.();
    return game;
}

/* The bridge below is supplied by script.js through these functions. */
window.Lig4Online = {
    canAct,
    publishGameState,
    publishResult,
    requestRematch,
    leaveRoom
};

async function publishGameState() {
    if (role !== "owner" && role !== "guest") return;
    if (!roomCode || !roomData || roomData.phase !== "playing") return;
    const state = window.__lig4GetState?.();
    if (!state) return;
    try {
        await update(roomRef(), {
            game: state,
            score: state.score,
            currentMatch: state.currentMatch,
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Falha ao sincronizar jogada", error);
    }
}

async function publishResult(type, player) {
    if (!roomCode || !roomData) return;
    const state = window.__lig4GetState?.();
    if (!state) return;
    const finalSeries = Number(roomData.currentMatch) >= Number(roomData.totalMatches);
    try {
        await update(roomRef(), {
            phase: finalSeries ? "seriesFinished" : "result",
            game: { ...state, phase: finalSeries ? "seriesFinished" : "result", gameActive:false },
            score: state.score,
            currentMatch: state.currentMatch,
            result: { type, player: Number(player) || null },
            rematch: { player1:false, player2:false },
            updatedAt: serverTimestamp()
        });
    } catch (error) {
        console.error("Falha ao publicar resultado", error);
    }
}

function configureResultButtons(data) {
    const reset = document.getElementById("popup-reset-btn");
    const home = document.getElementById("popup-home-btn");
    if (!reset || !home) return;
    reset.style.display = "block";
    reset.textContent = data.rematch?.[role === "owner" ? "player1" : "player2"] ? "Aguardando o outro jogador..." : "Jogar Novamente";
    reset.disabled = !!data.rematch?.[role === "owner" ? "player1" : "player2"];
    home.style.display = role === "owner" ? "block" : "none";
    home.textContent = "Sair";
}

function configureFinalResult(data) {
    const reset = document.getElementById("popup-reset-btn");
    const home = document.getElementById("popup-home-btn");
    if (!reset || !home) return;

    const key = role === "owner" ? "player1" : "player2";
    const alreadyAccepted = !!data.seriesRematch?.[key];

    reset.style.display = "block";
    reset.textContent = alreadyAccepted
        ? "Aguardando o outro jogador..."
        : "Jogar a série mais uma vez";
    reset.disabled = alreadyAccepted;
    reset.style.opacity = alreadyAccepted ? "0.75" : "1";

    home.style.display = "block";
    home.textContent = "Sair";
}

async function requestRematch() {
    if (!roomCode || !roomData) return;

    // Fim da série: cada clique é registrado em uma TRANSACTION.
    // Assim, o segundo jogador a confirmar é quem efetivamente vira a sala
    // para o countdown. Não dependemos de um update + leitura separada,
    // evitando o estado preso em "Aguardando o outro jogador...".
    if (roomData.phase === "seriesFinished") {
        const key = role === "owner" ? "player1" : "player2";

        try {
            await roomRef().transaction(current => {
                if (!current) return current;
                if (current.phase !== "seriesFinished") return current;

                const seriesRematch = {
                    player1: !!current.seriesRematch?.player1,
                    player2: !!current.seriesRematch?.player2
                };

                seriesRematch[key] = true;

                // Só começa quando OS DOIS confirmarem.
                if (seriesRematch.player1 && seriesRematch.player2) {
                    return {
                        ...current,
                        phase: "countdown",
                        currentMatch: 1,
                        score: { player1: 0, player2: 0, draws: 0 },
                        rematch: { player1: false, player2: false },
                        seriesRematch: { player1: false, player2: false },
                        result: null,
                        game: null,
                        countdownStartedAt: firebase.database.ServerValue.TIMESTAMP,
                        updatedAt: firebase.database.ServerValue.TIMESTAMP
                    };
                }

                return {
                    ...current,
                    seriesRematch,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                };
            });
        } catch (error) {
            console.error("Erro ao reiniciar a série:", error);
            setMessage("Não foi possível reiniciar a série. Verifique a conexão.", true);
        }
        return;
    }

    // Partidas intermediárias: os DOIS jogadores precisam confirmar.
    // Qualquer um dos dois pode ser o segundo a confirmar; por isso usamos
    // uma única transação no Firebase para registrar e verificar os dois.
    if (roomData.phase !== "result") return;

    const key = role === "owner" ? "player1" : "player2";

    try {
        await roomRef().transaction(current => {
            if (!current) return current;
            if (current.phase !== "result") return current;

            const rematch = {
                player1: !!current.rematch?.player1,
                player2: !!current.rematch?.player2
            };

            rematch[key] = true;

            // Quando os dois confirmarem, o próprio segundo clique
            // transforma a sala em countdown.
            if (rematch.player1 && rematch.player2) {
                const nextMatch = Number(current.currentMatch || 1) + 1;

                return {
                    ...current,
                    phase: "countdown",
                    currentMatch: nextMatch,
                    countdownStartedAt: firebase.database.ServerValue.TIMESTAMP,
                    rematch: { player1: false, player2: false },
                    result: null,
                    game: null,
                    updatedAt: firebase.database.ServerValue.TIMESTAMP
                };
            }

            return {
                ...current,
                rematch,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            };
        });
    } catch (error) {
        console.error("Erro ao preparar a próxima partida:", error);
        setMessage("Não foi possível iniciar a próxima partida. Verifique a conexão.", true);
    }
}

async function leaveRoom() {
    if (!roomCode) {
        showBaseOptions();
        return;
    }
    leavingRoom = true;
    stopCountdown();
    try {
        const fresh = await get(roomRef());
        if (fresh.exists()) {
            const data = fresh.val();
            if (data.phase === "seriesFinished") {
                // No fim da série, se um jogador sair, a sala é encerrada
                // para os dois. O outro cliente receberá room = null.
                await set(roomRef(), null);
            } else if (role === "owner") {
                await set(roomRef(), null);
            } else if (data.player2?.clientId === clientId) {
                await update(roomRef(), { player2:null, phase:"waiting", result:null, game:null, updatedAt:serverTimestamp() });
            }
        }
    } catch (error) {
        console.error(error);
    }
    cleanupRoomListener();
    roomCode = null;
    role = null;
    roomData = null;
    window.__lig4OnlineStartedMatch = null;
    if (window.Lig4Game) {
        // Sair da partida/sala sempre retorna à tela com os 3 modos.
        window.Lig4Game.returnToMode?.();
    } else {
        const mode = document.getElementById("mode-screen");
        if (mode) mode.style.display = "flex";
    }

    if (onlineScreen) onlineScreen.style.display = "none";
    showBaseOptions();
    leavingRoom = false;
}

function cleanupRoomListener() {
    if (unsubscribeRoom) unsubscribeRoom();
    if (unsubscribeChat) unsubscribeChat();
    unsubscribeRoom = null;
    unsubscribeChat = null;
}

function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;","\"":"&quot;"}[char]));
}

/* ==================================================
   INTERAÇÃO COM O MENU EXISTENTE
================================================== */

createRoomBtn?.addEventListener("click", createForm);
joinRoomBtn?.addEventListener("click", joinForm);

onlineBackBtn?.addEventListener("click", () => {
    if (roomCode) {
        leaveRoom();
        return;
    }
    showBaseOptions();
    if (onlineScreen) onlineScreen.style.display = "none";
    const mode = document.getElementById("mode-screen");
    if (mode) mode.style.display = "flex";
});

/*
   O jogo JS precisa conseguir exportar seu estado atual para este módulo.
   Fazemos isso aqui sem alterar a lógica do jogo.
*/

window.__lig4GetState = function () {
    return window.__lig4StateProvider?.();
};

window.addEventListener("beforeunload", () => {
    // O Firebase mantém a sala até que alguém saia; o PIN não é uma credencial.
});


})();
