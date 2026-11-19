# Alterações aplicadas — LIG-4 Online

Base utilizada: `Prototipo-Lig-4-main (1)(2).zip` enviado nesta conversa.

## Salas e lobby

- A criação de sala oferece somente os modos **Clássico** e **Caos**.
- A seção Série e as opções Melhor de 1/3/5 foram removidas também do modelo de sala.
- A seleção de cor foi movida para o lobby.
- O lobby impede selecionar uma cor já escolhida pelo outro jogador.
- Foi adicionada a confirmação individual de prontidão. A partida só pode começar quando os dois jogadores estiverem prontos; somente o criador pode iniciar.
- A prontidão é cancelada quando a cor ou o tabuleiro da sala é alterado.
- O criador escolhe o tabuleiro entre os que possui. O convidado vê o tabuleiro selecionado mesmo sem possuir/comprar esse item.
- A escolha fica salva na sala (`boardId`) e a tela da partida aplica o tabuleiro compartilhado, sem consultar o inventário do convidado.

## Loja

- A categoria Tabuleiros foi restaurada.
- O tabuleiro Clássico não aparece como produto; continua sendo a opção padrão gratuita.
- Os cinco tabuleiros especiais podem ser comprados e equipados.
- A compra demonstrativa de pacotes de moedas atualiza o saldo local (100, 500 ou 1.000 moedas), sem pagamento real.
- O botão Equipar recebeu contraste visual próprio.

## Outras alterações anteriores incorporadas

- Cadastro com campo Nickname/apelido (3 a 20 caracteres).
- Fundo das telas de autenticação simplificado para remover a mistura de texturas/elementos.
- Título da tela de boas-vindas alterado para “PARTIDAS AO VIVO” e animação de inclinação do tabuleiro suavizada.
- Histórico sem a coluna Lances, com filtros Clássico/Caos e busca funcional por adversário, modo, resultado ou data.
- Largura dos tabuleiros especiais limitada à mesma largura máxima de 680 px do tabuleiro clássico.

## Seleção visual de tabuleiros no lobby

- O criador da sala pode selecionar entre os tabuleiros que possui; o selecionado recebe destaque visual.
- O convidado vê a miniatura e o nome do tabuleiro escolhido pelo criador, mesmo sem possuir o item, mas não pode alterá-lo.
- Mantidas as regras existentes de propriedade, autorização e compartilhamento do tabuleiro da sala.
- Os cartões possuem estados de foco, seleção e layout responsivo para telas menores.
