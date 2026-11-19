/* ==================================================
   CONFIGURAÇÕES DO JOGO
================================================== */

const ROWS = 6;
const COLS = 7;
const DROP_TIME = 350;


/* ==================================================
   ESTADO DO JOGO
================================================== */

let boardState = [];

let currentPlayer = 1;
let currentColumn = 3;

let gameActive = false;
let pieceFalling = false;

let frozenColumns = [];
let dangerTimeout = null;
let victoryTimeout = null;

/*
   CONTROLA SE O TABULEIRO ESTÁ INVERTIDO.

   false = normal
   true  = invertido
*/
let boardFlipped = false;


/* ==================================================
   EFEITO VISUAL DE VITÓRIA
================================================== */

function addVictoryStyles() {

    if (
        document.getElementById(
            "victory-effect-styles"
        )
    ) {

        return;

    }

    const style =
        document.createElement("style");

    style.id =
        "victory-effect-styles";

    style.textContent = `

        .board.victory-active {
            position: relative;
        }

        .board.victory-active::after {

            content: "";

            position: absolute;

            inset: 0;

            background:
                rgba(0, 0, 0, .55);

            border-radius:
                inherit;

            z-index: 10;

            pointer-events: none;

        }

        .board.victory-active .cell {

            position: relative;

            z-index: 11;

            filter:
                brightness(.38)
                saturate(.35);

            opacity: .55;

            transition:
                filter .3s ease,
                opacity .3s ease;

        }

        .board.victory-active
        .cell.winning-piece {

            position: relative;

            z-index: 20;

            opacity: 1;

            filter:
                brightness(1.35)
                saturate(1.6);

            animation:
                winningPiecePulse
                .8s
                ease-in-out
                infinite;

        }

        .board.victory-active
        .cell.winning-piece::after {

            content: "";

            position: absolute;

            inset: -8px;

            border-radius: 50%;

            background:
                radial-gradient(
                    circle,
                    rgba(255,255,255,.55) 0%,
                    rgba(255,255,255,.22) 28%,
                    transparent 70%
                );

            z-index: -1;

            pointer-events: none;

            animation:
                winningGlow
                1s
                ease-in-out
                infinite;

        }

        @keyframes winningPiecePulse {

            0% {

                transform:
                    scale(1);

                filter:
                    brightness(1.15)
                    saturate(1.35)
                    drop-shadow(
                        0 0 8px rgba(255,255,255,.65)
                    );

            }

            50% {

                transform:
                    scale(1.08);

                filter:
                    brightness(1.55)
                    saturate(1.8)
                    drop-shadow(
                        0 0 18px rgba(255,255,255,1)
                    );

            }

            100% {

                transform:
                    scale(1);

                filter:
                    brightness(1.15)
                    saturate(1.35)
                    drop-shadow(
                        0 0 8px rgba(255,255,255,.65)
                    );

            }

        }

        @keyframes winningGlow {

            0% {

                opacity: .35;

                transform:
                    scale(.9);

            }

            50% {

                opacity: .9;

                transform:
                    scale(1.2);

            }

            100% {

                opacity: .35;

                transform:
                    scale(.9);

            }

        }

        .board.victory-active
        .cell.winning-piece {

            isolation: isolate;

        }

    `;

    document.head.appendChild(style);

}


/* ==================================================
   CONFIGURAÇÃO DOS JOGADORES
================================================== */

let playerSettings = {

    1: {
        name: "Jogador 1",
        color: "blue"
    },

    2: {
        name: "Jogador 2",
        color: "red"
    }

};


/* ==================================================
   SÉRIE DE PARTIDAS
================================================== */

let totalMatches = 1;
let currentMatch = 1;


/* ==================================================
   PLACAR
================================================== */

let score = {

    player1: 0,
    player2: 0,
    draws: 0

};


/* ==================================================
   HABILIDADES
================================================== */

let powers = {

    1: {
        bomb: true,
        flip: true,
        ice: true,
        electric: true
    },

    2: {
        bomb: true,
        flip: true,
        ice: true,
        electric: true
    }

};


/* ==================================================
   CORES
================================================== */

const colorData = {

    blue: {
        name: "Azul",
        main: "#168cff",
        light: "#7ac8ff",
        dark: "#0751a0",
        border: "#49aaff",
        glow: "rgba(22,140,255,.65)"
    },

    red: {
        name: "Vermelho",
        main: "#ff3b3b",
        light: "#ff9a9a",
        dark: "#a50000",
        border: "#ff6b6b",
        glow: "rgba(255,59,59,.65)"
    },

    purple: {
        name: "Roxo",
        main: "#8e44d6",
        light: "#d5aaff",
        dark: "#4b1680",
        border: "#b56bf0",
        glow: "rgba(142,68,214,.65)"
    },

    green: {
        name: "Verde",
        main: "#20b94b",
        light: "#a9ffb4",
        dark: "#087528",
        border: "#55dc78",
        glow: "rgba(32,185,75,.65)"
    },

    orange: {
        name: "Laranja",
        main: "#ff8c18",
        light: "#ffd19a",
        dark: "#a94b00",
        border: "#ffad4f",
        glow: "rgba(255,140,24,.65)"
    },

    yellow: {
        name: "Amarelo",
        main: "#ffd000",
        light: "#fff9a3",
        dark: "#a98500",
        border: "#ffe45c",
        glow: "rgba(255,208,0,.65)"
    },

    brown: {
        name: "Marrom",
        main: "#8b5a2b",
        light: "#d8a77c",
        dark: "#4a2a12",
        border: "#b8793d",
        glow: "rgba(139,90,43,.65)"
    }

};


/* ==================================================
   ELEMENTOS HTML
================================================== */

const introScreen =
    document.getElementById("intro-screen");

const setupScreen =
    document.getElementById("setup-screen");

const modeScreen =
    document.getElementById("mode-screen");

const singleplayerScreen =
    document.getElementById("singleplayer-screen");

const onlineScreen =
    document.getElementById("online-screen");

const singlePlayerNameInput =
    document.getElementById("single-player-name");

const singlePlayerColorText =
    document.getElementById("single-player-color-text");

const singleError =
    document.getElementById("single-error");

const onlineMessage =
    document.getElementById("online-message");

const localModeBtn =
    document.getElementById("local-game-btn");

const singleplayerModeBtn =
    document.querySelector(".mode-singleplayer");

const onlineModeBtn =
    document.querySelector(".mode-online");

const startGameBtn =
    document.getElementById("start-game-btn");

const setupError =
    document.getElementById("setup-error");

const player1NameInput =
    document.getElementById("player1-name");

const player2NameInput =
    document.getElementById("player2-name");

const player1ColorText =
    document.getElementById("player1-color-text");

const player2ColorText =
    document.getElementById("player2-color-text");

const gameContainer =
    document.getElementById("game-container");

const boardElement =
    document.getElementById("board");

const boardArea =
    document.querySelector(".board-area");

const floatingPiece =
    document.getElementById("floating-piece");

const columnIndicator =
    document.getElementById("column-indicator");

const statusElement =
    document.getElementById("status");

const playerNumElement =
    document.getElementById("player-num");

const resetBtn =
    document.getElementById("reset-btn");

const exitMatchBtn =
    document.getElementById("exit-match-btn");

const resultOverlay =
    document.getElementById("result-overlay");

const resultBox =
    document.getElementById("result-box");

const resultIcon =
    document.getElementById("result-icon");

const resultMessage =
    document.getElementById("result-message");

const resultDescription =
    document.getElementById("result-description");

const popupResetBtn =
    document.getElementById("popup-reset-btn");

const popupHomeBtn =
    document.getElementById("popup-home-btn");

const dangerWarning =
    document.getElementById("danger-warning");

const dangerText =
    document.getElementById("danger-text");

const dangerTimerBar =
    document.getElementById("danger-timer-bar");

const powerHelp =
    document.getElementById("power-help");

const confettiContainer =
    document.getElementById("confetti-container");


/* ==================================================
   PLACAR
================================================== */

const scorePlayer1Name =
    document.getElementById("score-player1-name");

const scorePlayer2Name =
    document.getElementById("score-player2-name");

const player1Wins =
    document.getElementById("player1-wins");

const player2Wins =
    document.getElementById("player2-wins");

const drawWins =
    document.getElementById("draw-wins");

const player1Score =
    document.getElementById("player1-score");

const player2Score =
    document.getElementById("player2-score");

