# LIG-4 Online: Guia de design e projeto

## Stack
- HTML, CSS e JavaScript vanilla. Sem build tool.
- Tailwind, Bootstrap, ou outras ferramentas apenas via CDN, sem afetar a estrutura do projeto significativamente.

## Estrutura
- `html/`: uma página por tela (`t01-boas-vindas.html`, `t02-login.html`, `t03-cadastro.html`).
- `css/`: `variables.css` (tokens em `:root`), `base.css`, `components.css`, `screens/`.
- `js/services/`: camada de dados (`auth.js` com mock em localStorage).
- `js/`: validação de formulários e navegação.
- `assets/images/logo/`: logo da Proposta B.
- `assets/favicon/`: favicon derivado do logo.
- `assets/icons/`: ícones de interface (olho da senha, seta de voltar, etc.).
- `assets/game/`: peças e tabuleiro em SVG (também usados no padrão de fundo).

## Direção visual
Proposta B: Tabuleiro Minimalista. Escolhida por praticidade de implementação.
A Proposta A (Cyberpunk Neon) pode ser retomada se o time mudar de decisão.

Cores (definidas em `variables.css`):
- Fundo principal: #18301D (com gradiente sutil, variação entre tons próximos)
- Cor principal (botão de fundo claro, texto preto): #F2B705
- Destaque: #E52B2B
- Texto: #FFFFFF
- Botão de fundo escuro (texto branco): #011205
- Botão secundário: #0460D9

Dois tipos de botão:
- Primário claro: fundo #F2B705, texto #000000.
- Primário escuro: fundo #011205, texto #FFFFFF.

Trocar a direção = trocar o bloco de tokens em `variables.css`.

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
- Série: melhor de 1, 3 ou 5; escolhida pelo dono e bloqueada após a criação.
- Cores dos jogadores: não podem repetir.
- Sala de espera: sem chat; só o dono inicia, e apenas com dois jogadores.
- Fluxo e conteúdo seguem os wireframes mestres.

## Escopo atual
T01 (boas-vindas), T02 (login), T03 (cadastro). As demais telas ficam fora deste ciclo.

## Autenticação (fase sem backend)
- Todas as chamadas passam por `js/services/auth.js`, com interface assíncrona.
- Erros são códigos padronizados (ex.: `EMAIL_JA_CADASTRADO`, `CREDENCIAIS_INVALIDAS`), não textos.
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
- Lógica de jogo: funções puras em `js/game/`, sem DOM nem Firebase.

## Escopo do protótipo e decisões
- Fora do escopo: modos Local e contra bot (decisão da liderança); poderes/habilidades; chat na sala de espera (implementação futura).
- Série: "Melhor de 1" é o padrão. Opções 1, 3 e 5 na criação de sala. Semântica de vitória a confirmar com o time.
- Cores: preferência da conta, editável em T10 (perfil). Prévia das duas cores no lobby (T08). Validação de cores diferentes feita no serviço, antes de gravar.
- Estado: `sessionStorage` guarda só identificadores da sessão (PIN e papel). Dados de sala e partida vêm de `services/rooms.js`, único arquivo que acessa o Firebase.