// Regras puras do relógio da partida. Sem DOM, sem storage, sem Date.now() implícito:
// quem chama passa `agora` (ms). O servidor (services/rooms.js) é a autoridade do tempo.

export const TEMPO_INICIAL_MS = 300000; // 5:00 por jogador, fixo (docs/game-rules.md §5)

function jogadorValido(jogador) {
  return jogador === 1 || jogador === 2;
}

// Relógio novo: o tempo do jogador da vez começa a correr em `agora`.
export function criarRelogio(vez, agora) {
  if (!jogadorValido(vez)) throw new RangeError("vez inválida");
  return {
    restante1: TEMPO_INICIAL_MS,
    restante2: TEMPO_INICIAL_MS,
    vez,
    inicioVez: agora,
  };
}

// Tempo restante do jogador em `agora`. Só o jogador da vez consome tempo.
export function tempoRestante(relogio, jogador, agora) {
  if (!relogio || !jogadorValido(jogador)) return 0;
  const restante = relogio[`restante${jogador}`];
  if (relogio.vez !== jogador || relogio.inicioVez === null) return restante;
  return Math.max(0, restante - Math.max(0, agora - relogio.inicioVez));
}

// Congela o tempo consumido até `agora` e para o relógio (fim de partida).
export function pausarRelogio(relogio, agora) {
  if (!relogio) return relogio;
  if (relogio.inicioVez === null) return { ...relogio };
  return {
    ...relogio,
    [`restante${relogio.vez}`]: tempoRestante(relogio, relogio.vez, agora),
    inicioVez: null,
  };
}

// Passa a vez: desconta o tempo de quem jogou e começa a contar o do próximo.
// Se a vez não mudou (ex.: peça extra), o relógio segue correndo sem alteração.
export function trocarVez(relogio, proximaVez, agora) {
  if (!jogadorValido(proximaVez)) throw new RangeError("vez inválida");
  if (relogio.vez === proximaVez) return { ...relogio };
  const pausado = pausarRelogio(relogio, agora);
  return {
    ...pausado,
    vez: proximaVez,
    inicioVez: pausado[`restante${proximaVez}`] > 0 ? agora : null,
  };
}

// Jogador cujo tempo acabou, ou null. Só vale com o relógio correndo.
export function jogadorSemTempo(relogio, agora) {
  if (!relogio || relogio.inicioVez === null) return null;
  return tempoRestante(relogio, relogio.vez, agora) === 0 ? relogio.vez : null;
}

export function formatarRelogio(milissegundos) {
  const totalSegundos = Math.ceil(Math.max(0, milissegundos) / 1000);
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
}