const player1ScoreBall =
    document.getElementById("player1-score-ball");

const player2ScoreBall =
    document.getElementById("player2-score-ball");

const currentMatchElement =
    document.getElementById("current-match");

const totalMatchesElement =
    document.getElementById("total-matches");


/* ==================================================
   ESCOLHAS DA TELA INICIAL
================================================== */

let selectedColors = {

    1: "blue",
    2: "red"

};

let selectedMatches = 1;

/* ==================================================
   MODOS ADICIONADOS
   Não altera a lógica existente do Jogo Local.
================================================== */
let gameMode = "local";
let botDifficulty = "beginner";
let singleSelectedColor = "blue";
let singleSelectedMatches = 1;
let botThinking = false;
let botTimer = null;
let botExecuting = false;


/* ==================================================
   COR DINÂMICA DOS CARDS DA TELA INICIAL
================================================== */

function updateSetupPlayerTheme(player) {

    const card =
        document.querySelector(
            player === 1
                ? ".player1-card"
                : ".player2-card"
        );

    if (!card) {
        return;
    }

    const color =
        colorData[
            selectedColors[player]
        ];

    if (!color) {
        return;
    }

    card.style.setProperty(
        "--setup-main",
        color.main
    );

    card.style.setProperty(
        "--setup-light",
        color.light
    );

    card.style.setProperty(
        "--setup-border",
        color.border
    );

    card.style.setProperty(
        "--setup-glow",
        color.glow
    );

    /*
       Atualiza visualmente o card imediatamente quando a cor
       é escolhida. O !important garante que nenhuma regra CSS
       fixa do card sobrescreva a nova cor.
    */
    /*
       Força a borda diretamente no elemento.
       Isso evita que qualquer regra fixa do CSS do card
       impeça a atualização visual da cor escolhida.
    */
    card.style.setProperty(
        "border",
        `2px solid ${color.border}`,
        "important"
    );

    card.style.setProperty(
        "border-color",
        color.border,
        "important"
    );

    card.style.setProperty(
        "box-shadow",
        `0 0 0 1px rgba(255,255,255,.03),
         0 0 24px ${color.glow}`,
        "important"
    );

}


/* ==================================================
   ATUALIZAR OS DOIS CARDS
================================================== */

function updateSetupThemes() {

    updateSetupPlayerTheme(1);

    updateSetupPlayerTheme(2);

}


/* ==================================================
   APLICAR CORES
================================================== */

function applyPlayerColors() {

    const p1 =
        colorData[playerSettings[1].color];

    const p2 =
        colorData[playerSettings[2].color];

    if (!p1 || !p2) {
        return;
    }

    document.documentElement.style.setProperty(
        "--p1-main",
        p1.main
    );

    document.documentElement.style.setProperty(
        "--p1-light",
        p1.light
    );

    document.documentElement.style.setProperty(
        "--p1-dark",
        p1.dark
    );

    document.documentElement.style.setProperty(
        "--p1-border",
        p1.border
    );

    document.documentElement.style.setProperty(
        "--p1-glow",
        p1.glow
    );

    document.documentElement.style.setProperty(
        "--p2-main",
        p2.main
    );

    document.documentElement.style.setProperty(
        "--p2-light",
        p2.light
    );

    document.documentElement.style.setProperty(
        "--p2-dark",
        p2.dark
    );

    document.documentElement.style.setProperty(
        "--p2-border",
        p2.border
    );

    document.documentElement.style.setProperty(
        "--p2-glow",
        p2.glow
    );

    updateBoardColor();

}


/* ==================================================
   COR DO TABULEIRO
================================================== */

function updateBoardColor() {

    const currentColor =
        colorData[
            playerSettings[currentPlayer].color
        ];

    if (!currentColor) {
        return;
    }

    document.documentElement.style.setProperty(
        "--board-main",
        currentColor.main
    );

    document.documentElement.style.setProperty(
        "--board-dark",
        mixColor(
            currentColor.dark,
            "#030914",
            0.45
        )
    );

    document.documentElement.style.setProperty(
        "--board-border",
        currentColor.border
    );

}


/* ==================================================
   MISTURAR CORES
================================================== */

function mixColor(
    color1,
    color2,
    amount
) {

    const c1 =
        hexToRgb(color1);

    const c2 =
        hexToRgb(color2);

    const r =
        Math.round(
            c1.r +
            (c2.r - c1.r) * amount
        );

    const g =
        Math.round(
            c1.g +
            (c2.g - c1.g) * amount
        );

    const b =
        Math.round(
            c1.b +
            (c2.b - c1.b) * amount
        );

    return `rgb(${r}, ${g}, ${b})`;

}


function hexToRgb(hex) {

    hex =
        hex.replace("#", "");

    return {

        r: parseInt(
            hex.substring(0, 2),
            16
        ),

        g: parseInt(
            hex.substring(2, 4),
            16
        ),

        b: parseInt(
            hex.substring(4, 6),
            16
        )

    };

}


/* ==================================================
   ESCOLHER COR
================================================== */

document
    .querySelectorAll(".color-option")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                const color =
                    button.dataset.color;

                const card =
                    button.closest(
                        ".player-setup-card"
                    );

                const player =
                    card.classList.contains(
                        "player1-card"
                    )
                        ? 1
                        : 2;

                const otherPlayer =
                    player === 1
                        ? 2
                        : 1;

                if (
                    selectedColors[otherPlayer]
                    === color
                ) {

                    setupError.textContent =
                        "Os jogadores precisam escolher cores diferentes.";

                    return;

                }

                selectedColors[player] =
                    color;

                setupError.textContent =
                    "";

                /* Atualiza o card na mesma hora em que a cor é clicada. */
                updateSetupPlayerTheme(player);
                updateColorSelection();

            }

        );

    });


/* ==================================================
   ATUALIZAR SELEÇÃO DE CORES
================================================== */

function updateColorSelection() {

    document
        .querySelectorAll(".color-option")
        .forEach(button => {

            const color =
                button.dataset.color;

            const card =
                button.closest(
                    ".player-setup-card"
                );

            /*
               A tela de Singleplayer também possui .color-option,
               mas esses botões não pertencem a um player-setup-card.
               Ignora esses botões aqui para não interromper o JavaScript.
            */
            if (!card) {
                return;
            }

            const player =
                card.classList.contains(
                    "player1-card"
                )
                    ? 1
                    : 2;

            const otherPlayer =
                player === 1
                    ? 2
                    : 1;

            button.classList.remove(
                "selected",
                "disabled"
            );

            if (
                selectedColors[player]
                === color
            ) {

                button.classList.add(
                    "selected"
                );

            }

            if (
                selectedColors[otherPlayer]
                === color
            ) {

                button.classList.add(
                    "disabled"
                );

            }

        });

    player1ColorText.textContent =
        colorData[
            selectedColors[1]
        ].name;

    player2ColorText.textContent =
        colorData[
            selectedColors[2]
        ].name;

    updateSetupThemes();

}


/* ==================================================
   ESCOLHER PARTIDAS
================================================== */

document
    .querySelectorAll(".match-option")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                selectedMatches =
                    Number(
                        button.dataset.matches
                    );

                document
                    .querySelectorAll(
                        ".match-option"
                    )
                    .forEach(option => {

                        option.classList.remove(
                            "selected"
                        );

                    });

                button.classList.add(
                    "selected"
                );

                setupError.textContent =
                    "";

            }

        );

    });


const firstMatchOption =
    document.querySelector(
        '.match-option[data-matches="1"]'
    );

if (firstMatchOption) {

    firstMatchOption.classList.add(
        "selected"
    );

}


/* ==================================================
   FLUXO DAS TELAS
================================================== */

function hideAllMenuScreens() {
    if (introScreen) introScreen.style.display = "none";
    if (modeScreen) modeScreen.style.display = "none";
    if (setupScreen) setupScreen.style.display = "none";
    if (singleplayerScreen) singleplayerScreen.style.display = "none";
    if (onlineScreen) onlineScreen.style.display = "none";
}

function showModeScreen() {
    hideAllMenuScreens();
    if (modeScreen) modeScreen.style.display = "flex";
}

function showSetupScreen() {
    hideAllMenuScreens();
    gameMode = "local";
    if (setupScreen) setupScreen.style.display = "flex";
    if (setupError) setupError.textContent = "";
}

