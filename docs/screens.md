# LIG-4 Online: Mapa de telas

Este documento lista todas as telas do fluxo, organizadas por categoria. Cada tela tem um ID (T01 a T12), que é usado em nomes de arquivo, em `DESIGN.md` e em relatórios.

Status possíveis:
- **Pronta**: implementada no projeto novo.
- **Porte**: existe no legado, a ser adaptada para o projeto novo.
- **Nova**: sem correspondência no legado; a definir ou a desenhar.
- **Fora do escopo**: não entra na fase atual.

Telas do legado (`docs/legacy/index.html`) são mapeadas por seção no fim do documento.

---

## Autenticação

### T01 · Boas-vindas
- **Arquivo:** `html/t01-boas-vindas.html`
- **Objetivo:** apresentar o produto e levar ao login ou cadastro.
- **Elementos:** barra lateral (logo, Entrar, Cadastrar), tabuleiro decorativo estático (SVG próprio, grade 7x6), título, subtítulo, logo acima do CTA.
- **Navegação:** Entrar → T02; Cadastrar → T03.
- **Status:** Pronta.

### T02 · Login
- **Arquivo:** `html/t02-login.html`
- **Objetivo:** autenticar usuário existente.
- **Elementos:** logo centralizado, campos de e-mail e senha com ícone, botão de olho, texto de ajuda da senha, botão primário claro (largura total), link para cadastro.
- **Navegação:** sucesso → T04; link cadastro → T03; voltar → T01.
- **Dados:** `services/auth.js` (`login`).
- **Status:** Pronta.

### T03 · Cadastro
- **Arquivo:** `html/t03-cadastro.html`
- **Objetivo:** criar conta nova.
- **Elementos:** campos de e-mail, senha e confirmação; texto de recomendação da senha (não bloqueia); seta de voltar; link para login.
- **Navegação:** sucesso → T04; link login → T02; voltar → T01.
- **Dados:** `services/auth.js` (`register`).
- **Status:** Pronta.

---

## Navegação principal

Todas as telas desta categoria usam a barra de navegação global (desktop: lateral fixa; mobile: barra no topo). Itens: Jogar, Loja, Histórico, Perfil. Sair fica no rodapé da barra.

### T04 · Home
- **Arquivo:** `html/t04-home.html`
- **Objetivo:** hub principal após autenticação.
- **Elementos:** logo, CTA principal "Jogar" (botão de fundo claro), bloco de resumo do jogador (nick, vitórias e derrotas recentes), atalho para Loja, painel de notícias e banners (**a definir**).
- **Navegação:** Jogar → T05; Loja → T11; Perfil → T10; Histórico → T12; Sair → T01.
- **Dados:** `services/auth.js` (`getCurrentUser`); resumo de partidas a definir em `services/`.
- **Legado:** sem tela equivalente; o splash `#intro-screen` (`index.html:26`) é apenas abertura do jogo e não substitui a Home.
- **Status:** Nova (baixa fidelidade pronta no documento de direção).

### T05 · Jogar
- **Arquivo:** `html/t05-jogar.html`
- **Objetivo:** escolher como iniciar ou entrar em uma partida online.
- **Elementos:** opções "Criar uma sala" e "Entrar em uma sala", com destaque visual para partida rápida em relação a salas privadas (decisão registrada no slide).
- **Navegação:** Criar sala → T06; Entrar em sala → T07; Voltar → T04.
- **Legado:** correspondência direta com `#mode-screen` (`index.html:117`) e `#online-screen` (`index.html:224`), que hoje reúne criar/entrar. Modos local e bot ficam fora do escopo online.
- **Status:** Porte.

### T10 · Perfil
- **Arquivo:** `html/t10-perfil.html`
- **Objetivo:** visualizar e editar dados pessoais.
- **Layout:** padrão Discord, em duas colunas.
  - Esquerda: "Editar perfil" com nome, nick e bio. Botão salvar habilitado só com alterações.
  - Direita: cartão de prévia com avatar, nick e estatísticas rápidas (vitórias e derrotas). Abaixo: atalhos para Histórico e Loja.
  - Segurança (e-mail, senha) em seção separada, para não misturar com dados públicos.
- **Mobile:** as colunas viram abas "Dados" e "Prévia".
- **Navegação:** Histórico → T12; Loja → T11.
- **Dados:** `services/auth.js` (`getCurrentUser`, atualização de perfil a definir).
- **Legado:** sem correspondência.
- **Status:** Nova.

### T11 · Loja
- **Arquivo:** `html/t11-loja.html`
- **Objetivo:** catálogo de personalização (avatares, tabuleiros, emotes).
- **Layout:** barra de abas laterais (Avatares, Tabuleiros, Emotes), saldo de moedas no topo, cards com estado (equipado, bloqueado, preço). Banner de destaque no topo da área de conteúdo.
- **Comportamento:** a seção ativa muda conforme a rolagem; o botão "+" de moedas leva a uma tela placeholder.
- **Navegação:** "+" moedas → placeholder de compra (fora do escopo); voltar → T04.
- **Dados:** catálogo e saldo a definir em `services/`.
- **Legado:** `docs/legacy/loja/` (HTML pronto, não funcional). Visual "Chaos" a ser substituído.
- **Status:** Porte (visual) e Nova (lógica de catálogo).
- **Fora do escopo atual:** tela de pagamento e compra real.

