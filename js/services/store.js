// Loja do jogador. O back é a fonte da verdade: preços, saldo, posse e equipados.
// Este arquivo guarda só metadados de apresentação (imagem, descrição, frame do tabuleiro).
import { get, post, put } from "./http.js";
import { exigirId } from "./auth.js";

const categories = [
  {
    id: "avatar",
    name: "Avatares",
    items: [
      { id: "avatar-padrao", name: "Padrão", image: "avatars/padrao.svg", description: "O jogador clássico: simpático e sempre pronto para a próxima partida." },
      { id: "avatar-samurai", name: "Samurai", image: "avatars/samurai.svg", popular: true, description: "Foco, honra e uma faixa vermelha. Ninguém liga quatro com tanta disciplina." },
      { id: "avatar-robo", name: "Robô", image: "avatars/robo.svg", description: "Calcula todas as jogadas em milissegundos. Só não conta com a sua criatividade." },
      { id: "avatar-rei", name: "Rei", image: "avatars/rei.svg", description: "Coroa, barba e postura real para quem domina o centro do tabuleiro." },
      { id: "avatar-rainha", name: "Rainha", image: "avatars/rainha.svg", description: "Elegância e estratégia: cada peça jogada é um xeque-mate em potencial." },
      { id: "avatar-mago", name: "Mago", image: "avatars/mago.svg", description: "Chapéu estrelado e barba longa. Dizem que ele enxerga cinco jogadas à frente." },
    ],
  },
  {
    id: "board",
    name: "Tabuleiros",
    items: [
      { id: "board-classico", name: "Clássico", image: "boards/classico.webp", frame: { file: "boards/classico-frame.webp", width: 952, height: 970, x0: 173.0, y0: 206.8, dx: 101.0, dy: 111.0, radius: 44.0, empty: "#03110d" }, description: "O tabuleiro azul tradicional do LIG-4." },
      { id: "board-espacial", name: "Espacial", image: "boards/espacial.webp", frame: { file: "boards/espacial-frame.webp", width: 940, height: 986, x0: 222.3, y0: 295.9, dx: 82.55, dy: 82.56, radius: 32.8, empty: "#010c10" }, description: "Estrutura metálica com luzes de neon e um satélite orbitando o tabuleiro." },
      { id: "board-floresta", name: "Floresta", image: "boards/floresta.webp", frame: { file: "boards/floresta-frame.webp", width: 952, height: 970, x0: 242.9, y0: 317.0, dx: 77.35, dy: 77.34, radius: 31.0, empty: "#040d08" }, description: "Pedra coberta de musgo, samambaias, cogumelos e uma rã curiosa." },
      { id: "board-medieval", name: "Medieval", image: "boards/medieval.webp", frame: { file: "boards/medieval-frame.webp", width: 953, height: 953, x0: 232.9, y0: 329.1, dx: 80.87, dy: 80.84, radius: 32.0, empty: "#121411" }, description: "Muralha de pedra com torres, estandartes e um dragão guardando o tesouro." },
      { id: "board-praia", name: "Praia", image: "boards/praia.webp", frame: { file: "boards/praia-frame.webp", width: 952, height: 974, x0: 228.5, y0: 276.8, dx: 77.98, dy: 77.99, radius: 28.9, empty: "#192b37" }, description: "Madeira listrada, boia, farol, guarda-sol e um caranguejo na areia." },
      { id: "board-inverno", name: "Inverno", image: "boards/inverno.webp", frame: { file: "boards/inverno-frame.webp", width: 989, height: 934, x0: 261.8, y0: 228.3, dx: 77.24, dy: 77.19, radius: 30.6, empty: "#000a13" }, description: "Pinheiros nevados, bancada de madeira e um boneco de neve de cachecol." },
    ],
  },
  {
    id: "emote",
    name: "Emotes",
    items: [
      { id: "emote-risadinha", name: "Risadinha", image: "emotes/risadinha.svg", emoji: "😄", description: "Uma gargalhada para celebrar qualquer jogada." },
      { id: "emote-aplauso", name: "Aplauso", image: "emotes/aplauso.svg", emoji: "👏", description: "Reconheça a boa jogada do adversário." },
      { id: "emote-choro", name: "Choro", image: "emotes/choro.svg", emoji: "😭", description: "Para quando a quarta peça escapa por um triz." },
      { id: "emote-surpresa", name: "Surpresa", image: "emotes/surpresa.svg", emoji: "😮", description: "Ninguém viu essa jogada chegando." },
      { id: "emote-bravo", name: "Bravo", image: "emotes/bravo.svg", emoji: "😡", description: "Mostre que você não gostou de ter sido bloqueado." },
      { id: "emote-cool", name: "Cool", image: "emotes/cool.svg", emoji: "😎", description: "Jogada tranquila, favorável e com muito estilo." },
      { id: "emote-coracao", name: "Coração", image: "emotes/coracao.svg", emoji: "😍", description: "Apaixonado por uma jogada perfeita." },
      { id: "emote-confuso", name: "Confuso", image: "emotes/confuso.svg", emoji: "🤔", description: "Hmm... o que será que o adversário está planejando?" },
    ],
  },
  {
    id: "poderes",
    name: "Poderes",
    items: [
      { id: "congelar-coluna", name: "Congelar Coluna", emoji: "❄️", description: "Bloqueia uma coluna do adversário por 3 lances dele." },
      { id: "queimar-peca", name: "Queimar Peça", emoji: "🔥", description: "Remove a peça mais alta do adversário em uma coluna." },
      { id: "peca-extra", name: "Peça Extra", emoji: "➕", description: "Joga uma segunda peça na mesma vez." },
    ],
  },
];