function showSingleplayerSetup() {
    hideAllMenuScreens();
    gameMode = "singleplayer";
    if (singleplayerScreen) singleplayerScreen.style.display = "flex";
    if (singleError) singleError.textContent = "";
    updateSingleColorSelection();
    updateDifficultySelection();
    updateSingleMatchSelection();
}

function showOnlineScreen() {
    hideAllMenuScreens();
    if (onlineScreen) onlineScreen.style.display = "flex";
    if (onlineMessage) onlineMessage.textContent = "";
}

if (introScreen) {
    introScreen.addEventListener("click", showModeScreen);
}

if (localModeBtn) {
    localModeBtn.addEventListener("click", event => {
        event.stopPropagation();
        showSetupScreen();
    });
}

document.getElementById("singleplayer-mode-btn")?.addEventListener(
    "click", showSingleplayerSetup
);

document.getElementById("online-mode-btn")?.addEventListener(
    "click", showOnlineScreen
);

document.getElementById("mode-back-btn")?.addEventListener("click", () => {
    hideAllMenuScreens();
    if (introScreen) introScreen.style.display = "flex";
});

document.getElementById("setup-back-btn")?.addEventListener("click", () => {
    showModeScreen();
});

document.getElementById("single-back-btn")?.addEventListener(
    "click", showModeScreen
);

/* O menu Online agora é controlado por online.js. */

/* ==================================================
   CONFIGURAÇÃO SINGLEPLAYER
================================================== */

document.querySelectorAll("#single-player-colors .color-option")
    .forEach(button => {
        button.addEventListener("click", () => {
            singleSelectedColor = button.dataset.color;
            if (singleError) singleError.textContent = "";
            updateSingleColorSelection();
        });
    });

function updateSingleColorSelection() {
    document.querySelectorAll("#single-player-colors .color-option")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.color === singleSelectedColor
            );
        });

    if (singlePlayerColorText && colorData[singleSelectedColor]) {
        singlePlayerColorText.textContent =
            colorData[singleSelectedColor].name;
    }
}

document.querySelectorAll(".difficulty-option")
    .forEach(button => {
        button.addEventListener("click", () => {
            botDifficulty = button.dataset.difficulty;
            updateDifficultySelection();
        });
    });

function updateDifficultySelection() {
    document.querySelectorAll(".difficulty-option")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                button.dataset.difficulty === botDifficulty
            );
        });
}

document.querySelectorAll(".single-match-option")
    .forEach(button => {
        button.addEventListener("click", () => {
            singleSelectedMatches = Number(button.dataset.matches);
            updateSingleMatchSelection();
        });
    });

function updateSingleMatchSelection() {
    document.querySelectorAll(".single-match-option")
        .forEach(button => {
            button.classList.toggle(
                "selected",
                Number(button.dataset.matches) === singleSelectedMatches
            );
        });
}

document.getElementById("start-single-btn")?.addEventListener(
    "click", startSingleplayer
);

function startSingleplayer() {
    let name = singlePlayerNameInput
        ? singlePlayerNameInput.value.trim()
        : "";

    if (!name) name = "Jogador";

    const botColor =
        singleSelectedColor === "red" ? "blue" : "red";

    playerSettings = {
        1: {
            name,
            color: singleSelectedColor
        },
        2: {
            name: "BOT",
            color: botColor
        }
    };

    totalMatches = singleSelectedMatches;
    currentMatch = 1;
    score = {
        player1: 0,
        player2: 0,
        draws: 0
    };

    gameMode = "singleplayer";
    botThinking = false;
    botExecuting = false;
    clearTimeout(botTimer);
    clearConfetti();
    applyPlayerColors();

    if (singleplayerScreen) singleplayerScreen.style.display = "none";
    gameContainer.style.display = "block";

    updateScoreboard();
    initGame();
}

/* ==================================================
   COMEÇAR SÉRIE
================================================== */

startGameBtn.addEventListener(
    "click",
    startSeries
);


function startSeries() {

    gameMode = "local";
    clearTimeout(botTimer);
    botThinking = false;
    botExecuting = false;

    let name1 =
        player1NameInput.value.trim();

    let name2 =
        player2NameInput.value.trim();

    if (!name1) {
        name1 = "Jogador 1";
    }

    if (!name2) {
        name2 = "Jogador 2";
    }

    if (
        selectedColors[1]
        === selectedColors[2]
    ) {

        setupError.textContent =
            "Escolha uma cor diferente para cada jogador.";

        return;

    }

    playerSettings = {

        1: {
            name: name1,
            color: selectedColors[1]
        },

        2: {
            name: name2,
            color: selectedColors[2]
        }

    };

    totalMatches =
        selectedMatches;

    currentMatch =
        1;

    score = {

        player1: 0,
        player2: 0,
        draws: 0

    };

    clearConfetti();

    applyPlayerColors();

    setupScreen.style.display =
        "none";

    gameContainer.style.display =
        "block";

    updateScoreboard();

    initGame();

}


/* ==================================================
   ATUALIZAR PLACAR
================================================== */

function updateScoreboard() {

    scorePlayer1Name.textContent =
        playerSettings[1].name;

    scorePlayer2Name.textContent =
        playerSettings[2].name;

    player1Wins.textContent =
        `${score.player1} VITÓRIA${score.player1 === 1 ? "" : "S"}`;

    player2Wins.textContent =
        `${score.player2} VITÓRIA${score.player2 === 1 ? "" : "S"}`;

    drawWins.textContent =
        score.draws;

    player1ScoreBall.className =
        "score-ball";

    player1ScoreBall.classList.add(
        playerSettings[1].color
    );

    player2ScoreBall.className =
        "score-ball";

    player2ScoreBall.classList.add(
        playerSettings[2].color
    );

    const p1 =
        colorData[
            playerSettings[1].color
        ];

    const p2 =
        colorData[
            playerSettings[2].color
        ];

    player1Score.style.borderColor =
        p1.main;

    player2Score.style.borderColor =
        p2.main;

    currentMatchElement.textContent =
        currentMatch;

    totalMatchesElement.textContent =
        totalMatches;

}


/* ==================================================
   INICIAR PARTIDA
================================================== */

function initGame() {

    clearTimeout(botTimer);
    botTimer = null;
    botThinking = false;
    botExecuting = false;

    clearTimeout(
        victoryTimeout
    );

    victoryTimeout =
        null;

    applyPlayerColors();

    boardState =
        Array.from(
            { length: ROWS },
            () =>
                Array(COLS).fill(0)
        );

    currentPlayer =
        1;

    currentColumn =
        3;

    gameActive =
        true;

    pieceFalling =
        false;

    boardFlipped =
        false;

    frozenColumns =
        Array(COLS).fill(0);

    powers = {

        1: {
            bomb: true,
            flip: true,
            ice: true,
            electric: true
        },

        2: {
            bomb: true,
            flip: true,
            ice: true,
            electric: true
        }

    };

    clearDanger();
    clearConfetti();

    resultOverlay.style.display =
        "none";

    popupHomeBtn.style.display =
        "block";

    popupResetBtn.style.display =
        "block";

    boardElement.classList.remove(
        "victory-sequence",
        "victory-active"
    );

    boardElement.innerHTML =
        "";

    createBoard();

    updateScoreboard();

    updateStatus();

    updatePowerButtons();

    updateSelector();

    powerHelp.textContent =
        "Q W E R usam habilidades • ESPAÇO solta a peça";

}


/* ==================================================
   CRIAR TABULEIRO
================================================== */

function createBoard() {

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            const cell =
                document.createElement(
                    "div"
                );

            cell.classList.add(
                "cell"
            );

            cell.dataset.row =
                row;

            cell.dataset.col =
                col;

            boardElement.appendChild(
                cell
            );

        }

    }

    renderBoard();

}


/* ==================================================
   RENDERIZAR
================================================== */

function renderBoard() {

    const cells =
        document.querySelectorAll(
            ".cell"
        );

    cells.forEach(cell => {

        const row =
            Number(
                cell.dataset.row
            );

        const col =
            Number(
                cell.dataset.col
            );

        cell.className =
            "cell";

        if (
            boardState[row][col]
            === 1
        ) {

            cell.classList.add(
                "player1"
            );

        }

        if (
            boardState[row][col]
            === 2
        ) {

            cell.classList.add(
                "player2"
            );

        }

        if (
            frozenColumns[col]
            > 0
        ) {

            cell.classList.add(
                "frozen"
            );

        }

        if (
            col === currentColumn
        ) {

            cell.classList.add(
                "selected-column"
            );

        }

    });

    highlightDangerCells();

}


