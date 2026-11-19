# LIG-4 Online: Mapa de telas

Este documento lista todas as telas do fluxo, organizadas por categoria. Cada tela tem um ID (T01 a T12), que é usado em nomes de arquivo, em `DESIGN.md` e em relatórios.

Status possíveis:
- **Pronta**: implementada no projeto novo.
- **Porte**: existe no legado, a ser adaptada para o projeto novo.
- **Nova**: sem correspondência no legado; a definir ou a desenhar.
- **Fora do escopo**: não entra na fase atual.

Telas do legado (`docs/legacy/index.html`) são mapeadas por seção no fim do documento.

Nesta fase, todas as telas com dados usam mock (ver DESIGN.md, “Mock × API”). Os endpoints citados são contrato para a etapa de integração, não dependência atual. A pasta do legado será renomeada de docs/legado/ para docs/legacy/. Enquanto isso, as referências usam o nome atual.

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
- **Dados:** `services/auth.js` (`login`), mock em localStorage, com senha em texto puro. Apenas para desenvolvimento.
- **Status:** Pronta (mock).

### T03 · Cadastro
- **Arquivo:** `html/t03-cadastro.html`
- **Objetivo:** criar conta nova.
- **Elementos:** campos de e-mail, senha e confirmação; texto de recomendação da senha (não bloqueia); seta de voltar; link para login.
- **Navegação:** sucesso → T04; link login → T02; voltar → T01.
- **Dados:** `services/auth.js` (`register`), mock.
- **Status:** Pronta (mock).

---

## Navegação principal

Todas as telas desta categoria usam a barra de navegação global (desktop: lateral fixa; mobile: barra no topo). Itens: Jogar, Loja, Histórico, Perfil. Sair fica no rodapé da barra.

### T04 · Home
- **Arquivo:** `html/t04-home.html`
- **Objetivo:** hub principal após autenticação.
- **Elementos:** logo, CTA principal "Jogar" (botão de fundo claro), bloco de resumo do jogador (nick, vitórias e derrotas recentes), atalho para Loja, painel de notícias e banners (**a definir**).
- **Navegação:** Jogar → T05; Loja → T11; Perfil → T10; Histórico → T12; Sair → T01.
- **Dados:** mock. Vitórias, derrotas e partidas recentes saem de `services/profile.js` e `services/history.js`. Nome vem de `getCurrentUser` em `services/auth.js`.
- **Legado:** sem tela equivalente; o splash `#intro-screen` (`index.html:26`) é apenas abertura do jogo e não substitui a Home.
- **Status:** Pronta (mock).

### T05 · Jogar
- **Arquivo:** `html/t05-jogar.html`
- **Objetivo:** escolher como iniciar ou entrar em uma partida online.
- **Elementos:** opções "Criar uma sala" e "Entrar em uma sala".
- **Navegação:** Criar sala → T06; Entrar em sala → T07; Voltar → T04.
- **Legado:** correspondência direta com `#mode-screen` (`index.html:117`) e `#online-screen` (`index.html:224`), que hoje reúne criar/entrar. Modos local e bot ficam fora do escopo online.
- **Status:** Porte (mock).

### T10 · Perfil
- **Arquivo:** `html/t10-perfil.html`
- **Objetivo:** visualizar e editar dados pessoais.
- **Layout:** Duas colunas. Esquerda: nick (até 20), nome completo (até 100) e bio (até 280). Direita: prévia com avatar, nick e estatísticas. Abaixo: atalhos para Histórico e Loja. Segurança (e-mail e senha) em seção separada. No mobile, as colunas viram abas “Dados” e “Prévia”.
- **Preferências**:
- * Cor preferida: seletor com nomes em português. O valor guardado é blue, red, purple, green, orange, yellow ou brown.
- * Skin do tabuleiro: escolher entre as compradas (equipados.board).
- **Avatar/Foto de Perfil**: equipados.avatar vem da loja. Um campo de avatar no perfil não existe na API; se for necessário, pedir ao back-end.
- **Navegação:** Histórico → T12; Loja → T11.
- **Dados:** mock (perfil, loja e equipados).
- **Legado:** sem correspondência.
- **Status:** Nova (mock).