const metaPorId = new Map(
  categories.flatMap(c => c.items.map(item => [item.id, { ...item, category: c.id }])),
);
const CATEGORIAS_EQUIPAVEIS = ["avatar", "board", "emote"];

const caminhoLoja = (sufixo = "") => `/jogadores/${exigirId()}/loja${sufixo}`;
const carregarLoja = () => get(caminhoLoja());

// Junta o item do back (preço, posse, equipado) com os metadados locais.
function paraItem(categoriaId, itemBack, equipados) {
  const meta = metaPorId.get(itemBack.id) ?? {};
  return {
    ...meta,
    id: itemBack.id,
    name: itemBack.nome,
    price: itemBack.preco,
    category: categoriaId,
    owned: Boolean(itemBack.possuido),
    equipped: equipados?.[categoriaId] === itemBack.id,
  };
}

function paraCatalogo(loja) {
  return {
    categories: categories.map(meta => {
      const categoriaBack = loja.categorias.find(c => c.id === meta.id);
      return {
        id: meta.id,
        name: meta.name,
        items: (categoriaBack?.itens ?? [])
          .filter(item => !(meta.id === "board" && item.id === "board-classico"))
          .map(item => paraItem(meta.id, item, loja.equipados)),
      };
    }),
  };
}

// Síncrono e sem rede: usado em renderRoom (partida.js, player-style.js, lobby.js).
export function findItem(itemId) {
  const meta = metaPorId.get(itemId);
  return meta ? { ...meta } : null;
}

export const getItemImageUrl = item =>
  new URL(`../../assets/store/${item.image}`, import.meta.url).href;

export const getBoardFrameUrl = item =>
  item?.frame ? new URL(`../../assets/store/${item.frame.file}`, import.meta.url).href : null;

export async function getCatalog() {
  return paraCatalogo(await carregarLoja());
}

export async function getBalance() {
  return { coins: (await carregarLoja()).moedas };
}

export async function getEquipped() {
  return { ...(await carregarLoja()).equipados };
}

export async function getEquippedItems() {
  const loja = await carregarLoja();
  return Object.fromEntries(CATEGORIAS_EQUIPAVEIS.map(id => {
    const itemId = loja.equipados[id];
    const itemBack = loja.categorias.find(c => c.id === id)?.itens.find(i => i.id === itemId);
    return [id, itemBack ? paraItem(id, itemBack, loja.equipados) : null];
  }));
}

export async function getInventory() {
  const loja = await carregarLoja();
  const byCategory = Object.fromEntries(loja.categorias.map(c => [
    c.id,
    c.itens.filter(i => i.possuido).map(i => paraItem(c.id, i, loja.equipados)),
  ]));
  return { byCategory, items: Object.values(byCategory).flat() };
}

// `valor` é o número do pacote (100, 500, 1000), como o coin-shop envia hoje.
export async function addDemoCoins(valor) {
  const resposta = await post(caminhoLoja("/moedas"), { pacoteId: `pacote-${valor}` });
  return { coins: resposta.moedas };
}

export async function purchaseItem({ category, itemId } = {}) {
  // O back não informa quanto falta; lemos o preço e o saldo antes da compra.
  const antes = await carregarLoja();
  const precoItem = antes.categorias.find(c => c.id === category)?.itens.find(i => i.id === itemId)?.preco ?? null;

  let resposta;
  try {
    resposta = await post(caminhoLoja("/comprar"), { itemId });
  } catch (erro) {
    if (erro.code === "SALDO_INSUFICIENTE" && precoItem !== null) {
      erro.missing = Math.max(0, precoItem - antes.moedas);
    }
    throw erro;
  }

  const itemBack = resposta.categorias.find(c => c.id === category)?.itens.find(i => i.id === itemId);
  return {
    item: paraItem(category, itemBack, resposta.equipados),
    balance: { coins: resposta.moedas },
    equipped: { ...resposta.equipados },
  };
}

export async function equipItem({ category, itemId } = {}) {
  const resposta = await put(caminhoLoja("/equipar"), { categoria: category, itemId });
  return { ...resposta.equipados };
}