/* ==================================================
   ATUALIZAR SELETOR
================================================== */

function updateSelector() {

    if (
        !boardElement.clientWidth
    ) {

        return;

    }

    const boardWidth =
        boardElement.clientWidth;

    const padding =
        parseFloat(
            getComputedStyle(
                boardElement
            ).paddingLeft
        );

    const gap =
        parseFloat(
            getComputedStyle(
                boardElement
            ).columnGap
        );

    const innerWidth =
        boardWidth -
        padding * 2;

    const cellWidth =
        (
            innerWidth -
            gap * (COLS - 1)
        ) / COLS;

    const centerX =
        padding +
        currentColumn *
            (cellWidth + gap) +
        cellWidth / 2;

    const pieceWidth =
        floatingPiece.offsetWidth;

    floatingPiece.style.left =
        `${centerX - pieceWidth / 2}px`;

    const indicatorWidth =
        columnIndicator.offsetWidth;

    columnIndicator.style.left =
        `${centerX - indicatorWidth / 2}px`;

    floatingPiece.classList.remove(
        "player1-piece",
        "player2-piece"
    );

    if (
        currentPlayer === 1
    ) {

        floatingPiece.classList.add(
            "player1-piece"
        );

    }

    else {

        floatingPiece.classList.add(
            "player2-piece"
        );

    }

    document
        .querySelectorAll(".cell")
        .forEach(cell => {

            cell.classList.remove(
                "selected-column"
            );

            if (
                Number(
                    cell.dataset.col
                )
                === currentColumn
            ) {

                cell.classList.add(
                    "selected-column"
                );

            }

        });

    const currentColor =
        colorData[
            playerSettings[currentPlayer].color
        ];

    if (currentColor) {

        columnIndicator.style.color =
            currentColor.main;

        columnIndicator.style.textShadow =
            `0 0 9px ${currentColor.glow}`;

    }

}


/* ==================================================
   STATUS
================================================== */

function updateStatus() {

    if (!gameActive) {
        return;
    }

    playerNumElement.textContent =
        playerSettings[currentPlayer].name;

    statusElement.classList.remove(
        "player1-turn",
        "player2-turn"
    );

    if (
        currentPlayer === 1
    ) {

        statusElement.classList.add(
            "player1-turn"
        );

    }

    else {

        statusElement.classList.add(
            "player2-turn"
        );

    }

    updateBoardColor();

    updateSelector();

}


/* ==================================================
   MOVIMENTO
================================================== */

function moveLeft() {

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4Online.canAct()
    ) {
        return;
    }

    if (
        !gameActive ||
        pieceFalling
    ) {
        return;
    }

    currentColumn--;

    if (
        currentColumn < 0
    ) {

        currentColumn =
            COLS - 1;

    }

    updateSelector();

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4OnlineApplying
    ) {
        window.Lig4Online.publishGameState();
    }

}


function moveRight() {

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4Online.canAct()
    ) {
        return;
    }

    if (
        !gameActive ||
        pieceFalling
    ) {
        return;
    }

    currentColumn++;

    if (
        currentColumn >= COLS
    ) {

        currentColumn =
            0;

    }

    updateSelector();

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4OnlineApplying
    ) {
        window.Lig4Online.publishGameState();
    }

}


/* ==================================================
   SOLTAR PEÇA
================================================== */

function dropPiece(fromBot = false) {

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4Online.canAct()
    ) {
        return;
    }

    if (
        gameMode === "singleplayer" &&
        currentPlayer === 2 &&
        !fromBot
    ) {
        return;
    }

    if (
        !gameActive ||
        pieceFalling
    ) {
        return;
    }

    if (
        frozenColumns[currentColumn]
        > 0
    ) {

        powerHelp.textContent =
            "Essa coluna está congelada! O adversário não pode jogar nela.";

        return;

    }

    const targetRow =
        getAvailableRow(
            currentColumn
        );

    if (
        targetRow === -1
    ) {

        powerHelp.textContent =
            "Essa coluna está cheia!";

        return;

    }

    pieceFalling =
        true;

    const cells =
        document.querySelectorAll(
            ".cell"
        );

    const targetCell =
        Array.from(cells).find(
            cell =>
                Number(
                    cell.dataset.row
                ) === targetRow
                &&
                Number(
                    cell.dataset.col
                ) === currentColumn
        );

    if (!targetCell) {

        pieceFalling =
            false;

        return;

    }

    const areaRect =
        boardArea.getBoundingClientRect();

    const cellRect =
        targetCell.getBoundingClientRect();

    const targetTop =
        cellRect.top -
        areaRect.top;

    floatingPiece.classList.add(
        "falling"
    );

    floatingPiece.style.top =
        `${targetTop}px`;

    setTimeout(() => {

        boardState[targetRow][currentColumn] =
            currentPlayer;

        floatingPiece.classList.remove(
            "falling"
        );

        floatingPiece.style.top =
            "5px";

        pieceFalling =
            false;

        decreaseFrozenColumns();

        renderBoard();

        const winningLine =
            findWinningLine(
                targetRow,
                currentColumn
            );

        if (
            winningLine
        ) {

            showWinningSequence(
                currentPlayer,
                winningLine
            );

            return;

        }

        if (
            checkDraw()
        ) {

            showResult(
                "draw"
            );

            return;

        }

        nextTurn();

    }, DROP_TIME);

}


/* ==================================================
   LINHA DISPONÍVEL
================================================== */

function getAvailableRow(col) {

    if (
        frozenColumns[col]
        > 0
    ) {

        return -1;

    }

    /*
       IMPORTANTE:

       Uma nova peça SEMPRE cai para o
       fundo visual do tabuleiro.

       Portanto, mesmo quando o tabuleiro
       está invertido, procuramos a primeira
       posição livre começando de baixo.

       A gravidade da BOMBA continua sendo
       controlada separadamente por
       applyGravity().
    */

    for (
        let row = ROWS - 1;
        row >= 0;
        row--
    ) {

        if (
            boardState[row][col]
            === 0
        ) {

            return row;

        }

    }

    return -1;

}


/* ==================================================
   PRÓXIMO TURNO
================================================== */

function nextTurn() {

    currentPlayer =
        currentPlayer === 1
            ? 2
            : 1;

    updateStatus();

    updatePowerButtons();

    checkDanger();

    if (
        gameMode === "singleplayer" &&
        currentPlayer === 2
    ) {
        scheduleBotTurn();
    }

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4OnlineApplying
    ) {
        window.Lig4Online.publishGameState();
    }

}


/* ==================================================
   GELO
================================================== */

function decreaseFrozenColumns() {

    for (
        let col = 0;
        col < COLS;
        col++
    ) {

        if (
            frozenColumns[col]
            > 0
        ) {

            frozenColumns[col]--;

        }

    }

}


/* ==================================================
   ENCONTRAR LINHA VENCEDORA
================================================== */

function findWinningLine(row, col) {

    const player =
        boardState[row][col];

    if (
        player === 0
    ) {

        return null;

    }

    const directions = [

        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]

    ];

    for (
        const [dr, dc]
        of directions
    ) {

        const line = [
            {
                row,
                col
            }
        ];

        let r =
            row + dr;

        let c =
            col + dc;

        while (

            r >= 0 &&
            r < ROWS &&
            c >= 0 &&
            c < COLS &&
            boardState[r][c] === player

        ) {

            line.push({
                row: r,
                col: c
            });

            r += dr;
            c += dc;

        }

        r =
            row - dr;

        c =
            col - dc;

        while (

            r >= 0 &&
            r < ROWS &&
            c >= 0 &&
            c < COLS &&
            boardState[r][c] === player

        ) {

            line.unshift({
                row: r,
                col: c
            });

            r -= dr;
            c -= dc;

        }

        if (
            line.length >= 4
        ) {

            const centerIndex =
                line.findIndex(
                    item =>
                        item.row === row &&
                        item.col === col
                );

            const start =
                Math.max(
                    0,
                    Math.min(
                        centerIndex - 3,
                        line.length - 4
                    )
                );

            return line.slice(
                start,
                start + 4
            );

        }

    }

    return null;

}


/* ==================================================
   VERIFICAR VITÓRIA
================================================== */

function checkWin(row, col) {

    return !!findWinningLine(
        row,
        col
    );

}


/* ==================================================
   EFEITO DE VITÓRIA
================================================== */

