// Loja do jogador. Catálogo fixo + saldo, inventário e itens equipados persistidos por jogador em localStorage
// (mesma chave de identidade usada em profile.js: e-mail do usuário logado ou "visitante").
// Um backend poderá substituir o miolo mantendo as assinaturas; a validação de compra deve migrar junto.
import { getCurrentUser } from "./auth.js";

const STORE_KEY = "lig4.store";
const INITIAL_COINS = 1250;
const DEFAULT_EQUIPPED = Object.freeze({
  avatar: "avatar-padrao",
  board: "board-classico",
  emote: "emote-risadinha",
});

// Itens com price 0 são o kit inicial: pertencem a todos os jogadores e não podem ser comprados.
// Boards temáticos trazem em "frame" a geometria dos furos (em pixels da imagem) para encaixar as peças.
const categories = [
  {
    id: "avatar",
    name: "Avatares",
    items: [
      { id: "avatar-padrao", name: "Padrão", price: 0, image: "avatars/padrao.svg", description: "O jogador clássico: simpático e sempre pronto para a próxima partida." },
      { id: "avatar-samurai", name: "Samurai", price: 800, image: "avatars/samurai.svg", popular: true, description: "Foco, honra e uma faixa vermelha. Ninguém liga quatro com tanta disciplina." },
      { id: "avatar-robo", name: "Robô", price: 800, image: "avatars/robo.svg", description: "Calcula todas as jogadas em milissegundos. Só não conta com a sua criatividade." },
      { id: "avatar-rei", name: "Rei", price: 1200, image: "avatars/rei.svg", description: "Coroa, barba e postura real para quem domina o centro do tabuleiro." },
      { id: "avatar-rainha", name: "Rainha", price: 1200, image: "avatars/rainha.svg", description: "Elegância e estratégia: cada peça jogada é um xeque-mate em potencial." },
      { id: "avatar-mago", name: "Mago", price: 1200, image: "avatars/mago.svg", description: "Chapéu estrelado e barba longa. Dizem que ele enxerga cinco jogadas à frente." },
    ],
  },
  {
    id: "board",
    name: "Tabuleiros",
    items: [
      { id: "board-classico", name: "Clássico", price: 0, image: "boards/classico.svg", description: "O tabuleiro azul tradicional do LIG-4." },
      { id: "board-espacial", name: "Espacial", price: 800, image: "boards/espacial.webp", frame: { file: "boards/espacial-frame.webp", width: 940, height: 986, x0: 222.3, y0: 295.9, dx: 82.55, dy: 82.56, radius: 32.8, empty: "#010c10" }, description: "Estrutura metálica com luzes de neon e um satélite orbitando o tabuleiro." },
      { id: "board-floresta", name: "Floresta", price: 800, image: "boards/floresta.webp", frame: { file: "boards/floresta-frame.webp", width: 952, height: 970, x0: 242.9, y0: 317.0, dx: 77.35, dy: 77.34, radius: 31.0, empty: "#040d08" }, description: "Pedra coberta de musgo, samambaias, cogumelos e uma rã curiosa." },
      { id: "board-medieval", name: "Medieval", price: 1200, image: "boards/medieval.webp", frame: { file: "boards/medieval-frame.webp", width: 953, height: 953, x0: 232.9, y0: 329.1, dx: 80.87, dy: 80.84, radius: 32.0, empty: "#121411" }, description: "Muralha de pedra com torres, estandartes e um dragão guardando o tesouro." },
      { id: "board-praia", name: "Praia", price: 1200, image: "boards/praia.webp", frame: { file: "boards/praia-frame.webp", width: 952, height: 974, x0: 228.5, y0: 276.8, dx: 77.98, dy: 77.99, radius: 28.9, empty: "#192b37" }, description: "Madeira listrada, boia, farol, guarda-sol e um caranguejo na areia." },
      { id: "board-inverno", name: "Inverno", price: 1200, image: "boards/inverno.webp", frame: { file: "boards/inverno-frame.webp", width: 989, height: 934, x0: 261.8, y0: 228.3, dx: 77.24, dy: 77.19, radius: 30.6, empty: "#000a13" }, description: "Pinheiros nevados, bancada de madeira e um boneco de neve de cachecol." },
    ],
  },
  {
    id: "emote",
    name: "Emotes",
    items: [
      { id: "emote-risadinha", name: "Risadinha", price: 0, image: "emotes/risadinha.svg", emoji: "😄", description: "Uma gargalhada para celebrar qualquer jogada." },
      { id: "emote-aplauso", name: "Aplauso", price: 200, image: "emotes/aplauso.svg", emoji: "👏", description: "Reconheça a boa jogada do adversário." },
      { id: "emote-choro", name: "Choro", price: 200, image: "emotes/choro.svg", emoji: "😭", description: "Para quando a quarta peça escapa por um triz." },
      { id: "emote-surpresa", name: "Surpresa", price: 200, image: "emotes/surpresa.svg", emoji: "😮", description: "Ninguém viu essa jogada chegando." },
      { id: "emote-bravo", name: "Bravo", price: 200, image: "emotes/bravo.svg", emoji: "😡", description: "Mostre que você não gostou de ter sido bloqueado." },
      { id: "emote-cool", name: "Cool", price: 300, image: "emotes/cool.svg", emoji: "😎", description: "Jogada tranquila, favorável e com muito estilo." },
      { id: "emote-coracao", name: "Coração", price: 300, image: "emotes/coracao.svg", emoji: "😍", description: "Apaixonado por uma jogada perfeita." },
      { id: "emote-confuso", name: "Confuso", price: 300, image: "emotes/confuso.svg", emoji: "🤔", description: "Hmm... o que será que o adversário está planejando?" },
    ],
  },
];

