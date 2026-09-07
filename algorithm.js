function key(x, y) {
    return x + "," + y
}

function buildGraph(maze) {
    const graph = {}
    const lines = maze.length
    const columns = maze[0].length

    for (let y = 0; y < lines; y++) {
        for (let x = 0; x < columns; x++) {
            if (maze[y][x] === 1) continue
            const currentKey = key(x, y)
            graph[currentKey] = []
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
    return graph
}

function dijkstra(graph, start) {
    const distances = {}, previous = {}, visited = {}
    for (const node in graph) {
        distances[node] = Infinity
        previous[node] = null
    }
    distances[start] = 0

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
            const newDistance = distances[currentNode] + 1
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

function moveMonsterTowardsPlayer(graph, monsterX, monsterY, playerX, playerY) {
    const monsterKey = key(monsterX, monsterY)
    const playerKey = key(playerX, playerY)
    const result = dijkstra(graph, monsterKey)
    const path = getPath(result.previous, monsterKey, playerKey)
    if (path === null || path.length < 2) return {x: monsterX, y: monsterY}
    const [nextX, nextY] = path[1].split(",").map(Number)
    return {x: nextX, y: nextY}
}