function showWinningSequence(
    player,
    winningLine
) {

    gameActive =
        false;

    pieceFalling =
        false;

    clearDanger();

    clearConfetti();

    clearTimeout(
        victoryTimeout
    );

    boardElement.classList.remove(
        "victory-sequence"
    );

    boardElement.classList.add(
        "victory-active"
    );

    const cells =
        document.querySelectorAll(
            ".cell"
        );

    cells.forEach(cell => {

        cell.classList.remove(
            "winning-piece",
            "victory-dimmed"
        );

    });

    cells.forEach(cell => {

        const row =
            Number(
                cell.dataset.row
            );

        const col =
            Number(
                cell.dataset.col
            );

        if (
            boardState[row][col]
            !== 0
        ) {

            cell.classList.add(
                "victory-dimmed"
            );

        }

    });

    winningLine.forEach(position => {

        const cell =
            document.querySelector(
                `[data-row="${position.row}"][data-col="${position.col}"]`
            );

        if (!cell) {
            return;
        }

        cell.classList.remove(
            "victory-dimmed"
        );

        cell.classList.add(
            "winning-piece"
        );

    });

    victoryTimeout =
        setTimeout(() => {

            cells.forEach(cell => {

                cell.classList.remove(
                    "winning-piece",
                    "victory-dimmed"
                );

            });

            boardElement.classList.remove(
                "victory-active"
            );

            victoryTimeout =
                null;

            showResult(
                "win",
                player
            );

        }, 2000);

}


/* ==================================================
   EMPATE
================================================== */

function checkDraw() {

    return boardState.every(
        row =>
            row.every(
                cell =>
                    cell !== 0
            )
    );

}


/* ==================================================
   CONFETES
================================================== */

function createConfetti() {

    clearConfetti();

    const confettiCount =
        120;

    const colors = [

        "#168cff",
        "#ff3b3b",
        "#ffd000",
        "#20b94b",
        "#8e44d6",
        "#ff8c18",
        "#8b5a2b",
        "#ffffff"

    ];

    for (
        let i = 0;
        i < confettiCount;
        i++
    ) {

        const piece =
            document.createElement(
                "div"
            );

        piece.className =
            "confetti";

        piece.style.left =
            `${Math.random() * 100}%`;

        piece.style.width =
            `${5 + Math.random() * 7}px`;

        piece.style.height =
            `${8 + Math.random() * 10}px`;

        piece.style.background =
            colors[
                Math.floor(
                    Math.random() *
                    colors.length
                )
            ];

        piece.style.animationDuration =
            `${2.5 + Math.random() * 2.5}s`;

        piece.style.animationDelay =
            `${Math.random() * .8}s`;

        piece.style.transform =
            `rotate(${Math.random() * 360}deg)`;

        confettiContainer.appendChild(
            piece
        );

    }

}


function clearConfetti() {

    if (confettiContainer) {

        confettiContainer.innerHTML =
            "";

    }

}


/* ==================================================
   MOSTRAR RESULTADO
================================================== */

function showResult(
    type,
    player
) {

    gameActive =
        false;

    clearDanger();

    clearConfetti();

    boardElement.classList.remove(
        "victory-active",
        "victory-sequence"
    );

    const isLastMatch =
        currentMatch >= totalMatches;

    if (
        type === "win"
    ) {

        if (
            player === 1
        ) {

            score.player1++;

        }

        else {

            score.player2++;

        }

        updateScoreboard();

        resultIcon.textContent =
            "🏆";

        if (isLastMatch) {

            resultMessage.textContent =
                `Parabéns ${playerSettings[player].name}, você mostrou quem é que manda!`;

        }

        else {

            resultMessage.textContent =
                `${playerSettings[player].name} venceu!`;

        }

        resultDescription.textContent =
            "";

        const winnerColor =
            colorData[
                playerSettings[player].color
            ];

        resultBox.style.borderColor =
            winnerColor.main;

        resultBox.style.boxShadow =
            `0 0 30px ${winnerColor.glow},
             0 15px 40px rgba(0,0,0,.7)`;

        popupResetBtn.style.background =
            winnerColor.main;

        if (isLastMatch) {

            createConfetti();

            popupResetBtn.style.display =
                "block";

            popupHomeBtn.style.display =
                "block";

            popupHomeBtn.style.background =
                "#273b5b";

        }

        else {

            popupResetBtn.style.display =
                "block";

            popupHomeBtn.style.display =
                "none";

        }

    }

    else {

        score.draws++;

        updateScoreboard();

        resultIcon.textContent =
            "🤝";

        resultMessage.textContent =
            "Empate!";

        resultDescription.textContent =
            "";

        resultBox.style.borderColor =
            "#ffffff";

        resultBox.style.boxShadow =
            "0 0 30px rgba(255,255,255,.3), 0 15px 40px rgba(0,0,0,.7)";

        popupResetBtn.style.background =
            "#465775";

        if (isLastMatch) {

            clearConfetti();

            popupResetBtn.style.display =
                "block";

            popupHomeBtn.style.display =
                "block";

            popupHomeBtn.style.background =
                "#465775";

        }

        else {

            popupResetBtn.style.display =
                "block";

            popupHomeBtn.style.display =
                "none";

        }

    }

    resultOverlay.style.display =
        "flex";

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4OnlineApplying
    ) {
        window.Lig4Online.publishResult(type, player);
    }

}


/* ==================================================
   JOGADA VENCEDORA
================================================== */

function hasWinningMove(player) {

    for (
        let col = 0;
        col < COLS;
        col++
    ) {

        if (
            frozenColumns[col]
            > 0
        ) {

            continue;

        }

        const row =
            getAvailableRow(col);

        if (
            row === -1
        ) {

            continue;

        }

        boardState[row][col] =
            player;

        const wins =
            checkWin(
                row,
                col
            );

        boardState[row][col] =
            0;

        if (wins) {

            return {
                row,
                col
            };

        }

    }

    return null;

}


/* ==================================================
   PERIGO
================================================== */

function checkDanger() {

    if (!gameActive) {
        return;
    }

    const opponent =
        currentPlayer === 1
            ? 2
            : 1;

    const threat =
        hasWinningMove(
            opponent
        );

    if (threat) {

        showDanger(
            opponent,
            threat
        );

    }

    else {

        clearDanger();

    }

}


/* ==================================================
   MOSTRAR PERIGO
================================================== */

function showDanger(
    opponent,
    threat
) {

    clearTimeout(
        dangerTimeout
    );

    dangerText.textContent =
        `${playerSettings[opponent].name} pode vencer na próxima jogada!`;

    dangerWarning.classList.add(
        "active"
    );

    const duration =
        7000;

    dangerTimerBar.style.transition =
        "none";

    dangerTimerBar.style.width =
        "100%";

    requestAnimationFrame(() => {

        dangerTimerBar.style.transition =
            `width ${duration}ms linear`;

        dangerTimerBar.style.width =
            "0%";

    });

    dangerTimeout =
        setTimeout(() => {

            dangerWarning.classList.remove(
                "active"
            );

        }, duration);

    highlightThreat(
        threat
    );

}


/* ==================================================
   LIMPAR PERIGO
================================================== */

function clearDanger() {

    clearTimeout(
        dangerTimeout
    );

    dangerWarning.classList.remove(
        "active"
    );

    if (
        dangerTimerBar
    ) {

        dangerTimerBar.style.transition =
            "none";

        dangerTimerBar.style.width =
            "100%";

    }

    document
        .querySelectorAll(".cell")
        .forEach(cell => {

            cell.classList.remove(
                "danger"
            );

        });

}


/* ==================================================
   DESTACAR AMEAÇA
================================================== */

function highlightThreat(
    threat
) {

    document
        .querySelectorAll(".cell")
        .forEach(cell => {

            cell.classList.remove(
                "danger"
            );

        });

    if (!threat) {
        return;
    }

    const cell =
        document.querySelector(
            `[data-row="${threat.row}"][data-col="${threat.col}"]`
        );

    if (cell) {

        cell.classList.add(
            "danger"
        );

    }

}


/* ==================================================
   DESTACAR PERIGO
================================================== */

function highlightDangerCells() {

    document
        .querySelectorAll(".cell")
        .forEach(cell => {

            cell.classList.remove(
                "danger"
            );

        });

    if (!gameActive) {
        return;
    }

    const opponent =
        currentPlayer === 1
            ? 2
            : 1;

    const threat =
        hasWinningMove(
            opponent
        );

    if (threat) {

        highlightThreat(
            threat
        );

    }

}