### T12 · Histórico
- **Arquivo:** `html/t12-historico.html`
- **Objetivo:** listar partidas já jogadas pelo usuário.
- **Elementos:** abas de filtro (Todos, Favoritos, Ao vivo, Diário, Bot); tabela ou lista com data, adversário, resultado, quantidade de lances e modo; busca.
- **Resultado:** texto "Vitória" ou "Derrota" além da cor (verde claro para vitória, vermelho do tema para derrota), por acessibilidade.
- **Navegação:** item de partida → revisão (a definir, pode ficar para depois).
- **Dados:** `services/` (histórico, a definir).
- **Legado:** sem correspondência.
- **Status:** Nova.

---

## Fluxo de partida

### T06 · Criar sala
- **Arquivo:** `html/t06-criar-sala.html`
- **Objetivo:** criar sala privada e obter PIN.
- **Elementos:** escolha de série (1, 3 ou 5, travada após criação), escolha de cor do dono, botão "Criar sala", PIN de 6 dígitos com destaque visual, botão Voltar.
- **Navegação:** criar → T08 (lobby); voltar → T05.
- **Dados:** `services/rooms.js` (`createRoom`) — **a criar**.
- **Legado:** lógica em `online.js` (criação de sala e PIN); interface em `#online-workspace` (`index.html:224`).
- **Status:** Porte, bloqueado até `services/rooms.js` existir.

### T07 · Entrar em sala
- **Arquivo:** `html/t07-entrar-sala.html`
- **Objetivo:** entrar em sala existente pelo PIN.
- **Elementos:** campo PIN (6 dígitos, só numérico), escolha de cor (diferente do dono), botão "Entrar", botão Voltar.
- **Navegação:** entrar → T08; voltar → T05.
- **Dados:** `services/rooms.js` (`joinRoom`) — **a criar**.
- **Legado:** `online.js` (entrada por PIN); interface em `#online-workspace`.
- **Status:** Porte, bloqueado até `services/rooms.js` existir.

### T08 · Lobby
- **Arquivo:** `html/t08-lobby.html`
- **Objetivo:** aguardar o segundo jogador e iniciar a partida.
- **Elementos:** PIN da sala em destaque, cores dos dois jogadores, indicação de dono, botão "Começar partida" (só dono, só com dois jogadores e cores diferentes), botão Sair da sala. Sem chat (ver conflito em `game-rules.md`).
- **Navegação:** começar → T09; sair → T05.
- **Dados:** `services/rooms.js` (`watchRoom`, `startMatch`, `leaveRoom`) — **a criar**.
- **Legado:** lobby e countdown em `online.js` (`renderLobby`, `startSeriesOnline`). O legado tem chat nesta fase, que contraria o DESIGN.md.
- **Status:** Porte, bloqueado até `services/rooms.js` existir.

### T09 · Partida
- **Arquivo:** `html/t09-partida.html`
- **Objetivo:** jogar a série no tabuleiro e exibir o resultado.
- **Elementos:** tabuleiro 7x6 (alta fidelidade), placar, indicação de turno, PIN da sala (discreto), botão Sair da sala. Barra de navegação global oculta, ou reduzida ao botão Sair.
- **Navegação:** fim da série → T08 ou T05 (conforme ação de replay ou saída); sair → T05.
- **Dados:** `services/rooms.js` (`publishState`, `publishResult`, `requestRematch`) e `js/game/` (regras puras) — **a criar**.
- **Legado:** `#game-container` (`index.html:544`), `script.js` (jogo e regras), `online.js` (sincronização). Visual "Chaos" descartado (efeitos, poderes, confetes).
- **Status:** Porte, bloqueado até regras puras e `services/rooms.js` estarem prontos.
- **Fora do escopo atual:** habilidades (bomba, inversão, gelo, elétrica) e modo bot.

---

## Telas do legado sem correspondência

Estas telas do legado não têm ID no fluxo e ficam fora da fase atual, salvo decisão posterior:

| Tela legada | Referência | Situação |
|---|---|---|
| `#intro-screen` (splash) | `index.html:26` | Descartada: abertura visual do Chaos. T01 cumpre o papel de entrada. |
| `#singleplayer-screen` (contra bot) | `index.html:159` | Fora do escopo: modo bot. |
| `#setup-screen` (jogo local) | `index.html:253` | Fora do escopo: jogo local, não online. |

---

## Pendências que bloqueiam telas
- Estado entre trocas de página (T05 → T06 → T08 → T09): decidir entre `sessionStorage`, URL ou `services/`. Bloqueia T06 em diante.
- Serviço de salas (`services/rooms.js`): bloqueia T06, T07, T08 e T09.
- Regras puras (`js/game/`): bloqueiam T09.
- Autenticação real: fora do escopo; T02 e T03 seguem com mock.