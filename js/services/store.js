// Mock em memória; sem compra ou persistência. Um backend poderá substituir o miolo mantendo as assinaturas.
const categories = [
  {
    id: "avatar",
    name: "Avatares",
    items: [
      { id: "avatar-classico", name: "Clássico", price: 0, owned: true },
      { id: "avatar-folhas", name: "Folhas", price: 180, owned: true },
      { id: "avatar-orbita", name: "Órbita", price: 360, owned: false },
      { id: "avatar-dourado", name: "Dourado", price: 520, owned: false },
    ],
  },
  {
    id: "board",
    name: "Tabuleiros",
    items: [
      { id: "board-minimalista", name: "Minimalista", price: 0, owned: true },
      { id: "board-cobalto", name: "Cobalto", price: 160, owned: true },
      { id: "board-linhas", name: "Linhas", price: 340, owned: false },
      { id: "board-noturno", name: "Noturno", price: 480, owned: false },
    ],
  },
  {
    id: "emote",
    name: "Emotes",
    items: [
      { id: "emote-saudacao", name: "Saudação", price: 0, owned: true },
      { id: "emote-boa-partida", name: "Boa partida", price: 100, owned: true },
      { id: "emote-concentracao", name: "Concentração", price: 230, owned: false },
      { id: "emote-vitoria", name: "Vitória", price: 400, owned: false },
    ],
  },
];

const balance = { coins: 1200 };
const equipped = {
  avatar: "avatar-classico",
  board: "board-minimalista",
  emote: "emote-saudacao",
};

function storeError(code) {
  return { code };
}

async function yieldMock() {
  await Promise.resolve();
}

export async function getCatalog() {
  await yieldMock();
  return {
    categories: categories.map(category => ({
      ...category,
      items: category.items.map(item => ({ ...item })),
    })),
  };
}

export async function getBalance() {
  await yieldMock();
  return { ...balance };
}

export async function getEquipped() {
  await yieldMock();
  return { ...equipped };
}

export async function equipItem({ category, itemId } = {}) {
  await yieldMock();
  const selectedCategory = categories.find(entry => entry.id === category);
  const item = selectedCategory?.items.find(entry => entry.id === itemId);

  if (!item) throw storeError("ITEM_INEXISTENTE");
  if (!item.owned) throw storeError("ITEM_NAO_POSSUIDO");

  equipped[category] = item.id;
  return { ...equipped };
}