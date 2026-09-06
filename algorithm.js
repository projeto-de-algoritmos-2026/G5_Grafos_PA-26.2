// 0 = caminho livre, 1 = parede
const maze = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

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