/* ==================================================
   HABILIDADES
================================================== */

document
    .querySelectorAll(".power-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                if (pieceFalling) {
                    return;
                }

                const power =
                    button.dataset.power;

                usePower(
                    power
                );

            }
        );

    });


function usePower(power) {

    if (
        gameMode === "online" &&
        window.Lig4Online &&
        !window.Lig4Online.canAct()
    ) {
        return;
    }

    if (
        !gameActive ||
        pieceFalling
    ) {

        return;

    }

    if (
        !powers[currentPlayer][power]
    ) {

        powerHelp.textContent =
            "Você já usou essa habilidade!";

        return;

    }

    const opponent =
        currentPlayer === 1
            ? 2
            : 1;

    const threat =
        hasWinningMove(
            opponent
        );

    if (!threat) {

        powerHelp.textContent =
            "Guarde suas habilidades para uma situação de perigo!";

        return;

    }

    powers[currentPlayer][power] =
        false;

    updatePowerButtons();

    switch (power) {

        case "bomb":
            useBomb(threat);
            break;

        case "flip":
            useFlip();
            break;

        case "ice":
            useIce(threat.col);
            break;

        case "electric":
            useElectric(threat);
            break;

    }

}


/* ==================================================
   BOMBA
================================================== */

function useBomb(threat) {

    const centerRow =
        threat.row;

    const centerCol =
        threat.col;

    const opponent =
        currentPlayer === 1
            ? 2
            : 1;

    let removed =
        0;

    for (
        let radius = 0;
        radius <= 1;
        radius++
    ) {

        for (
            let row =
                centerRow - radius;

            row <=
                centerRow + radius;

            row++
        ) {

            for (
                let col =
                    centerCol - radius;

                col <=
                centerCol + radius;

                col++
            ) {

                if (

                    row < 0 ||
                    row >= ROWS ||
                    col < 0 ||
                    col >= COLS

                ) {

                    continue;

                }

                if (

                    boardState[row][col]
                        === opponent &&

                    removed < 3

                ) {

                    boardState[row][col] =
                        0;

                    removed++;

                }

            }

        }

    }

    /*
       A bomba continua usando a gravidade
       de acordo com a orientação atual.
    */

    applyGravity();

    renderBoard();

    powerHelp.textContent =
        `BOOM! ${removed} peças removidas!`;

    finishPowerTurn();

}


/* ==================================================
   INVERTER
================================================== */

function useFlip() {

    boardElement.classList.add(
        "flipping"
    );

    setTimeout(() => {

        /*
           Gira o estado 180 graus.
        */

        boardState.reverse();

        boardState.forEach(
            row =>
                row.reverse()
        );

        /*
           As colunas congeladas também acompanham
           a rotação.
        */

        frozenColumns.reverse();

        /*
           A coluna selecionada acompanha
           a rotação horizontal.
        */

        currentColumn =
            COLS - 1 - currentColumn;

        /*
           Alterna a orientação.
        */

        boardFlipped =
            !boardFlipped;

        boardElement.classList.remove(
            "flipping"
        );

        renderBoard();

        updateSelector();

        powerHelp.textContent =
            "O tabuleiro foi invertido!";

        finishPowerTurn();

    }, 500);

}


/* ==================================================
   GELO
================================================== */

function useIce(col) {

    frozenColumns[col] =
        1;

    renderBoard();

    powerHelp.textContent =
        `Coluna ${col + 1} congelada! O adversário não poderá jogar nela neste turno.`;

    finishPowerTurn();

}


/* ==================================================
   ELÉTRICA
================================================== */

function useElectric(threat) {

    const opponent =
        currentPlayer === 1
            ? 2
            : 1;

    let changed =
        0;

    for (
        let row =
            threat.row - 1;

        row <=
            threat.row + 1;

        row++
    ) {

        for (
            let col =
                threat.col - 1;

            col <=
            threat.col + 1;

            col++
        ) {

            if (

                row < 0 ||
                row >= ROWS ||
                col < 0 ||
                col >= COLS

            ) {

                continue;

            }

            if (
                boardState[row][col]
                    === opponent
            ) {

                boardState[row][col] =
                    currentPlayer;

                changed++;

            }

        }

    }

    renderBoard();

    powerHelp.textContent =
        `${changed} peças foram eletrificadas!`;

    finishPowerTurn();

}


/* ==================================================
   GRAVIDADE
================================================== */

function applyGravity() {

    for (
        let col = 0;
        col < COLS;
        col++
    ) {

        const pieces = [];

        /*
           TABULEIRO NORMAL
        */

        if (!boardFlipped) {

            for (
                let row = ROWS - 1;
                row >= 0;
                row--
            ) {

                if (
                    boardState[row][col]
                    !== 0
                ) {

                    pieces.push(
                        boardState[row][col]
                    );

                }

            }

            for (
                let row = 0;
                row < ROWS;
                row++
            ) {

                boardState[row][col] =
                    0;

            }

            for (
                let i = 0;
                i < pieces.length;
                i++
            ) {

                boardState[
                    ROWS - 1 - i
                ][col] =
                    pieces[i];

            }

        }

        /*
           TABULEIRO INVERTIDO

           A bomba continua fazendo as peças
           obedecerem à orientação invertida.
        */

        else {

            for (
                let row = 0;
                row < ROWS;
                row++
            ) {

                if (
                    boardState[row][col]
                    !== 0
                ) {

                    pieces.push(
                        boardState[row][col]
                    );

                }

            }

            for (
                let row = 0;
                row < ROWS;
                row++
            ) {

                boardState[row][col] =
                    0;

            }

            for (
                let i = 0;
                i < pieces.length;
                i++
            ) {

                boardState[i][col] =
                    pieces[i];

            }

        }

    }

}


/* ==================================================
   FINALIZAR TURNO
================================================== */

function finishPowerTurn() {

    for (
        let row = 0;
        row < ROWS;
        row++
    ) {

        for (
            let col = 0;
            col < COLS;
            col++
        ) {

            if (
                boardState[row][col]
                    !== 0
            ) {

                const winningLine =
                    findWinningLine(
                        row,
                        col
                    );

                if (
                    winningLine
                ) {

                    showWinningSequence(
                        boardState[row][col],
                        winningLine
                    );

                    return;

                }

            }

        }

    }

    if (
        checkDraw()
    ) {

        showResult(
            "draw"
        );

        return;

    }

    nextTurn();

}


/* ==================================================
   BOTÕES DE HABILIDADES
================================================== */

function updatePowerButtons() {

    const names = [

        "bomb",
        "flip",
        "ice",
        "electric"

    ];

    names.forEach(power => {

        const button =
            document.getElementById(
                `power-${power}`
            );

        if (!button) {
            return;
        }

        button.classList.remove(
            "available",
            "used"
        );

        const count =
            button.querySelector(
                ".power-count"
            );

        if (count) {

            count.textContent =
                powers[currentPlayer][power]
                    ? "1"
                    : "0";

        }

        if (
            powers[currentPlayer][power]
        ) {

            button.classList.add(
                "available"
            );

        }

        else {

            button.classList.add(
                "used"
            );

        }

    });

}


/* ==================================================
   JOGAR NOVAMENTE
================================================== */

popupResetBtn.addEventListener(
    "click",
    () => {

        if (gameMode === "online" && window.Lig4Online) {
            window.Lig4Online.requestRematch();
            return;
        }

        clearTimeout(
            victoryTimeout
        );

        victoryTimeout =
            null;

        clearConfetti();

        if (
            currentMatch <
            totalMatches
        ) {

            currentMatch++;

            resultOverlay.style.display =
                "none";

            initGame();

            powerHelp.textContent =
                `Partida ${currentMatch} de ${totalMatches}!`;

            return;

        }

        score = {

            player1: 0,
            player2: 0,
            draws: 0

        };

        currentMatch =
            1;

        resultOverlay.style.display =
            "none";

        initGame();

        powerHelp.textContent =
            "Nova série iniciada!";

    }
);


/* ==================================================
   VOLTAR À TELA INICIAL
================================================== */

popupHomeBtn.addEventListener(
    "click",
    () => {
        if (gameMode === "online" && window.Lig4Online) {
            window.Lig4Online.leaveRoom();
            return;
        }
        goHome();
    }
);