let memoryUsers = {};

function storeError(code, extra = {}) {
  return { code, ...extra };
}

function findCategoryItem(categoryId, itemId) {
  return categories.find(entry => entry.id === categoryId)?.items.find(entry => entry.id === itemId) ?? null;
}

function isOwned(state, item) {
  return item.price === 0 || state.purchased.includes(item.id);
}

function toPublicItem(categoryId, item, state) {
  return {
    ...item,
    category: categoryId,
    owned: isOwned(state, item),
    ...(item.frame ? { frame: { ...item.frame } } : {}),
  };
}

function normalizeState(raw) {
  const saved = raw && typeof raw === "object" ? raw : {};
  const purchasable = new Map(categories.flatMap(category => (
    category.items.filter(item => item.price > 0).map(item => [item.id, item])
  )));
  const purchased = [...new Set(Array.isArray(saved.purchased) ? saved.purchased : [])]
    .filter(itemId => purchasable.has(itemId));
  const state = {
    coins: Number.isInteger(saved.coins) && saved.coins >= 0 ? saved.coins : INITIAL_COINS,
    purchased,
    equipped: { ...DEFAULT_EQUIPPED },
  };
  for (const category of categories) {
    const item = findCategoryItem(category.id, saved.equipped?.[category.id]);
    if (item && isOwned(state, item)) state.equipped[category.id] = item.id;
  }
  return state;
}

async function getUserKey() {
  try {
    const user = await getCurrentUser();
    return user?.email ?? "visitante";
  } catch {
    return "visitante";
  }
}

function readUsers() {
  try {
    if (!globalThis.localStorage) return memoryUsers;
    const parsed = JSON.parse(globalThis.localStorage.getItem(STORE_KEY));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return memoryUsers;
  }
}

function writeUsers(users) {
  try {
    if (!globalThis.localStorage) throw new Error("sem localStorage");
    globalThis.localStorage.setItem(STORE_KEY, JSON.stringify(users));
  } catch {
    // Sem armazenamento persistente (ex.: modo restrito): mantém a sessão em memória.
    memoryUsers = users;
  }
}

async function readState() {
  const userKey = await getUserKey();
  return normalizeState(readUsers()[userKey]);
}

// Leitura, validação e gravação ocorrem sem await entre elas: duas ações simultâneas não geram cobrança dupla.
async function updateState(mutate) {
  const userKey = await getUserKey();
  const users = readUsers();
  const state = normalizeState(users[userKey]);
  const result = mutate(state);
  users[userKey] = state;
  writeUsers(users);
  return result;
}

export function getItemImageUrl(item) {
  return new URL(`../../assets/store/${item.image}`, import.meta.url).href;
}

export function getBoardFrameUrl(item) {
  return item?.frame ? new URL(`../../assets/store/${item.frame.file}`, import.meta.url).href : null;
}

// Consulta estática (sem estado do jogador), usada para exibir itens vindos de outros jogadores.
export function findItem(itemId) {
  for (const category of categories) {
    const item = category.items.find(entry => entry.id === itemId);
    if (item) return toPublicItem(category.id, item, { purchased: [] });
  }
  return null;
}

export async function getCatalog() {
  const state = await readState();
  return {
    categories: categories.filter(category => category.id !== "board").map(category => ({
      ...category,
      items: category.items.map(item => toPublicItem(category.id, item, state)),
    })),
  };
}

export async function getBalance() {
  const state = await readState();
  return { coins: state.coins };
}

export async function getEquipped() {
  const state = await readState();
  return { ...state.equipped };
}

export async function getEquippedItems() {
  const state = await readState();
  return Object.fromEntries(categories.map(category => [
    category.id,
    toPublicItem(category.id, findCategoryItem(category.id, state.equipped[category.id]), state),
  ]));
}

export async function getInventory() {
  const state = await readState();
  const byCategory = Object.fromEntries(categories.map(category => [
    category.id,
    category.items.filter(item => isOwned(state, item)).map(item => toPublicItem(category.id, item, state)),
  ]));
  return {
    byCategory,
    items: Object.values(byCategory).flat(),
    purchased: [...state.purchased],
    total: categories.reduce((sum, category) => sum + category.items.length, 0),
  };
}

export async function purchaseItem({ category, itemId } = {}) {
  if (category === "board") throw storeError("ITEM_INDISPONIVEL");
  const item = findCategoryItem(category, itemId);
  if (!item) throw storeError("ITEM_INEXISTENTE");

  return updateState(state => {
    if (isOwned(state, item)) throw storeError("ITEM_JA_POSSUIDO");
    if (state.coins < item.price) {
      throw storeError("SALDO_INSUFICIENTE", { missing: item.price - state.coins, price: item.price });
    }
    state.coins -= item.price;
    state.purchased.push(item.id);
    return {
      item: toPublicItem(category, item, state),
      balance: { coins: state.coins },
      equipped: { ...state.equipped },
    };
  });
}

export async function equipItem({ category, itemId } = {}) {
  if (category === "emote") throw storeError("ITEM_NAO_EQUIPAVEL");
  if (category === "board") throw storeError("ITEM_INDISPONIVEL");
  const item = findCategoryItem(category, itemId);
  if (!item) throw storeError("ITEM_INEXISTENTE");

  return updateState(state => {
    if (!isOwned(state, item)) throw storeError("ITEM_NAO_POSSUIDO");
    state.equipped[category] = item.id;
    return { ...state.equipped };
  });
}
