# LIG-4 Online: Regras de jogo

Documento de referência para regras de partida, sala, lobby, poderes, moedas e cosméticos. Baseado no documento de alinhamento de features. Itens marcados como **A DEFINIR** dependem de decisão do time.

Fonte de verdade: o servidor (ver referência da API). O front exibe o estado e envia ações; validações de regra são feitas no back-end. `js/game/` pode ser usado para renderização e pré-validação de UX, sem substituir a validação do servidor.

---

## 1. Modos de partida

- **Clássico**: regras padrão do Conecta 4. Poderes desabilitados.
- **Caos**: poderes habilitados. 
- Ganho de moedas: em qualquer modo (ver §9).
- O modo é escolhido pelo host na criação. Divergência: POST /salas não tem campo de modo. Até o back-end ter, o modo fica no mock (dropdown com apenas Clássico e Caos).
- Série: removida da criação. serie: 1 fixo. A revanche abre nova série com placar zerado.

## 2. Criação e entrada na sala (substituir)
Criação: POST /salas com {jogadorId, serie: 1, cor}. O seletor de série foi removido; serie é sempre 1. Revanche é a única forma de jogar mais partidas.
Modo (Clássico ou Caos): escolhido pelo host na criação. Divergência: a API não tem campo de modo em POST /salas. Até o back-end aceitar, o modo fica no mock.
Cor: o usuário escolhe a cor ao criar ou entrar, já pré-selecionada com a cor preferida do perfil (T10). Pode trocar no lobby com PUT /salas/{pin}/cor.
Cores (7): azul (blue), vermelho (red), roxo (purple), verde (green), laranja (orange), amarelo (yellow), marrom (brown). Os nomes em inglês são os valores enviados à API; a interface mostra em português.
Cores únicas: dois jogadores não podem ter a mesma cor. O servidor rejeita duplicidade com COR_JA_ESCOLHIDA; o front desabilita as cores ocupadas.
Preferência igual: se o convidado tiver a mesma cor preferida do host, o host tem prioridade. O convidado recebe a primeira cor livre da lista.
Preferência ocupada na entrada: se a cor preferida do convidado estiver ocupada, ele recebe a primeira cor livre, sem bloqueio.
Entrada: POST /salas/entrar com {jogadorId, pin, cor}. PIN de 6 dígitos numéricos. Sala cheia: SALA_CHEIA.
## 3. Lobby (substituir)
Dois jogadores são necessários para iniciar.
Cada jogador marca “pronto”. Divergência: a API não tem estado de pronto. Até o back-end ter, o “pronto” é só mock no front.
Só o dono inicia, com POST /salas/{pin}/iniciar, e apenas com os dois jogadores na sala.
Skin do tabuleiro: cada jogador escolhe a própria skin no perfil (T10). Não há skin de sala nem skin do adversário. Cada cliente lê a própria equipados.board.
Prévia no lobby: mostra a cor e a skin do próprio jogador. O tabuleiro da partida é um só, com posições e cores de peças iguais para os dois.

## 4. Início e fim da partida

- A primeira partida começa pelo dono. A cada revanche, quem começa alterna.
- Vitória: quatro peças em linha (horizontal, vertical ou diagonal).
- Empate: tabuleiro cheio sem vitória OU via proposta de empate.
- Validação de turno e coluna cheia: feita no servidor (FORA_DO_TURNO, COLUNA_CHEIA).
- Regras de poderes (coluna congelada, queima, peça extra): mock no front, porque a API não as tem (ver §8).
- Série: serie: 1 fixo. A API ainda aceita 3 e 5, mas o front não os usa.

## 5. Relógio

- 5:00 fixos por jogador, em todos os modos. Não configurável.
- O relógio de um jogador só corre na sua vez.
- Se um relógio chegar a zero, a partida termina: quem ainda tem tempo vence; quem zerou perde.
- Divergência: a API não tem relógio. Até o back-end ter, é mock no front. Ao integrar, o servidor passa a ser a autoridade do tempo, com contrato novo.
- Controle de tempo no servidor. O front só exibe.

## 6. Desistência

- Qualquer jogador, em qualquer modo, pode desistir a qualquer momento da partida.
- Interface: botão que abre modal de confirmação.
- Efeito: partida encerra como derrota para quem desistiu.

## 7. Proposta de empate