### T11 · Loja
- **Arquivo:** `html/t11-loja.html`
- **Objetivo:** catálogo de personalização (avatares, tabuleiros, emotes).
- **Layout:** barra de abas laterais (Avatares, Tabuleiros, Emotes), saldo de moedas no topo, cards com estado (equipado, bloqueado, preço). Banner de destaque no topo da área de conteúdo.
- **Comportamento:** a seção ativa muda conforme a rolagem; o botão "+" de moedas leva a uma tela placeholder.
- **Navegação:** "+" moedas → placeholder de compra (fora do escopo); voltar → T04.
- **Dados:** mock nesta fase, incluindo saldo, compra, equipar e pacotes de moedas simulados. A loja inteira troca de fonte de uma vez, na integração.
- **Legado:** `docs/legacy/loja/` (HTML pronto, não funcional). Visual "Chaos" a ser substituído.
- **Chaves de equipados**: avatar, board e emote. Os IDs de categorias ainda não estão documentados pelo back-end.
- **Status:** Porte (visual) e Nova (lógica de catálogo).
- **Fora do escopo atual:** tela de pagamento e compra real.

### T12 · Histórico
- **Arquivo:** `html/t12-historico.html`
- **Objetivo:** listar partidas já jogadas pelo usuário.
- **Elementos:** abas de filtro (Todos, Clássico e Caos); tabela ou lista com data, adversário, resultado, e modo; busca.
- **Filtros**: Todos, Clássico e Caos. Os valores internos são classico e caos, guardados no campo modo de cada partida.
- **Resultado:** texto "Vitória", "Derrota", “Empate” além da cor (verde claro para vitória, vermelho do tema para derrota, Cinza claro para empate), por acessibilidade.
- **Navegação:** item de partida → revisão (a definir, pode ficar para depois).
- **Dados:** mock. Cada partida mockada precisa trazer modo, ou o filtro não tem o que comparar.
- **Legado:** sem correspondência.
- **Integração (anotar)**: a API aceita só filtro=todos|online|diario. Quando a integração vier, o filtro de modo será feito no cliente sobre a lista de todos.
- **Status:** Nova.

---

## Fluxo de partida / Seção de html/online.html

### T06 · Criar sala
- **Arquivo:** `Seção de html/online.html`
- **Objetivo:** criar sala privada e obter PIN.
- **Elementos:** Elementos: modo (Clássico ou Caos), cor pré-selecionada do perfil (editável), botão “Criar sala”, PIN com destaque visual, botão Voltar. Sem seletor de série.
- **Navegação:** criar → T08 (lobby); voltar → T05.
- **Dados:** mock em `services/rooms.js` (`createRoom`). O mock segue o formato da API (`serie: 1`, cor em inglês), para que a troca de fonte seja localizada.
- **Modo**: mock, porque a API não tem campo para ele.
- **Legado:** lógica em `online.js` (criação de sala e PIN); interface em `#online-workspace` (`index.html:224`).
- **Status:** Porte, bloqueado até `services/rooms.js` existir.

### T07 · Entrar em sala
- **Arquivo:** `Seção de html/online.html`
- **Objetivo:** entrar em sala existente pelo PIN.
- **Elementos:** campo de PIN (6 dígitos numéricos), cor pré-selecionada do perfil (editável), botão “Entrar”, botão Voltar.
- **Regra de cor**: se a cor do perfil estiver ocupada, o convidado recebe a primeira cor livre, sem bloqueio.
- **Navegação:** entrar → T08; voltar → T05.
- **Dados:** mock em `services/rooms.js` (joinRoom). Erros simulados: `PIN_NAO_ENCONTRADO`, `SALA_CHEIA`, `COR_JA_ESCOLHIDA`.
- **Legado:** `online.js` (entrada por PIN); interface em `#online-workspace`.
- **Status:** Porte.

