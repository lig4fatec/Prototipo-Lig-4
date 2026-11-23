// js/services/rooms.js — salas (REST + polling) e partida (WebSocket)
import { get, post, put } from "./http.js";
import { WS_URL } from "../config.js";

// room-ui.js e profile-page.js importam esta lista
export const CORES_VALIDAS = ["blue", "red", "purple", "green", "orange", "yellow", "brown"];

/* ---------- Salas ---------- */
// Sala: {pin, modo, fase: AGUARDANDO|JOGANDO|ENCERRADA, dono:{id,nome,cor}, convidado,
//        partidaId, revancheDe, prontoDono, prontoConvidado}
export const criarSala = (jogadorId, cor, modo = "CLASSICO") =>
  post("/salas", { jogadorId, modo, cor }); // modo: CLASSICO | CAOS
export const entrarNaSala = (jogadorId, pin, cor) =>
  post("/salas/entrar", { jogadorId, pin, cor });
export const buscarSala = (pin) => get(`/salas/${pin}`);
export const trocarCor = (pin, jogadorId, cor) => put(`/salas/${pin}/cor`, { jogadorId, cor });
// Não existe /iniciar: quando os DOIS marcam pronto, a sala vira JOGANDO e vem partidaId
export const marcarPronto = (pin, jogadorId, pronto = true) =>
  put(`/salas/${pin}/pronto`, { jogadorId, pronto });
export const pedirRevanche = (pin, jogadorId) => post(`/salas/${pin}/revanche`, { jogadorId });
export const sairDaSala = (pin, jogadorId) => post(`/salas/${pin}/sair`, { jogadorId });

// Polling a cada 2s (a sala não tem WebSocket). Retorna a função que para o polling.
export function acompanharSala(pin, onSala, onErro, intervaloMs = 2000) {
  let ativo = true;
  const ciclo = async () => {
    if (!ativo) return;
    try { onSala(await buscarSala(pin)); } catch (e) { onErro?.(e); }
    if (ativo) setTimeout(ciclo, intervaloMs);
  };
  ciclo();
  return () => { ativo = false; };
}

/* ---------- Partida ---------- */
export const buscarEstado = (partidaId) => get(`/partidas/${partidaId}/estado`);

// Tabuleiro: 6 linhas (cima p/ baixo) x 7 colunas; "VERMELHO" = jogadorUm, "AMARELO" = jogadorDois.
// Nos poderes, "linha" conta da BASE (0 = base). Converte da linha da matriz:
export const linhaDaBase = (linhaMatriz, total = 6) => total - 1 - linhaMatriz;

// Tempo restante de cada jogador, descontando o que correu desde que o estado chegou.
// Chame com o estado recebido e o instante em que ele chegou (Date.now()).
export function tempoRestante(estado, recebidoEm, agora = Date.now()) {
  const gasto = estado.relogioDe != null ? agora - recebidoEm : 0;
  const desconta = (id) => (estado.relogioDe === id ? gasto : 0);
  return {
    jogadorUm: Math.max(0, estado.tempoJogadorUmMs - desconta(estado.jogadorUm?.id)),
    jogadorDois: Math.max(0, estado.tempoJogadorDoisMs - desconta(estado.jogadorDois?.id)),
  };
}

// handlers: onEstado(estado), onJogada(jogada), onPresenca(ids), onErro(codigo, mensagem), onStatus(texto)
export class PartidaSocket {
  constructor(partidaId, jogadorId, handlers = {}) {
    this.url = `${WS_URL}/ws/partidas/${partidaId}?jogadorId=${jogadorId}`;
    this.h = handlers;
    this.ws = null;
    this.encerrado = false;
    this.tentativas = 0;
  }

  conectar() {
    this.encerrado = false;
    this.ws = new WebSocket(this.url);
    this.ws.onopen = () => { this.tentativas = 0; this.h.onStatus?.("aberto"); };
    this.ws.onmessage = (ev) => {
      let m; try { m = JSON.parse(ev.data); } catch { return; }
      if (m.tipo === "ESTADO") this.h.onEstado?.(m.dados);
      else if (m.tipo === "JOGADA") this.h.onJogada?.(m.dados);
      else if (m.tipo === "PRESENCA") this.h.onPresenca?.(m.dados.conectados);
      else if (m.tipo === "ERRO") this.h.onErro?.(m.codigo, m.mensagem);
    };
    this.ws.onclose = () => {
      this.h.onStatus?.("fechado");
      if (this.encerrado) return;
      const espera = Math.min(500 * 2 ** this.tentativas++, 5000);
      setTimeout(() => !this.encerrado && this.conectar(), espera); // o servidor reenvia o ESTADO
    };
  }

