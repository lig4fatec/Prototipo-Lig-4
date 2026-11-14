# LIG-4 Online: Regras de jogo

Documento de referência para regras de partida, sala, lobby, poderes, moedas e cosméticos. Baseado no documento de alinhamento de features. Itens marcados como **A DEFINIR** dependem de decisão do time.

Fonte de verdade: o servidor (ver referência da API). O front exibe o estado e envia ações; validações de regra são feitas no back-end. `js/game/` pode ser usado para renderização e pré-validação de UX, sem substituir a validação do servidor.

---

## 1. Modos de partida

- **Clássico**: regras padrão do Conecta 4. Poderes desabilitados. Sem ganho gratuito de moedas.
- **Caos**: poderes habilitados. Ganho gratuito de moedas.
- O modo é escolhido pelo **host** na criação da sala (dropdown com apenas Clássico e Caos).
- Série ("melhor de") **removida** da criação de sala. A revanche já existe e abre uma nova série com placar zerado.

## 2. Criação e entrada na sala

- Campos na criação: modo (Clássico ou Caos).
- Série: removida.
- Cor: **escolhida no lobby**, não na criação.
- Cores disponíveis (7): azul, vermelho, roxo, verde, laranja, amarelo, marrom.
- **Cores únicas na sala**: dois jogadores não podem ter a mesma cor. Validação no servidor (`COR_JA_ESCOLHIDA`). O front desabilita as cores já ocupadas, mas não é a fonte de verdade.
- **Cor preferida do perfil**: é só sugestão inicial do host (preferência do host). Ao entrar no lobby:
  - se a cor preferida estiver livre, ela é pré-selecionada;
  - se estiver ocupada, o front usa o fallback: primeira cor livre da lista de cores disponíveis, sem bloquear o jogador;
  - o servidor rejeita qualquer escolha duplicada com `COR_JA_ESCOLHIDA`.
- Entrada por PIN de 6 dígitos numéricos. Sala cheia: `SALA_CHEIA`.

## 3. Lobby

- Dois jogadores são necessários para iniciar.
- Cada jogador marca **"pronto"**. A partida só começa quando os dois estiverem prontos.
- Cada jogador escolhe a cor no lobby (regra da seção 2).
- **Skin do tabuleiro**: decisão (b). O host escolhe a skin, como escolhe o modo. Skins disponíveis: as compradas pelo host na loja.
  - Modelagem: a skin é atributo por jogador na sala (`dono.skin`, `convidado.skin`), mesmo que a regra atual seja de o host escolher. Isso permite migrar para a opção (a) depois sem reestruturação.
- Quem pode iniciar: somente o dono, quando os dois estiverem prontos.

## 4. Início e fim da partida

- A primeira partida começa pelo dono. A cada revanche, quem começa alterna.
- Vitória: quatro peças em linha (horizontal, vertical ou diagonal).
- Empate: tabuleiro cheio sem vitória.
- Validação de jogada (turno, coluna cheia, coluna congelada) é feita no servidor.
- Série: "melhor de N" com N = 1, 3 ou 5 deixou de ser opção de criação. Revisar se a semântica de série volta a ser usada: **A DEFINIR**.

## 5. Relógio

- **5:00 fixos por jogador**, em todos os modos. Não configurável pelo host.
- O relógio de um jogador só corre na sua vez; pausa na vez do adversário.
- Se um relógio chegar a zero, a partida termina: quem ainda tem tempo vence; quem zerou perde.
- Controle de tempo no servidor. O front só exibe.

## 6. Desistência

- Qualquer jogador, em qualquer modo, pode desistir a qualquer momento da partida.
- Interface: botão que abre modal de confirmação.
- Efeito: partida encerra como derrota para quem desistiu.

## 7. Proposta de empate

- Cada jogador pode propor empate **uma vez por partida**. **A DEFINIR:** se o limite passa a ser "a cada X lances".
- O adversário aceita ou recusa. Aceito: partida termina em empate.
- Contador por jogador, mantido no servidor.

## 8. Poderes (apenas no modo Caos)

Regras gerais:
- Poderes só podem ser usados no modo Caos.
- Cada poder pode ser usado **uma vez por jogador, por partida**. Um jogador pode usar os três poderes, cada um uma única vez.
- Poderes só podem ser usados na **vez do próprio jogador**.
- O jogador precisa ter comprado o poder na loja. Para a demo, pode-se liberar todos (decisão de demo, **A DEFINIR**).

Poderes:

**Congelar Coluna (700 moedas)**
- Bloqueia uma coluna para o adversário por 3 rodadas.
- Não pode ser usado em coluna cheia.
- Vale mesmo se restar apenas uma coluna livre.
- O servidor guarda o bloqueio com contagem de rodadas e valida em cada jogada.

**Queimar Peça (850 moedas)**
- Remove uma peça colocada pelo adversário.
- Não pode ser usado no primeiro lance da partida (sem peças do adversário).

**Peça Extra (1000 moedas)** (antigo "Jogar 2x")
- Permite jogar duas peças seguidas antes do adversário.
- Não pode ser usado quando há apenas 1 espaço livre no tabuleiro.

## 9. Moedas

- Cada jogador começa com 500 moedas.
- Ganho gratuito **apenas no modo Caos**, creditado ao fim da partida:
  - Vitória: +30
  - Empate: +10
  - Derrota: +5
- Modo Clássico: sem ganho gratuito.
- Compra de moedas (pacotes, compra simulada, **a confirmar com o professor**):
  - 100 moedas: R$ 5,00
  - 500 moedas: R$ 20,00 (20% de desconto)
  - 1000 moedas: R$ 40,00 (10% de desconto)
- Pagamento real: fora do escopo (inviável no prazo).

## 10. Cosméticos

- Tabuleiros: 5 a 6 skins, escolhidas pelo host (ver seção 3).
- Peças: skins de peça previstas, desenvolvidas pelo time de Inovação. **Fora do escopo do prazo atual.**
- Avatares e emotes: seguem o catálogo da loja.

## 11. Escopo por prioridade (prazo de 12 dias)

**Obrigatório para a demo**
- Fluxo online completo (T04 a T09).
- Cores únicas, com cor preferida como sugestão e fallback.
- Modo Clássico.
- Relógio de 5:00.
- Desistência.
- Proposta de empate.

**Desejável**
- Modo Caos com poderes (congelar, queimar, peça extra).
- Skin do tabuleiro (decisão b).
- Compra simulada de moedas.
- Ganho de moedas no Caos.

**Fora do escopo**
- Skins de peça.
- Pagamento real.

---

## Pendências (A DEFINIR)
- Semântica de série: manter ou remover de vez.
- Limite de propostas de empate: uma por partida ou a cada X lances.
- Liberação de poderes na demo: todos habilitados ou só com compra.
- Compra simulada de moedas: confirmar com o professor.
- **Queimar Peça: gravidade.** Ao remover uma peça da base de uma coluna, as peças acima:
  - (a) caem para preencher o espaço (exige lógica de gravidade no servidor e animação de queda);
  - (b) ficam flutuando (regra mais simples, mas visualmente estranha).
  Decidir antes de implementar o poder. As duas opções têm custo de programação, e a (a) é a mais difícil.