### T08 · Lobby
- **Arquivo:** `Seção de html/online.html`
- **Objetivo:** aguardar o segundo jogador e iniciar a partida.
- **Elementos:** PIN em destaque, Nome e cor dos dois jogadores, com indicação de dono, Prévia da skin do próprio jogador, Seletor de cor, com as cores ocupadas desabilitadas, Botão “Pronto” de cada jogador (alterna), Botão “Começar partida”, Botão Sair. Sem chat.
- **Condição para “Começar partida”**: só o dono; dois jogadores na sala; cores diferentes; os dois marcados como “prontos”. Em qualquer outro caso, o botão fica desabilitado.
- **Navegação:** começar → T09; sair → T05.
- **Dados:** mock em `services/rooms.js` (`watchRoom`, `setCor`, `setPronto`, `startMatch`, `leaveRoom`). O polling de dois em dois segundos vira atualização do mock.
- **Legado:** lobby e countdown em `online.js` (`renderLobby`, `startSeriesOnline`). O legado tem chat nesta fase, que contraria o DESIGN.md.
- **Status:** Porte, bloqueado até `services/rooms.js` existir.

### T09 · Partida
- **Arquivo:** `Seção de html/online.html`
- **Objetivo:** jogar a série no tabuleiro e exibir o resultado.
- **Elementos:** tabuleiro 7x6 (alta fidelidade), placar, indicação de turno, PIN da sala (discreto), botão Sair da sala. Barra de navegação global oculta, ou reduzida ao botão Sair.
- **Relógios (mock)**: 5:00 cada. Só corre na própria vez. Se zerar, perde.
- **Modal de resultado (novo)**: aparece ao fim da partida, com vencedor, empate ou desistência, e o placar. Dois botões: “Revanche” e “Sair”.
- **Revanche**: cria uma nova partida na mesma sala. A tela continua em T09, com novo partidaId e placar mantido. Quem começa alterna. Não volta para T08, porque a sala já está em jogo.
- **Navegação:** modal → Revanche (T09, nova partida) ou Sair (T05).
- **Dados:** mock em `services/rooms.js` (partida, relógio, desistência, empate, emote) e `js/game/` (regras puras).
- **Legado:** `#game-container` (`index.html:544`), `script.js` (jogo e regras), `online.js` (sincronização). Visual "Chaos" descartado (efeitos, poderes, confetes).
- **Limitação da demo (mock)**: emote, empate e desistência só aparecem entre abas do mesmo navegador. Duas máquinas exigem a integração.
- **Status:** Porte (mock), com layout novo a implementar.
- **Fora do escopo atual:** habilidades (bomba, inversão, gelo, elétrica) e modo bot.

---

## Telas do legado sem correspondência ("origem de T05 a T09")

Estas telas do legado não têm ID no fluxo e ficam fora da fase atual, salvo decisão posterior:

| Tela legada | Referência | Situação |
|---|---|---|
| `#intro-screen` (splash) | `index.html:26` | Descartada: abertura visual do Chaos. T01 cumpre o papel de entrada. |
| `#singleplayer-screen` (contra bot) | `index.html:159` | Fora do escopo: modo bot. |
| `#setup-screen` (jogo local) | `index.html:253` | Fora do escopo: jogo local, não online. |

---

## Pendências
- Emote, empate e desistência em partida real: contrato no WebSocket.
- Pacote de moedas: confirmar a compra simulada com o professor.
- Botão Voltar do navegador dentro do fluxo online: decisão pendente (ver DESIGN.md).
- Resolvidas: pronto no lobby (ambos), série (serie: 1), autenticação (mock nesta fase), filtro do histórico (Clássico e Caos).

## Fora do escopo
Decisões da liderança (GP/Proj Mgr). Não entram nesta fase, salvo mudança de decisão.

- **Habilidades do legado (bomba, inversão, gelo, elétrica)**: fora do escopo.
- **Poderes da demo (Congelar Coluna, Queimar Peça, Peça Extra)**: no escopo, conforme game-rules.md, em mock.
- **Modos Local e contra bot**: fora do escopo, decisão da liderança.
- **Chat na sala de espera e partida rápida**: implementação futura.
- **Pagamento real**: fora do escopo.