  _enviar(obj) {
    if (this.ws?.readyState === 1) this.ws.send(JSON.stringify(obj));
    else this.h.onErro?.("SEM_CONEXAO", "Conexão com a partida indisponível.");
  }
  pedirEstado()          { this._enviar({ tipo: "ESTADO" }); }
  jogar(coluna)          { this._enviar({ tipo: "JOGAR", coluna }); }
  desistir()             { this._enviar({ tipo: "DESISTIR" }); }
  proporEmpate()         { this._enviar({ tipo: "PROPOR_EMPATE" }); }
  aceitarEmpate()        { this._enviar({ tipo: "ACEITAR_EMPATE" }); }
  recusarEmpate()        { this._enviar({ tipo: "RECUSAR_EMPATE" }); }
  queimar(coluna, linha) { this._enviar({ tipo: "PODER", poder: "QUEIMAR", coluna, linha }); }
  congelar(coluna)       { this._enviar({ tipo: "PODER", poder: "CONGELAR", coluna }); }
  pecaExtra()            { this._enviar({ tipo: "PODER", poder: "EXTRA" }); }
  fechar()               { this.encerrado = true; this.ws?.close(); }
}
/* ---------- Adaptador para as telas atuais (formato antigo do front) ---------- */
// As telas usam nomes e formatos do mock. Este bloco traduz o back para eles.
// Remover quando as telas forem migradas para as funções nativas acima.
import { exigirId } from "./auth.js";

const PHASE_FROM_API = { AGUARDANDO: "waiting", JOGANDO: "playing", ENCERRADA: "finished" };
const MODE_FROM_API = { CLASSICO: "classico", CAOS: "caos" };

const jogadorSala = (p) => (p ? { id: p.jogadorId, nome: p.nome, color: p.cor } : null);

// Converte a sala do back para o formato que as telas esperam.
function paraTela(sala) {
  if (!sala) return null;
  return {
    pin: sala.pin,
    mode: MODE_FROM_API[sala.modo] ?? "classico",
    phase: PHASE_FROM_API[sala.fase] ?? "waiting",
    players: {
      owner: jogadorSala(sala.dono),
      guest: jogadorSala(sala.convidado),
    },
    ready: {
      owner: Boolean(sala.prontoDono),
      guest: Boolean(sala.prontoConvidado),
    },
    partidaId: sala.partidaId ?? null,
    rematchRequested: [],
    lastEmote: null,
  };
}

// Papel na sala: o dono sempre é "owner"; quem entrou é "guest".
function papelDoJogador(sala) {
  const id = exigirId();
  return sala?.dono?.jogadorId === id ? "owner" : "guest";
}

export async function createRoom({ mode = "classico" } = {}) {
  const sala = await criarSala(exigirId(), "blue", mode === "caos" ? "CAOS" : "CLASSICO");
  return { pin: sala.pin };
}

export async function joinRoom({ pin } = {}) {
  const sala = await entrarNaSala(exigirId(), pin, "red");
  return { pin: sala.pin, role: "guest" };
}

export async function getRoom(pin) {
  return paraTela(await buscarSala(pin));
}

export function watchRoom(pin, callback) {
  return acompanharSala(
    pin,
    (sala) => callback(paraTela(sala)),
    (error) => {
      if (error.code === "PIN_NAO_ENCONTRADO") callback(null);
    },
  );
}

export async function setPlayerColor({ pin, color } = {}) {
  return paraTela(await trocarCor(pin, exigirId(), color));
}

export async function setPlayerReady({ pin, ready } = {}) {
  return paraTela(await marcarPronto(pin, exigirId(), ready));
}

export async function leaveRoom({ pin } = {}) {
  await sairDaSala(pin, exigirId());
}

// Partida ainda não integrada: estas funções são chamadas por partida.js e controller.js.
const naoIntegrado = () => Promise.reject({ code: "NAO_INTEGRADO" });
export const startMatch = naoIntegrado;
export const publishState = naoIntegrado;
export const publishResult = naoIntegrado;
export const requestRematch = naoIntegrado;
export const sendEmote = naoIntegrado;
export const usarCongelarColuna = naoIntegrado;
export const usarQueimarPeca = naoIntegrado;
export const usarPecaExtra = naoIntegrado;
export const desistirPartida = naoIntegrado;
export const proporEmpate = naoIntegrado;
export const responderEmpate = naoIntegrado;
export const getRoomPartida = naoIntegrado;