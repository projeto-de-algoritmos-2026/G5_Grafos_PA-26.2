function key(x, y) {
    return x + "," + y
}

function cellWeight(cellValue) {
    return cellValue === 3 ? 2 : 1  // água custa 2 turnos, resto custa 1
}

function buildGraph(maze) {
    const graph = {}
    const weights = {}
    const lines = maze.length
    const columns = maze[0].length
    for (let y = 0; y < lines; y++) {
        for (let x = 0; x < columns; x++) {
            if (maze[y][x] === 1) continue
            const currentKey = key(x, y)
            graph[currentKey] = []
            weights[currentKey] = cellWeight(maze[y][x])
            const neighbors = [
                {nx: x+1, ny: y}, {nx: x-1, ny: y},
                {nx: x, ny: y+1}, {nx: x, ny: y-1}
            ]
            for (const {nx, ny} of neighbors) {
                if (nx < 0 || nx >= columns || ny < 0 || ny >= lines) continue
                if (maze[ny][nx] === 1) continue
                graph[currentKey].push(key(nx, ny))
            }
        }
    }
    return { graph, weights }
}

function dijkstra(graph, start, weights) {
    return dijkstraMulti(graph, [start], weights)
}

function dijkstraMulti(graph, starts, weights) {
    const distances = {}, previous = {}, visited = {}
    for (const node in graph) {
        distances[node] = Infinity
        previous[node] = null
    }
    for (const start of starts) {
        distances[start] = 0
    }
    while (true) {
        let currentNode = null, smallestDistance = Infinity
        for (const node in distances) {
            if (!visited[node] && distances[node] < smallestDistance) {
                smallestDistance = distances[node]
                currentNode = node
            }
        }
        if (currentNode === null) break
        visited[currentNode] = true
        for (const neighbor of graph[currentNode]) {
            if (visited[neighbor]) continue
            const edgeWeight = weights ? weights[neighbor] : 1
            const newDistance = distances[currentNode] + edgeWeight
            if (newDistance < distances[neighbor]) {
                distances[neighbor] = newDistance
                previous[neighbor] = currentNode
            }
        }
    }
    return { distances, previous }
}

function getPath(previous, start, end) {
    const path = []
    let currentNode = end
    while (currentNode !== null) {
        path.push(currentNode)
        currentNode = previous[currentNode]
    }
    path.reverse()
    if (path[0] !== start) return null
    return path
}

function moveMonsterTowardsPlayer(graph, weights, monsterX, monsterY, playerX, playerY) {
    const monsterKey = key(monsterX, monsterY)
    const playerKey = key(playerX, playerY)
    const result = dijkstra(graph, monsterKey, weights)
    const path = getPath(result.previous, monsterKey, playerKey)
    if (path === null || path.length < 2) return {x: monsterX, y: monsterY}
    const [nextX, nextY] = path[1].split(",").map(Number)
    return {x: nextX, y: nextY}
}

function removeEdge(graph, nodeA, nodeB) {
    const newGraph = {}
    for (const node in graph) {
        newGraph[node] = [...graph[node]] 
    }
    newGraph[nodeA] = newGraph[nodeA].filter(n => n !== nodeB)
    newGraph[nodeB] = newGraph[nodeB].filter(n => n !== nodeA)
    return newGraph
}

function pathsEqual(pathA, pathB) {
    return pathA.join("|") === pathB.join("|")
}

