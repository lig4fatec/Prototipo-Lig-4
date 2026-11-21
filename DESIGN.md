# LIG-4 Online: Guia de design e projeto

## Stack
- HTML, CSS e JavaScript vanilla. Sem build tool.
- Tailwind, Bootstrap, ou outras ferramentas apenas via CDN, sem afetar a estrutura do projeto significativamente.

## Estrutura
```html/          páginas por tela; online.html contém T06 a T09
css/           variables.css, base.css, components.css, theme.css, screens/
js/
  services/    auth, profile, history, store, rooms (mock)
  game/        board, drop, modes, rules (regras puras)
  online/      controller, criar, entrar, lobby, partida, aviso-t05
  ui/          custom-select
  (raiz)       auth-forms, global-nav, room-ui, profile-page, store-page, history-page, coin-shop, player-style
assets/        game/, images/logo/, store/ (avatars, boards, emotes)
docs/          game-rules.md, screens.md, legacy-analysis.md, legado/ (→ legacy/)
tests/         testes de fluxo, modos, partida, perfil, loja, histórico e salas
```

- A criar se necessário: assets/favicon/ e assets/icons/, citados antes e ausentes na árvore.
- A criar na integração: js/config.js.
- Atualizar esta seção sempre que um arquivo for criado ou movido, no mesmo commit.

## Direção visual
- **Referência histórica:** Proposta B (Tabuleiro Minimalista em verde `#18301D`) foi adotada na fase inicial como modelo de implementação básica.
- **Identidade atual (Tema Estilo "Battle Royale" / Vibrante):** O projeto migrou integralmente para uma identidade visual enérgica e vibrante, caracterizada por fundos em degradê azul/roxo escuro com iluminação radial, texturas diagonais, elementos com brilho neon e tipografia marcante (`Lilita One` com apoio de `Arial`).

### Tipografia
- **Títulos, Botões e Destaques:** `"Lilita One", Impact, sans-serif` (fonte principal display adotada na interface).
- **Textos de Apoio e Rótulos Menores:** `Arial, sans-serif` (legibilidade em campos, legendas e descrições).

### Paleta do Tema Principal (Vibrante / "Battle Royale")
Conforme aplicado nas telas ativas (`t04-home`, `t10-perfil`, `t11-loja`, etc.) e visível nas capturas de tela:
- **Fundos (Gradiente & Iluminação):**
  - `--h-bg-1: #12062e` (roxo profundo)
  - `--h-bg-2: #1b0f5c` (índigo escuro)
  - `--h-bg-3: #0b2a7a` (azul noturno)
  - Gradiente linear 135° combinado com luzes radiais em ciano e roxo (`rgba(139, 61, 255, 0.55)` e `rgba(61, 232, 255, 0.35)`).
- **Acentos Neon e Destaques:**
  - Amarelo principal / Botões: `--h-yellow: #ffd400`
  - Laranja de transição: `--h-yellow-2: #ff9d00`
  - Ciano neon (fichas/brilhos): `--h-cyan: #3de8ff`
  - Roxo / Destaques secundários: `--h-purple: #8b3dff`
  - Rosa neon (fichas/badges "Em Breve" / "Popular"): `--h-pink: #ff3d9a`
  - Texto e contraste: `--h-text: #ffffff` e `--h-black: #090514`

### Tokens globais de suporte (`css/variables.css`)
Mantidos no arquivo de variáveis como fonte estrutural e de lógica de partida:
- Fundo estrutural (`--color-background`): `#18301D`
- Primária (`--color-primary`): `#F2B705`
- Destaque (`--color-highlight`): `#E52B2B`
- Texto (`--color-text`): `#FFFFFF`
- Botão escuro (`--color-button-dark`): `#011205`
- Secundária (`--color-secondary`): `#0460D9`
- Texto sobre claro (`--color-primary-text`): `#000000`

### Cores das peças de jogo (`variables.css` e T10 Perfil)
Visíveis na seleção de cores do perfil e no tabuleiro:
- Azul (`--game-color-blue`): `var(--color-secondary)` (`#0460D9`)
- Vermelha (`--game-color-red`): `var(--color-highlight)` (`#E52B2B`)
- Roxa (`--game-color-purple`): `color-mix(in srgb, var(--color-secondary) 55%, var(--color-highlight))` (~`#69488B`)
- Verde (`--game-color-green`): `color-mix(in srgb, var(--color-background) 35%, var(--color-text))` (~`#AEB7B0`)
- Laranja (`--game-color-orange`): `color-mix(in srgb, var(--color-primary) 65%, var(--color-highlight))` (~`#ED8612`)
- Amarela (`--game-color-yellow`): `var(--color-primary)` (`#F2B705`)
- Marrom (`--game-color-brown`): `color-mix(in srgb, var(--color-button-dark) 55%, var(--color-primary))` (~`#6D5C05`)
- Destaque de vitória (`--color-win`): `color-mix(in srgb, var(--color-background) 35%, var(--color-text))` (~`#AEB7B0`)

