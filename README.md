# G5_Grafos_PA-26.2

# 🏚️ Monsters

Projeto da disciplina de **Projeto de Algoritmos** (UnB/FGA) — um labirinto gerado proceduralmente onde monstros usam **Dijkstra** para perseguir o jogador, que precisa escapar por uma saída antes de ser capturado.

<img width="941" height="907" alt="image" src="https://github.com/user-attachments/assets/6d37768e-c173-4780-bbe4-708b17c4b51a" />


## Vídeo de demonstração

https://youtu.be/B91ddTWNmyY?is=ei1tJEiak_TQSjBq




## Como jogar

Abra o `index.html` no navegador (recomendado usar a extensão **Live Server** do VS Code) e use as teclas:

| Tecla | Ação |
|---|---|
| ⬆️ ⬇️ ⬅️ ➡️ | Mover o jogador |
| `H` | Mostrar/esconder os 3 melhores caminhos até a saída |

**Objetivo:** chegar até a porta 🚪 antes que um dos monstros te alcance.

## Mecânicas do jogo

- **Labirinto gerado aleatoriamente** a cada partida (nunca é o mesmo mapa duas vezes)
- **6 monstros** perseguindo o jogador simultaneamente, cada um recalculando o caminho mais curto a cada movimento
- **Mangas coletáveis** 🥭 — cada uma vale 50 pontos
- **Água** — prende o jogador por um turno ao entrar
- **Pontes** — 20% de chance de quebrar e encerrar o jogo ao atravessar
- **Garantia de mapa justo** — o jogo gera o labirinto e testa até 100 vezes se existe pelo menos um caminho seguro (sem pontes) até a saída antes de liberar a partida
- **Dica de caminho** (`H`) — mostra os 3 melhores caminhos até a saída, sobrepostos em cores diferentes

## Algoritmos implementados

O projeto é centrado na ideia de que **um labirinto é um grafo**: cada célula livre é um nó, e cada par de células vizinhas sem parede entre elas é uma aresta.

| Algoritmo | Onde é usado | O que resolve |
|---|---|---|
| **DFS randomizado (recursivo, com backtracking)** | `generateMaze` | Gera um labirinto novo a cada partida, "cavando" caminho célula por célula e voltando quando não há mais para onde ir |
| **Dijkstra (ponderado)** | `dijkstra` / `dijkstraMulti` | Calcula a menor distância entre pontos do labirinto, considerando peso maior para células de água |
| **Dijkstra com múltiplas origens** | `dijkstraMulti`, usado em `placeExit` | Encontra a posição de saída mais distante de **todos** os 6 monstros simultaneamente, numa única execução |
| **Reconstrução de caminho** | `getPath` | A partir do resultado do Dijkstra, reconstrói o caminho célula a célula entre dois pontos |
| **Persecução dinâmica** | `moveMonsterTowardsPlayer` | Cada monstro recalcula o caminho mais curto até o jogador a cada movimento |
| **K-caminhos mais curtos (baseado no algoritmo de Yen)** | `getTopKPaths` | Encontra os 3 melhores caminhos entre o jogador e a saída, removendo arestas do melhor caminho já encontrado para forçar rotas alternativas |
| **Geração de ciclos** | `addLoops` | Um labirinto gerado por DFS puro é uma árvore (só existe 1 caminho entre dois pontos); essa função abre passagens extras para permitir a existência de caminhos alternativos |
| **Verificação de alcançabilidade** | `hasSafePath` | Roda um Dijkstra em uma cópia do grafo sem as pontes, para garantir que sempre existe pelo menos uma rota segura até a saída |

## Estrutura do projeto

```
G5_Grafos_PA-26.2/
├── index.html       # estrutura da página e tela de fim de jogo
├── style.css        # estilo visual
├── game.js          # estado do jogo, desenho no canvas, input do teclado
├── algorithm.js      # grafo, Dijkstra, geração de labirinto, K-caminhos
├── assets/           # sprites do jogo e vídeo de demonstração
└── README.md
```

## Autores

- Luana
- Eduardo

Disciplina de Projeto de Algoritmos — 2026.2
