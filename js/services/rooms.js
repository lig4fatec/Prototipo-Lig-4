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
      else if (m.tipo === "EMOTE") this.h.onEmote?.(m.dados);
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
  emote(emote)           { this._enviar({ tipo: "EMOTE", emote }); }
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
/* ---------- Adaptador de partida (WebSocket) ---------- */
// Traduz o estado do back para o formato que partida.js já usa.

const JOGADOR_DA_API = { VERMELHO: 1, AMARELO: 2 };
const MOTIVO_FIM = { VITORIA: "vitoria", TABULEIRO_CHEIO: "empate", DESISTENCIA: "desistencia", EMPATE_ACORDADO: "empate", TEMPO: "tempo" };

// Assento da tela: 1 = dono da sala, 2 = convidado, independente de VERMELHO/AMARELO
function seatDe(jogadorId, sala) {
  return jogadorId === sala.players?.owner?.id ? 1 : 2;
}

function tabuleiroParaTela(tabuleiro, seatVermelho) {
  const seatAmarelo = seatVermelho === 1 ? 2 : 1;
  return tabuleiro.map(linha => linha.map(celula =>
    celula === "VERMELHO" ? seatVermelho : celula === "AMARELO" ? seatAmarelo : 0));
}

function estadoParaTela(estado, sala) {
  const s = (id) => seatDe(id, sala);
  const seatVermelho = s(estado.jogadorUm?.id);
  const emFim = estado.statusPartida !== "EM_ANDAMENTO";
  const motivo = MOTIVO_FIM[estado.motivoFim] ?? null;
  const vencedor = estado.vencedorId == null ? null : s(estado.vencedorId);
  const usados = estado.empatesUsados || [];
  const idDono = sala.players?.owner?.id;
  const idConvidado = sala.players?.guest?.id;
  const umMs = estado.tempoJogadorUmMs;
  const doisMs = estado.tempoJogadorDoisMs;

  return {
    ...sala,
    phase: emFim ? "finished" : "playing",
    game: {
      board: tabuleiroParaTela(estado.tabuleiro, seatVermelho),
      turn: estado.proximoJogadorId == null ? null : s(estado.proximoJogadorId),
      moveCount: estado.totalJogadas,
      bloqueios: (estado.congelamentos || []).map(c => ({
        coluna: c.coluna,
        jogador: s(c.jogadorId),
        lances: c.turnosRestantes,
      })),
      poderesUsados: poderesUsadosParaTela(estado, sala),
      poderesDisponiveis: poderesDisponiveisParaTela(estado, sala),
      pecaExtra: estado.pecaExtraAtiva
        ? { jogador: s(estado.proximoJogadorId), etapa: 2 } : null,
      empatesPropostos: {
        1: usados.includes(idDono),
        2: usados.includes(idConvidado),
      },
    },
    result: emFim ? { winner: vencedor, draw: motivo === "empate", motivo } : null,
    empate: estado.empatePropostoPor == null
      ? null
      : { proponente: s(estado.empatePropostoPor), status: "pendente" },
    tempos: {
      1: seatVermelho === 1 ? umMs : doisMs,
      2: seatVermelho === 1 ? doisMs : umMs,
      relogioDe: s(estado.relogioDe),
    },
  };
}

function poderesDisponiveisParaTela(estado, sala) {
  const disponiveis = { 1: [], 2: [] };
  const mapa = { QUEIMAR: "queimar-peca", CONGELAR: "congelar-coluna", EXTRA: "peca-extra" };
  for (const p of estado.poderesDisponiveis || []) {
    disponiveis[seatDe(p.jogadorId, sala)].push(mapa[p.poder] ?? p.poder);
  }
  return disponiveis;
}

function poderesUsadosParaTela(estado, sala) {
  const usados = { 1: [], 2: [] }; // TODO: verificar se precisa criar um terceiro "slot" para contabilizar o uso do terceiro poder.
  const mapa = { QUEIMAR: "queimar-peca", CONGELAR: "congelar-coluna", EXTRA: "peca-extra" };
  for (const p of estado.poderesUsados || []) {
    usados[seatDe(p.jogadorId, sala)].push(mapa[p.poder] ?? p.poder);
  }
  return usados;
}

// Partida ativa: uma conexão por vez, usada pelas funções abaixo.
let partidaAtiva = null;
let estadoAtual = null;
let ouvintesPartida = new Set();

function notificarPartida(estado) {
  estadoAtual = estado;
  for (const ouvinte of ouvintesPartida) ouvinte(estado);
}

let seqEmote = 0;

export function abrirPartidaSocket(partidaId, jogadorId, sala, onEstado, onErro) {
  fecharPartidaSocket();
  ouvintesPartida = new Set([onEstado]);
  partidaAtiva = new PartidaSocket(partidaId, jogadorId, {
    onEstado: (estado) => notificarPartida(estadoParaTela(estado, sala)),
    onJogada: () => partidaAtiva?.pedirEstado(),
    onEmote: (dados) => {
      if (!estadoAtual) return;
      const role = sala.players?.owner?.id === dados.jogadorId ? "owner" : "guest";
      notificarPartida({
        ...estadoAtual,
        lastEmote: { id: ++seqEmote, emoteId: dados.emote, role },
      });
    },
    onErro: (codigo, mensagem) => onErro?.({ code: codigo, message: mensagem }),
  });
  partidaAtiva.conectar();
  return partidaAtiva;
}

export function fecharPartidaSocket() {
  partidaAtiva?.fechar();
  partidaAtiva = null;
  estadoAtual = null;
}

// Funções que partida.js chama. Todas enviam pelo socket; o resultado chega em onEstado.
const enviar = (acao) => {
  if (!partidaAtiva) return Promise.reject({ code: "SEM_CONEXAO" });
  acao(partidaAtiva);
  return Promise.resolve();
};

export const publishState = ({ board, turn, moveCount, column } = {}) =>
  enviar(s => s.jogar(column));
export const publishResult = () => Promise.resolve(); // o servidor encerra a partida sozinho
export const usarCongelarColuna = ({ coluna }) => enviar(s => s.congelar(coluna));
export const usarQueimarPeca = ({ coluna, linha }) => enviar(s => s.queimar(coluna, linha));
export const usarPecaExtra = () => enviar(s => s.pecaExtra());
export const desistirPartida = () => enviar(s => s.desistir());
export const proporEmpate = () => enviar(s => s.proporEmpate());
export const responderEmpate = ({ aceitar }) => enviar(s => (aceitar ? s.aceitarEmpate() : s.recusarEmpate()));

// Revanche usa REST (não há comando no socket): POST /salas/{pin}/revanche.
export const requestRematch = ({ pin }) => pedirRevanche(pin, exigirId()).then(sala => paraTela(sala));

export const sendEmote = ({ emoteId }) => enviar(s => s.emote(emoteId));

export const buscarEstadoPartida = (partidaId) => buscarEstado(partidaId).then(e => e);