### Unificação dos Tokens em `variables.css` (Definição Oficial)
Os tokens de `variables.css` passam a refletir oficialmente a nova identidade visual neon/battle royale, alinhando a paleta de fichas e componentes à nova tipografia e visual:

- **Fundo principal** (`--color-background`): `#12062E` (roxo escuro de base, substituindo o verde `#18301D`)
- **Cor primária** (`--color-primary`): `#FFD400` (amarelo vibrante, substituindo `#F2B705`)
- **Destaque** (`--color-highlight`): `#FF3D9A` (rosa neon para badges e ênfase, com vermelho `#E52B2B` reservado para ações críticas/desistência)
- **Texto principal** (`--color-text`): `#FFFFFF`
- **Fundo escuro / Botões escuros** (`--color-button-dark`): `#090514` (preto/roxo profundo, substituindo `#011205`)
- **Secundária / Ação alternativa** (`--color-secondary`): `#8B3DFF` (roxo vibrante para botões e áreas secundárias)
- **Acento Ciano** (`--color-cyan`): `#3DE8FF` (usado em fichas de fundo e realces)
- **Texto sobre fundos claros** (`--color-primary-text`): `#000000`

### Paleta de Fichas e Peças (`--lig-disc-*` e `--game-color-*`)
A paleta de fichas integra-se diretamente ao novo tema visual e à tipografia `Lilita One`:
- **Ficha Amarela** (`--lig-disc-yellow` / `--game-color-yellow`): `#FFD400`
- **Ficha Ciano / Azul** (`--lig-disc-blue` / `--game-color-blue`): `#3DE8FF` (ciano neon) e `#0460D9` (azul clássico)
- **Ficha Rosa / Vermelha** (`--lig-disc-pink` / `--game-color-red`): `#FF3D9A` (fichas de tela) e `#E52B2B` (peça clássica)
- **Peças restantes do jogo:** mantidas com cálculos dinâmicos (`--game-color-purple`, `--game-color-green`, `--game-color-orange`, `--game-color-brown`) e cor de vitória (`--color-win`).

### Cores a confirmar
- Nenhuma cor pendente de confirmação. A decisão do time consolidou a unificação dos tokens em torno da paleta neon vibrante e tipografia `Lilita One`.

## Padrão de fundo (telas de autenticação)
- Padrão repetido (background repeat) com formas simples: casas de tabuleiro com cantos arredondados e círculos que sugerem peças.
- Contraste leve: formas levemente mais claras que o fundo, sem competir com o formulário.
- O fundo pode ter gradiente sutil entre tons próximos do verde.
- Formas em SVG, reutilizando `assets/game/` quando possível.
- Não reproduzir o padrão geométrico de losangos do chess.com.

## Referências de layout (chess.com)
Layout e hierarquia inspirados no chess.com. Cores, tipografia, logo e ilustrações são próprios do LIG-4. Não copiar a identidade visual deles.

**T01 Boas-vindas (desktop)**
- Barra lateral fixa à esquerda, com logo no topo e itens de navegação. Nesta fase, apenas os botões "Entrar" e "Cadastrar" são necessários; a estrutura deve permitir reuso nas demais telas.
- Área principal dividida em duas colunas: à esquerda, um tabuleiro decorativo estático; à direita, título, subtítulo e botão de ação.
- Título em destaque, subtítulo menor e um botão largo de Call-to-Action.
- Tabuleiro: imagem estática (SVG próprio, grade 7x6), sem peças em posição de partida e sem destaques de lance, para não ser confundido com um tabuleiro real.
- Logo também aparece acima do Call-to-Action.

**T02 Login e T03 Cadastro (desktop)**
- Fundo com o padrão descrito acima.
- Logo centralizado no topo.
- Formulário em um bloco centralizado, com fundo um tom mais escuro que o da página.
- Campos com ícone à esquerda (e-mail, senha), botão de olho à direita na senha.
- Texto de ajuda da senha abaixo do campo.
- Botão principal de largura total (fundo claro, texto preto).
- Seta de voltar no canto superior esquerdo, nas telas de cadastro.
- Link de rodapé do bloco para alternar entre login e cadastro.

**Layout mobile (todas as telas)**
- A barra lateral vertical vira uma barra horizontal no topo, com logo e botões de ação.
- Conteúdo empilhado: no T01, o tabuleiro fica acima ou abaixo do bloco de texto, sem perder o CTA.
- Formulários ocupam a largura da tela com margens laterais.