- Cada jogador pode propor empate **uma vez por partida**.
- O adversário aceita ou recusa. Aceito: partida termina em empate.
- Contador por jogador, mantido no servidor.
- Divergência: a API não tem endpoint nem contador. Mock no front até o back-end ter.

## 8. Poderes (apenas no modo Caos)

Regras gerais:
- Poderes só podem ser usados no modo Caos.
- Cada poder pode ser usado **uma vez por jogador, por partida**. Um jogador pode usar os três poderes, cada um uma única vez.
- Poderes só podem ser usados na **vez do próprio jogador**.
- O jogador precisa ter comprado o poder na loja. Para a demo, pode-se liberar todos (decisão de demo, **A DEFINIR**).
- Divergência: a API não tem poderes, categoria na loja nem campo de jogada para eles. Se forem implementados nesta fase, ficam no mock do front.

Poderes:

**Congelar Coluna (700 moedas)**
- Disponível apenas no modo Caos, uma vez por jogador por partida e somente na vez do próprio jogador.
- Bloqueia uma coluna para o adversário por 3 lances dele. Os lances próprios não consomem o bloqueio.
- Não pode ser usado em coluna cheia.
- Cada lance do adversário consome um do bloqueio. Se todas as colunas não cheias estiverem bloqueadas, a vez é pulada e esse lance também é consumido.
- O mock guarda os bloqueios e valida o poder; a integração com o back-end fica para depois.

**Queimar Peça (850 moedas)**
- Remove uma peça colocada pelo adversário.
- Não pode ser usado no primeiro lance da partida (sem peças do adversário).
- Gravidade de Queimar Peça: desligada. As peças acima não caem.

**Peça Extra (1000 moedas)** (antigo "Jogar 2x")
- Permite jogar duas peças seguidas antes do adversário.
- Não pode ser usado quando há apenas 1 espaço livre no tabuleiro.

## 9. Moedas

- Cada jogador começa com 500 moedas.
- Ganho em qualquer modo, creditado ao fim da partida:
- * Vitória: +50
- * Empate: +10
- * Derrota: +10
- Mudança: as regras anteriores (ganho só no Caos, valores de +30, +10 e +5) foram substituídas pelos valores da API.
- Partida abandonada (desistência) não dá moedas, conforme a API. Confirmar essa regra no contrato novo da desistência.
- Compra de moedas: simulada no mock, nesta fase. Pacotes:
- * 100 moedas: R$ 5,00
- * 500 moedas: R$ 20,00 ( 20% de desconto)
- * 1000 moedas: R$ 40,00 ( 10% de desconto)
- Divergência: a API não tem endpoint de crédito de moedas. Ao existir (por exemplo, POST /jogadores/{id}/moedas), a compra troca a chamada local por ela.
- Loja inteira no mock nesta fase: saldo, compra, equipar e skin. Não se mistura fonte de dados na mesma loja.

## 10. Cosméticos

- Tabuleiros: escolhidos pelo próprio jogador no perfil (T10), ou no lobby. Cada cliente renderiza a própria skin.
- Peças: skins de peça previstas, desenvolvidas pelo time de Inovação. **Fora do escopo do prazo atual.**
- Avatares e emotes: seguem o catálogo da loja.

## 11. Escopo por prioridade

- **Prioridade obrigatória:** fluxo online (T04 a T09)
- Cores únicas com preferência do perfil e fallback
- Modo Clássico
- Relógio de 5:00 (mock)
- Desistência (mock)
- Proposta de empate (mock).

**Desejável**
- Modo Caos com poderes (congelar, queimar, peça extra).
- Skin do tabuleiro (decisão b).
- Compra simulada de moedas.

**Fora do escopo**
- Skins de peça.
- Pagamento real.

---

## Pendências (A DEFINIR)

- Modo (Clássico ou Caos) na criação: ausente na API.
- Pronto no lobby: ausente na API.
- Moedas na desistência: confirmar no contrato novo (implementar ganho de +0 moedas no front)
- Limite de empate: (resolvido) um pedido por partida.
- Compra simulada: resolvido (sim, a compra é simulada).
- Gravidade de Queimar Peça: resolvido (desligada).
- Liberação de poderes na demo: resolvido (todos).
- Remover série de vez: resolvido (serie: 1 fixo).