function getTopKPaths(graph, weights, start, end, k = 3) {
    const results = []
    const candidates = []

    // 1º melhor caminho
    const firstResult = dijkstra(graph, start, weights)
    const firstPath = getPath(firstResult.previous, start, end)
    if (firstPath === null) return results // nem o primeiro existe
    results.push({ path: firstPath, cost: firstResult.distances[end] })

    while (results.length < k) {
        const lastPath = results[results.length - 1].path

        // remove cada aresta do último melhor caminho encontrado, uma de cada vez
        for (let i = 0; i < lastPath.length - 1; i++) {
            const modifiedGraph = removeEdge(graph, lastPath[i], lastPath[i + 1])
            const result = dijkstra(modifiedGraph, start, weights)
            const path = getPath(result.previous, start, end)

            if (path === null) continue

            const alreadyFound = results.some(r => pathsEqual(r.path, path))
            const alreadyCandidate = candidates.some(c => pathsEqual(c.path, path))
            if (!alreadyFound && !alreadyCandidate) {
                candidates.push({ path, cost: result.distances[end] })
            }
        }

        if (candidates.length === 0) break // não há mais caminhos alternativos

        candidates.sort((a, b) => a.cost - b.cost)
        results.push(candidates.shift()) // pega o mais barato e tira da lista de candidatos
    }

    return results
}

function addLoops(maze, columns, lines, loopChance = 0.05) {
    for (let y = 1; y < lines - 1; y++) {
        for (let x = 1; x < columns - 1; x++) {
            if (maze[y][x] !== 1) continue // já é caminho, pula

            // conta quantos vizinhos livres essa parede tem
            const openNeighbors = [
                maze[y-1][x], maze[y+1][x], maze[y][x-1], maze[y][x+1]
            ].filter(v => v === 0).length

            // parede entre exatamente 2 corredores (não é canto/cruzamento) vira caminho com chance pequena
            if (openNeighbors === 2 && Math.random() < loopChance) {
                maze[y][x] = 0
            }
        }
    }
}

// --- dica pro jogador: mostra os 3 melhores caminhos até a saída ---
let showHint = false
let hintPaths = []

function toggleHint(graph, weights, player, exit) {
    showHint = !showHint
    if (showHint) {
        hintPaths = getTopKPaths(graph, weights, key(player.x, player.y), key(exit.x, exit.y), 3)
    }
}

function drawHintPaths() {
    if (!showHint || hintPaths.length === 0) return

    const colors = ['rgba(0,255,0,0.45)', 'rgba(255,255,0,0.35)', 'rgba(255,0,255,0.3)']

    hintPaths.forEach((result, i) => {
        ctx.fillStyle = colors[i % colors.length]
        for (const cellKey of result.path) {
            const [x, y] = cellKey.split(",").map(Number)
            ctx.fillRect(x * Cells + Cells * 0.15, y * Cells + Cells * 0.15, Cells * 0.7, Cells * 0.7)
        }
    })
}

// Verifica se existe pelo menos um caminho do início até a saída sem passar por nenhuma ponte
function hasSafePath(maze, startX, startY, exitX, exitY) {
    const lines = maze.length
    const columns = maze[0].length
    const safeGraph = {}

    for (let y = 0; y < lines; y++) {
        for (let x = 0; x < columns; x++) {
            // Trata paredes (1) E pontes (4) como inacessíveis para o teste seguro
            if (maze[y][x] === 1 || maze[y][x] === 4) continue
            
            const currentKey = key(x, y)
            safeGraph[currentKey] = []
            
            const neighbors = [
                {nx: x+1, ny: y}, {nx: x-1, ny: y},
                {nx: x, ny: y+1}, {nx: x, ny: y-1}
            ]
            for (const {nx, ny} of neighbors) {
                if (nx < 0 || nx >= columns || ny < 0 || ny >= lines) continue
                if (maze[ny][nx] === 1 || maze[ny][nx] === 4) continue
                safeGraph[currentKey].push(key(nx, ny))
            }
        }
    }

    const startKey = key(startX, startY)
    const exitKey = key(exitX, exitY)
    
    // Se o ponto inicial ou final não existirem no grafo seguro, não há caminho
    if (!safeGraph[startKey] || !safeGraph[exitKey]) return false

    const result = dijkstra(safeGraph, startKey, null)
    return result.distances[exitKey] !== Infinity
}