function goHome() {

    clearTimeout(botTimer);
    botTimer = null;
    botThinking = false;
    botExecuting = false;

    clearTimeout(
        victoryTimeout
    );

    victoryTimeout =
        null;

    clearConfetti();

    clearDanger();

    resultOverlay.style.display =
        "none";

    boardElement.classList.remove(
        "victory-active",
        "victory-sequence"
    );

    gameActive =
        false;

    boardFlipped =
        false;

    gameContainer.style.display =
        "none";

    /*
       A tela de configuração só pode ser aberta
       através do botão JOGO LOCAL.
       Ao voltar para a tela inicial, retorna para
       a seleção de modo, e não para a configuração.
    */
    if (setupScreen) {
        setupScreen.style.display =
            "none";
    }

    if (modeScreen) {
        modeScreen.style.display =
            "flex";
    }

    player1NameInput.value =
        playerSettings[1].name;

    player2NameInput.value =
        playerSettings[2].name;

    selectedColors[1] =
        playerSettings[1].color;

    selectedColors[2] =
        playerSettings[2].color;

    selectedMatches =
        1;

    document
        .querySelectorAll(
            ".match-option"
        )
        .forEach(button => {

            button.classList.remove(
                "selected"
            );

        });

    const firstOption =
        document.querySelector(
            '.match-option[data-matches="1"]'
        );

    if (firstOption) {

        firstOption.classList.add(
            "selected"
        );

    }

    updateColorSelection();

    setupError.textContent =
        "";

}


/* ==================================================
   BOTÃO RESETAR
================================================== */

resetBtn.addEventListener(
    "click",
    () => {

        clearTimeout(
            victoryTimeout
        );

        victoryTimeout =
            null;

        clearConfetti();

        score = {

            player1: 0,
            player2: 0,
            draws: 0

        };

        currentMatch =
            1;

        initGame();

    }
);


/* ==================================================
   SAIR DA PARTIDA
================================================== */

exitMatchBtn?.addEventListener(
    "click",
    () => {

        if (gameMode === "online" && window.Lig4Online) {
            window.Lig4Online.leaveRoom();
            return;
        }

        goHome();

    }
);


/* ==================================================
   TECLADO
================================================== */

document.addEventListener(
    "keydown",
    event => {

        if (
            introScreen &&
            introScreen.style.display !== "none"
        ) {

            showModeScreen();

            return;

        }

        if (
            modeScreen &&
            modeScreen.style.display !== "none"
        ) {

            return;

        }

        const activeElement =
            document.activeElement;

        const typing =
            activeElement &&
            (
                activeElement.tagName
                    === "INPUT" ||
                activeElement.tagName
                    === "TEXTAREA"
            );

        if (typing) {

            if (
                event.code === "Enter"
            ) {

                event.preventDefault();

            }

            return;

        }

        if (
            event.code === "Enter"
        ) {

            event.preventDefault();

            if (
                setupScreen.style.display
                !== "none"
            ) {

                startSeries();

                return;

            }

            if (gameActive) {

                clearTimeout(
                    victoryTimeout
                );

                victoryTimeout =
                    null;

                clearConfetti();

                score = {

                    player1: 0,
                    player2: 0,
                    draws: 0

                };

                currentMatch =
                    1;

                initGame();

            }

            return;

        }

        if (
            event.code === "Space"
        ) {

            event.preventDefault();

            dropPiece();

            return;

        }

        if (

            event.code === "ArrowLeft" ||
            event.code === "KeyA"

        ) {

            event.preventDefault();

            moveLeft();

            return;

        }

        if (

            event.code === "ArrowRight" ||
            event.code === "KeyD"

        ) {

            event.preventDefault();

            moveRight();

            return;

        }

        if (
            event.code === "KeyQ"
        ) {

            event.preventDefault();

            usePower("bomb");

            return;

        }

        if (
            event.code === "KeyW"
        ) {

            event.preventDefault();

            usePower("flip");

            return;

        }

        if (
            event.code === "KeyE"
        ) {

            event.preventDefault();

            usePower("ice");

            return;

        }

        if (
            event.code === "KeyR"
        ) {

            event.preventDefault();

            usePower("electric");

            return;

        }

    }
);


/* ==================================================
   BOT SINGLEPLAYER — ADICIONADO SEM ALTERAR O JOGO LOCAL
================================================== */

function isBotTurn() {
    return (
        gameMode === "singleplayer" &&
        currentPlayer === 2 &&
        gameActive
    );
}

function scheduleBotTurn() {
    if (!isBotTurn() || botThinking) return;

    clearTimeout(botTimer);
    botThinking = true;
    powerHelp.textContent =
        `Bot (${botDifficultyLabel()}) está pensando...`;

    const delay =
        botDifficulty === "beginner" ? 450 :
        botDifficulty === "intermediate" ? 700 :
        950;

    botTimer = setTimeout(() => {
        botThinking = false;

        if (!isBotTurn()) return;

        const power = chooseBotPower();
        if (power) {
            botExecuting = true;
            usePower(power);
            botExecuting = false;
            return;
        }

        makeBotMove();
    }, delay);
}

function makeBotMove() {
    if (!isBotTurn()) return;

    const column = chooseBotColumn();
    currentColumn = column;
    updateSelector();

    setTimeout(() => {
        if (!isBotTurn()) return;
        botExecuting = true;
        dropPiece(true);
        botExecuting = false;
    }, 220);
}

function botDifficultyLabel() {
    if (botDifficulty === "beginner") return "Iniciante";
    if (botDifficulty === "intermediate") return "Intermediário";
    return "Muito difícil";
}

function getBotValidColumns(state = boardState) {
    const valid = [];

    for (let col = 0; col < COLS; col++) {
        if (frozenColumns[col] > 0) continue;

        for (let row = ROWS - 1; row >= 0; row--) {
            if (state[row][col] === 0) {
                valid.push(col);
                break;
            }
        }
    }

    return valid;
}

function simulateBotColumn(state, col, player) {
    const copy = state.map(row => [...row]);

    for (let row = ROWS - 1; row >= 0; row--) {
        if (copy[row][col] === 0) {
            copy[row][col] = player;
            return { state: copy, row };
        }
    }

    return null;
}

function hasFourInBotState(state, row, col, player) {
    const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1]
    ];

    for (const [dr, dc] of directions) {
        let count = 1;

        for (const sign of [-1, 1]) {
            let r = row + dr * sign;
            let c = col + dc * sign;

            while (
                r >= 0 && r < ROWS &&
                c >= 0 && c < COLS &&
                state[r][c] === player
            ) {
                count++;
                r += dr * sign;
                c += dc * sign;
            }
        }

        if (count >= 4) return true;
    }

    return false;
}

function findBotWinningColumn(player) {
    for (const col of getBotValidColumns()) {
        const result = simulateBotColumn(boardState, col, player);
        if (
            result &&
            hasFourInBotState(result.state, result.row, col, player)
        ) {
            return col;
        }
    }

    return null;
}

function scoreBotPosition(state) {
    const bot = 2;
    const human = 1;
    let scoreValue = 0;
    const center = Math.floor(COLS / 2);

    for (let row = 0; row < ROWS; row++) {
        if (state[row][center] === bot) scoreValue += 4;
        if (state[row][center] === human) scoreValue -= 3;
    }

    const windowScore = values => {
        const mine = values.filter(v => v === bot).length;
        const theirs = values.filter(v => v === human).length;
        const empty = values.filter(v => v === 0).length;

        if (mine === 4) return 10000;
        if (mine === 3 && empty === 1) return 90;
        if (mine === 2 && empty === 2) return 18;
        if (theirs === 3 && empty === 1) return -120;
        if (theirs === 2 && empty === 2) return -14;
        return 0;
    };

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            scoreValue += windowScore([
                state[row][col],
                state[row][col + 1],
                state[row][col + 2],
                state[row][col + 3]
            ]);
        }
    }

    for (let row = 0; row <= ROWS - 4; row++) {
        for (let col = 0; col < COLS; col++) {
            scoreValue += windowScore([
                state[row][col],
                state[row + 1][col],
                state[row + 2][col],
                state[row + 3][col]
            ]);
        }
    }

    for (let row = 0; row <= ROWS - 4; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            scoreValue += windowScore([
                state[row][col],
                state[row + 1][col + 1],
                state[row + 2][col + 2],
                state[row + 3][col + 3]
            ]);
        }
    }

    for (let row = 3; row < ROWS; row++) {
        for (let col = 0; col <= COLS - 4; col++) {
            scoreValue += windowScore([
                state[row][col],
                state[row - 1][col + 1],
                state[row - 2][col + 2],
                state[row - 3][col + 3]
            ]);
        }
    }

    return scoreValue;
}

