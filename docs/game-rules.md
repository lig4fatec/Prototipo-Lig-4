# LIG-4 Online: Regras de jogo

Este documento lista as regras do jogo, extraídas do legado (`docs/legado/`) e cruzadas com o `DESIGN.md`. Regras em conflito estão marcadas como **A DECIDIR**. Não implemente uma regra marcada assim sem decisão registrada aqui.

Campos por regra: descrição, origem no legado, pureza (pura = sem DOM nem Firebase), status.

---

## Vitória
- **Descrição:** quatro peças consecutivas na horizontal, vertical ou diagonal do mesmo jogador.
- **Origem:** `script.js:1942-1970, 2114-2238` (`findWinningLine`).
- **Pureza:** lê estado global (`boardState`); a lógica é pura, mas a assinatura não. Refatorar para receber a matriz.
- **Status:** conforme DESIGN.md.

## Empate
- **Descrição:** tabuleiro cheio sem vitória.
- **Origem:** `script.js:2372-2382` (`checkDraw`).
- **Pureza:** lê estado global.
- **Status:** conforme DESIGN.md.

## Validade da jogada
- **Descrição:** a jogada só é válida com partida ativa, nenhuma peça caindo, turno permitido (online e bot), coluna não congelada e espaço livre na coluna.
- **Origem:** `script.js:1841-1912, 2001-2053` (`dropPiece`, `getAvailableRow`).
- **Pureza:** acoplada a estado global, DOM e, no online, à ponte com Firebase.
- **Status:** **A DECIDIR.** O DESIGN.md não define regras de turno nem de congelamento de coluna. O congelamento vem das habilidades do Chaos, que estão fora do escopo. Decidir se o protótipo mantém apenas turno e coluna cheia.

## Queda da peça
- **Descrição:** a peça cai na primeira célula livre de baixo para cima. Há um atraso de 350 ms (`DROP_TIME`) antes de atualizar a matriz.
- **Origem:** `script.js:7, 1878-1992, 2001-2042`.
- **Pureza:** acoplada a globals, geometria do DOM e timer.
- **Status:** **A DECIDIR.** O atraso de animação é visual. Manter ou remover no protótipo.

## PIN
- **Descrição:** código numérico de seis dígitos. A entrada aceita no máximo seis dígitos e remove caracteres não numéricos.
- **Origem:** `online.js:96-112, 204-220, 272-283`.
- **Pureza:** a validação por regex é pura; geração e consulta dependem de Firebase e de input DOM.
- **Status:** conforme DESIGN.md.

## Série
- **Descrição:** opções 1, 3 e 5 partidas, escolhidas pelo dono ao criar a sala.
- **Origem:** `index.html:206-208, 422-432`; `script.js:986, 1226-1279, 3549-3579`; `online.js:160-182, 239-253, 762-775`.
- **Pureza:** acoplada a DOM, globals e Firebase.
- **Status:** **A DECIDIR.** Os valores batem com o DESIGN.md, mas o legado encerra a série por número de partidas (`currentMatch < totalMatches`), e não quando alguém atinge a maioria. Pergunta ao time: "melhor de 3" significa maioria de vitórias ou exatamente 3 partidas?

## Cores dos jogadores
- **Descrição:** cada jogador escolhe uma cor; duas pessoas não podem ter a mesma cor. O legado oferece sete cores.
- **Origem:** `script.js:838-895, 1226-1257`; `online.js:283-304, 357-380, 618-632`.
- **Pureza:** acoplada a DOM, globals e Firebase.
- **Status:** conforme DESIGN.md na entrada e no início da partida. **A DECIDIR:** no lobby, o legado grava temporariamente cores repetidas. Decidir se a validação passa a ocorrer no próprio serviço, antes de gravar.

## Sala de espera
- **Descrição:** a sala fica em fase `waiting`; só o dono inicia, e só com segundo jogador e cores diferentes.
- **Origem:** `online.js:239-255, 375-420, 618-632`.
- **Pureza:** acoplada a Firebase e DOM.
- **Status:** dono e dois jogadores conforme DESIGN.md.
- **Conflito:** o legado tem chat na sala, e o DESIGN.md diz "sem chat". **A DECIDIR:** remover o chat do protótipo (recomendado pelo DESIGN.md) ou mantê-lo e atualizar o documento.

---

## Pendências
- Série: confirmar a semântica de "melhor de" com o time. --> Melhor de "1" é o padrão. Semântica de vitória à ver com o time.
- Validade da jogada: confirmar quais restrições valem sem habilidades. --> Havilidades estão fora do escopo desse protótipo.
- Queda da peça: confirmar se a animação entra no protótipo. --> Entra.
- Cores no lobby: decidir onde a validação acontece. --> Na tela do perfil, loja (se for item desbloqueável), e antes da partida começar. 
- Chat: decidir se sai do protótipo. --> Sai do protótipo, pode entrar depois como atualização futura.