## Regras de jogo que afetam a UI
- PIN: exatamente 6 dígitos.
- Série: não há seletor. serie: 1 fixo.
- Cores dos jogadores: únicas na sala. Cor preferida vem do perfil; se houver empate de preferência, o host tem prioridade.
- Lobby: o dono inicia, com dois jogadores, cores diferentes e os dois “prontos”. Sem chat na sala de espera.

## Escopo atual
Ordem de implementação da interface, toda em mock:

- T09 (partida: layout, relógios, desistência, empate, modal de resultado, emote).
- T08 (lobby: cores, prévia de skin, pronto, condição de início).
- T06 e T07 (criação e entrada, com cor do perfil).
- T10, T11 e T12 (perfil, loja, histórico com Clássico e Caos).
- T02 e T03 (validações de formulário).

## Autenticação (fase sem backend)
- Todas as chamadas passam por `js/services/auth.js`, com interface assíncrona.
- Mock em localStorage. Senha em texto puro. Apenas para desenvolvimento.
- Erros são códigos padronizados (ex.: `EMAIL_JA_CADASTRADO`, `CREDENCIAIS_INVALIDAS`), não textos.
- Senha: de 6 a 72 caracteres, validada no cadastro e na confirmação.
- Implementação atual: mock em localStorage. Apenas para desenvolvimento (senha sem hash).
- Ao integrar o backend, trocar a implementação do serviço, sem alterar as telas.

## Convenções
- Botão principal: ação de avanço (Entrar, Cadastrar, Começar partida).
- Botão secundário: voltar ou cancelar.
- Mensagens de erro ao lado do campo, em texto, não apenas por cor.
- Validação ao sair do campo e novamente ao enviar.

## Validações
- E-mail: formato válido.
- Senha: mínimo de 6 caracteres (obrigatório). Sem exigência de composição.
- Texto de ajuda (recomendação, não bloqueio): "Recomendado: use letras maiúsculas e minúsculas, números e símbolos."
- Confirmação de senha: deve ser igual à senha.

## Arquitetura de origem
- Projeto novo é o host. O HTML legado (`docs/legacy/index.html`) é fonte de telas, estrutura e regras.
- Cada tela do fluxo vira um arquivo em `html/`, mesmo que venha da mesma página legada.
- Estado que precisa sobreviver a trocas de tela fica em `js/services/`, não em variáveis globais.
- Visual: sempre `variables.css` e `components.css`. Nada de estilo legado copiado.
- Lógica de jogo: funções puras em `js/game/`, funções puras em js/game/, sem DOM e sem chamadas de rede. 

## Fluxo online (T05 a T09)
- `online.html` é uma única página. T06 (criar), T07 (entrar), T08 (lobby) e T09 (partida) são seções que aparecem e somem via `js/online/controller.js`.
- A URL não muda dentro do fluxo online. Cada seção tem módulo próprio; o controlador só troca visibilidade e estado.
- Ao abrir `online.html`, o controlador lê `{ pin, role }` do `sessionStorage`. Sem sala válida (ausente ou `PIN_NAO_ENCONTRADO`), limpa a chave e volta para T05 com aviso.
- Botão "Voltar" do navegador: decisão pendente. Recomendado: tratar com `history.pushState` por seção, ou bloquear voltar dentro do fluxo e registrar a decisão aqui.
- Layout de T06 a T08 reutiliza os componentes de T05 e `components.css`.

## Escopo do protótipo e decisões
- Fora do escopo: modos Local e contra bot (decisão da liderança); poderes/habilidades; chat na sala de espera (implementação futura).
- Série: "Melhor de 1" é o padrão. Opções 1, 3 e 5 na criação de sala. Semântica de vitória a confirmar com o time.
- Cores: preferência da conta, editável em T10 (perfil). Prévia das duas cores no lobby (T08). Validação de cores diferentes feita no serviço, antes de gravar.
- Estado: `sessionStorage` guarda só `{ pin, role }`, e identificadores de sessão. Dados de sala e partida vêm de `services/rooms.js` (mock nesta fase). Em reload, a sala é recuperada do mock em localStorage. Na integração, do GET /salas/{pin}.

## Cores e skin (novo)
- Cor preferida: definida no perfil (T10), pré-selecionada em T06 e T07. Editável em T06, T07 e T08.
- Conflito de preferência igual: o host tem prioridade. O convidado recebe a primeira cor livre.
- Skin: cada jogador escolhe a própria no perfil. Cada cliente renderiza a própria skin.
- Tabuleiro e peças: iguais para os dois jogadores (uma partida, um estado).

## Limitação da demo (novo)
- Com o mock em localStorage, duas abas do mesmo navegador funcionam; duas máquinas não.
- A demo com duas máquinas só existe depois da integração com API e WebSocket.