function botMinimax(state, depth, maximizing, alpha, beta) {
    const valid = getBotValidColumns(state);

    if (depth === 0 || valid.length === 0) {
        return {
            score: scoreBotPosition(state),
            col: valid[0] ?? 3
        };
    }

    if (maximizing) {
        let best = { score: -Infinity, col: valid[0] };

        for (const col of valid) {
            const move = simulateBotColumn(state, col, 2);
            if (!move) continue;

            if (hasFourInBotState(move.state, move.row, col, 2)) {
                return { score: 100000 + depth, col };
            }

            const result = botMinimax(
                move.state,
                depth - 1,
                false,
                alpha,
                beta
            );

            if (result.score > best.score) {
                best = { score: result.score, col };
            }

            alpha = Math.max(alpha, best.score);
            if (beta <= alpha) break;
        }

        return best;
    }

    let best = { score: Infinity, col: valid[0] };

    for (const col of valid) {
        const move = simulateBotColumn(state, col, 1);
        if (!move) continue;

        if (hasFourInBotState(move.state, move.row, col, 1)) {
            return { score: -100000 - depth, col };
        }

        const result = botMinimax(
            move.state,
            depth - 1,
            true,
            alpha,
            beta
        );

        if (result.score < best.score) {
            best = { score: result.score, col };
        }

        beta = Math.min(beta, best.score);
        if (beta <= alpha) break;
    }

    return best;
}

function chooseBotColumn() {
    const valid = getBotValidColumns();
    if (!valid.length) return 3;

    const winning = findBotWinningColumn(2);
    if (winning !== null) return winning;

    const block = findBotWinningColumn(1);

    if (botDifficulty === "beginner") {
        /* Iniciante: aleatório, mas tenta ganhar quando percebe a chance. */
        if (winning !== null) return winning;
        return valid[Math.floor(Math.random() * valid.length)];
    }

    if (botDifficulty === "intermediate") {
        if (block !== null) return block;

        let bestCol = valid[0];
        let bestScore = -Infinity;

        for (const col of valid) {
            const move = simulateBotColumn(boardState, col, 2);
            if (!move) continue;

            const value = scoreBotPosition(move.state);
            if (value > bestScore) {
                bestScore = value;
                bestCol = col;
            }
        }

        return bestCol;
    }

    if (block !== null) return block;

    return botMinimax(
        boardState,
        4,
        true,
        -Infinity,
        Infinity
    ).col;
}

function chooseBotPower() {
    if (!isBotTurn()) return null;

    const humanThreat = hasWinningMove(1);
    if (!humanThreat) return null;

    const available = ["bomb", "flip", "ice", "electric"]
        .filter(power => powers[2][power]);

    if (!available.length) return null;

    /* O Bot usa uma habilidade defensiva ocasionalmente; a jogada normal continua sendo o padrão. */
    const chance = botDifficulty === "advanced" ? 0.45 :
                   botDifficulty === "intermediate" ? 0.30 : 0.18;

    if (Math.random() > chance) return null;

    return available[Math.floor(Math.random() * available.length)];
}

/* ==================================================
   RESPONSIVIDADE
================================================== */

window.addEventListener(
    "resize",
    () => {

        updateSelector();

    }
);


/* ==================================================
   INICIALIZAÇÃO
================================================== */

gameContainer.style.display =
    "none";

setupScreen.style.display =
    "none";

if (modeScreen) {

    modeScreen.style.display =
        "none";

}

if (singleplayerScreen) {

    singleplayerScreen.style.display =
        "none";

}

if (onlineScreen) {

    onlineScreen.style.display =
        "none";

}

if (introScreen) {

    introScreen.style.display =
        "flex";

}

addVictoryStyles();

updateColorSelection();

/* ==================================================
   PONTE DO JOGO COM O MODO ONLINE
================================================== */
window.Lig4Game = {
    returnToMode() {
        clearTimeout(victoryTimeout);
        victoryTimeout = null;
        clearConfetti();
        clearDanger();
        resultOverlay.style.display = "none";
        gameActive = false;
        gameContainer.style.display = "none";
        showModeScreen();
    },
    startOnlineMatch(settings) {
        gameMode = "online";
        clearTimeout(botTimer); botTimer=null; botThinking=false; botExecuting=false;
        playerSettings = {1:{name:settings.player1.name,color:settings.player1.color},2:{name:settings.player2.name,color:settings.player2.color}};
        totalMatches=Number(settings.totalMatches)||1; currentMatch=Number(settings.currentMatch)||1;
        score={player1:Number(settings.score?.player1)||0,player2:Number(settings.score?.player2)||0,draws:Number(settings.score?.draws)||0};
        clearConfetti(); applyPlayerColors(); hideAllMenuScreens(); gameContainer.style.display="block"; initGame();
    },
    selectOnlineColumn(col) {
        // No Online, somente o jogador da vez pode controlar
        // a posição da peça. A posição do adversário chega
        // pelo Firebase e é aplicada por applyOnlineState().
        if (
            window.Lig4Online &&
            !window.Lig4Online.canAct()
        ) {
            return;
        }

        if (Number.isFinite(Number(col))) {
            currentColumn = Math.max(0, Math.min(COLS - 1, Number(col)));
            window.__lig4CurrentColumnForTouch = currentColumn;
            updateSelector();
        }
    },
    dropOnlinePiece() {
        dropPiece();
    },

    applyOnlineState(state) {
        if(!state)return; window.Lig4OnlineApplying=true;
        try {
            if(state.board) boardState=state.board.map(row=>row.map(Number));
            if(Array.isArray(state.frozenColumns)) frozenColumns=state.frozenColumns.map(Number);
            if(state.powers) powers={1:{...powers[1],...(state.powers[1]||{})},2:{...powers[2],...(state.powers[2]||{})}};
            currentPlayer=Number(state.currentPlayer)||1;
            if (Number.isFinite(Number(state.currentColumn))) {
                currentColumn=Math.max(0, Math.min(COLS - 1, Number(state.currentColumn)));
                window.__lig4CurrentColumnForTouch=currentColumn;
            }
            boardFlipped=!!state.boardFlipped; gameActive=state.gameActive!==false; pieceFalling=false;
            if(state.currentMatch) currentMatch=Number(state.currentMatch);
            if(state.score) score={player1:Number(state.score.player1)||0,player2:Number(state.score.player2)||0,draws:Number(state.score.draws)||0};
            applyPlayerColors(); updateScoreboard(); renderBoard(); updateStatus(); updatePowerButtons(); updateSelector();
            if(state.phase==="playing") resultOverlay.style.display="none";
        } finally { window.Lig4OnlineApplying=false; }
    },
    showOnlineResult(result,remoteScore) {
        window.Lig4OnlineApplying=true;
        try {
            gameActive=false; pieceFalling=false; clearDanger(); clearConfetti(); boardElement.classList.remove("victory-active","victory-sequence");
            if(remoteScore) score={player1:Number(remoteScore.player1)||0,player2:Number(remoteScore.player2)||0,draws:Number(remoteScore.draws)||0};
            updateScoreboard();
            if(result.type==="draw") { resultIcon.textContent="🤝"; resultMessage.textContent="Empate!"; resultDescription.textContent=""; resultBox.style.borderColor="#fff"; resultBox.style.boxShadow="0 0 30px rgba(255,255,255,.3),0 15px 40px rgba(0,0,0,.7)"; }
            else { const winner=Number(result.player)===1?1:2; resultIcon.textContent="🏆"; resultMessage.textContent=`${playerSettings[winner].name} venceu!`; resultDescription.textContent=""; const c=colorData[playerSettings[winner].color]; resultBox.style.borderColor=c.main; resultBox.style.boxShadow=`0 0 30px ${c.glow},0 15px 40px rgba(0,0,0,.7)`; }
            resultOverlay.style.display="flex";
        } finally { window.Lig4OnlineApplying=false; }
    }
};

window.__lig4StateProvider = function () {
    return {
        board: boardState.map(row => row.slice()),
        currentPlayer,
        currentColumn,
        frozenColumns: frozenColumns.slice(),
        boardFlipped,
        powers: {
            1: { ...powers[1] },
            2: { ...powers[2] }
        },
        gameActive,
        currentMatch,
        score: { ...score },
        phase: "playing"
    };
};
