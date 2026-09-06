const maze = generateMaze(Columns, Lines);

function key(x, y) {
    return x + "," + y;
}

function buildGraph(maze) {
    const graph = {};
    const lines = maze.length;       
    const columns = maze[0].length;  

    for (let y = 0; y < lines; y++) {
        for (let x = 0; x < columns; x++) {

            if (maze[y][x] === 1) continue; // parede

            const currentKey = key(x, y);
            graph[currentKey] = []; // célula livre começa com lista vazia de vizinhos

            // 4 direções possíveis
            const neighbors = [
                { nx: x + 1, ny: y },
                { nx: x - 1, ny: y },
                { nx: x, ny: y + 1 },
                { nx: x, ny: y - 1 },
            ];

            for (const { nx, ny } of neighbors) {
                // verifica se está dentro do grid
                if (nx < 0 || nx >= columns || ny < 0 || ny >= lines) continue;
                // verifica se a vizinha é livre
                if (maze[ny][nx] === 1) continue;

                graph[currentKey].push(key(nx, ny));
            }
        }
    }

    return graph;
}

function dijkstra(graph, start) {
    const distances = {};   
    const previous = {};  
    const visited = {};

    for (const node in graph) {
        distances[node] = Infinity;
        previous[node] = null;
    }
    distances[start] = 0;

    while (true) {
        // escolhe o nó não visitado com a menor distância conhecida
        let currentNode = null;
        let smallestDistance = Infinity;

        for (const node in distances) {
            if (!visited[node] && distances[node] < smallestDistance) {
                smallestDistance = distances[node];
                currentNode = node;
            }
        }

        // se não sobrou nenhum nó alcançável, terminou
        if (currentNode === null) break;

        visited[currentNode] = true;

        // olha os vizinhos do nó atual
        const neighbors = graph[currentNode];
        for (const neighbor of neighbors) {
            if (visited[neighbor]) continue;

            const newDistance = distances[currentNode] + 1; // custo sempre 1 pra andar uma célula

            if (newDistance < distances[neighbor]) {
                distances[neighbor] = newDistance;
                previous[neighbor] = currentNode;
            }
        }
    }

    return { distances, previous };
}

function getPath(previous, start, end) {
    const path = [];
    let currentNode = end;

    // vai voltando até chegar na origem
    while (currentNode !== null) {
        path.push(currentNode);
        currentNode = previous[currentNode];
    }

    path.reverse(); 

    if (path[0] !== start) {
        return null;
    }

    return path;
}

function moveMonsterTowardsPlayer(graph, monsterX, monsterY, playerX, playerY) {
    const monsterKey = key(monsterX, monsterY);
    const playerKey = key(playerX, playerY);

    const result = dijkstra(graph, monsterKey);
    const path = getPath(result.previous, monsterKey, playerKey);

    // monstro para se não tem caminho possível ou se ta na posição do jogador
    if (path === null || path.length < 2) {
        return { x: monsterX, y: monsterY };
    }

    const nextStep = path[1]; // próxima célula na direção do jogador
    const [nextX, nextY] = nextStep.split(",").map(Number);

    return { x: nextX, y: nextY };
}

const player = findRandomOpenCell(maze);
const monster = findRandomOpenCell(maze);

function drawEntity(entity, color) {
    ctx.fillStyle = color;
    ctx.fillRect(entity.x * Cells, entity.y * Cells, Cells, Cells);
}

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawGrid() {
    ctx.strokeStyle = "black";
    for (let i = 0; i < Columns; i++) {
        for (let j = 0; j < Lines; j++) {
            ctx.strokeRect(i * Cells, j * Cells, Cells, Cells);
        }
    }
}

function draw() {
    clearCanvas();
    drawGrid();
    drawEntity(player, "blue");
    drawEntity(monster, "red");
}

const graph = buildGraph(maze); // calculado uma única vez, fora do loop

setInterval(() => {
    const newPosition = moveMonsterTowardsPlayer(graph, monster.x, monster.y, player.x, player.y);

    monster.x = newPosition.x;
    monster.y = newPosition.y;

    draw();
}, 500);

draw();

function generateMaze(columns, lines) {
    // começa tudo como parede
    const maze = [];
    for (let y = 0; y < lines; y++) {
        maze.push(new Array(columns).fill(1));
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function carve(x, y) {
        maze[y][x] = 0; // abre a célula atual

        // as 4 direções, pulando de 2 em 2
        let directions = shuffle([
            { dx: 2, dy: 0 },
            { dx: -2, dy: 0 },
            { dx: 0, dy: 2 },
            { dx: 0, dy: -2 },
        ]);

        for (const { dx, dy } of directions) {
            const nx = x + dx;
            const ny = y + dy;

            // checa se está dentro do grid (deixando 1 célula de margem pra borda)
            if (nx <= 0 || nx >= columns - 1 || ny <= 0 || ny >= lines - 1) continue;

            // se a célula de destino ainda é parede (não visitada)
            if (maze[ny][nx] === 1) {
                // abre a célula "do meio" (a parede entre a atual e a próxima)
                maze[y + dy / 2][x + dx / 2] = 0;
                carve(nx, ny); // continua o DFS a partir dali
            }
        }
    }

    carve(1, 1); // começa no canto superior esquerdo (dentro da borda)

    return maze;
}

function findRandomOpenCell(maze) {
    const openCells = [];

    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
            if (maze[y][x] === 0) {
                openCells.push({ x, y });
            }
        }
    }

    const randomIndex = Math.floor(Math.random() * openCells.length);
    return openCells[randomIndex];
}

function drawMaze(maze) {
    ctx.fillStyle = "black";
    for (let y = 0; y < maze.length; y++) {
        for (let x = 0; x < maze[0].length; x++) {
            if (maze[y][x] === 1) {
                ctx.fillRect(x * Cells, y * Cells, Cells, Cells);
            }
        }
    }
}

function draw() {
    clearCanvas();
    drawGrid();
    drawMaze(maze); // <- adiciona essa linha
    drawEntity(player, "blue");
    drawEntity(monster, "red");
}