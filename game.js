const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');

const Columns = 35 //teremos 20 colunas (ou ent celulas, e so uma matriz mano)
const Lines = 35 //por enquanto deixei hard coded 20x20 mas dps da pra melhorar
const Cells = 26 //isso aqui e o tamanho dos PIXELS das celulas, as varaveis acima eram o numero de pixels por direcao
canvas.width =  Columns*Cells
canvas.height = Lines*Cells

let maze, player, monsters, graph, weights, exit
let stuck = false  //true quando player tá na água esperando 2º aperto
let gameOver = false
let score = 0

const PLAYER_IMAGE = 'player'
const MONSTER_IMAGES = ['monster1', 'monster2', 'monster3', 'monster4', 'monster5', 'monster6']
const MONSTER_COUNT = 6

const IMAGES = {}
function loadImage(name) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve()
        img.onerror = reject
        img.src = `assets/${name}.png`
        IMAGES[name] = img
    })
}

function loadAssets() {
    const names = ['grass1', 'grass2', 'tree1', 'tree2', 'mango', PLAYER_IMAGE, ...MONSTER_IMAGES]
    return Promise.all(names.map(loadImage))
}

function updateScore() {
    document.getElementById('score').textContent = score
}

function generateMaze(columns, lines){
    const maze=[]
    for(let i=0;i<lines;i++) maze.push(new Array(columns).fill(1))

    function shuffle(array){
        for(let i=array.length-1;i>0;i--){            
            const j = Math.floor(Math.random()*(i+1))
            ;[array[i], array[j]] = [array[j], array[i]]
        }
        return array;
    }

    function carve(x, y) {
        maze[y][x] = 0

        const directions = shuffle([
            {dx: 2, dy: 0},
            {dx: -2, dy: 0},
            {dx: 0, dy: 2},
            {dx: 0, dy: -2}
        ])

        for (const {dx, dy} of directions) {
            const nx = x + dx
            const ny = y + dy
            if (nx <= 0 || nx >= columns-1 || ny <= 0 || ny >= lines-1) continue
            if (maze[ny][nx] === 1) {
                maze[y + dy/2][x + dx/2] = 0
                carve(nx, ny)
            }
        }
    }

    carve(1, 1)
    return maze;
}

function placeExit(maze, graph, weights, playerX, playerY, monsters) {
    const playerStart = key(playerX, playerY)
    const monsterStarts = monsters.map(m => key(m.x, m.y))

    const { distances: distPlayer } = dijkstra(graph, playerStart, weights)
    const { distances: distMonsters } = dijkstraMulti(graph, monsterStarts, weights)

    const candidates = []

    for (let x = 1; x < Columns-1; x++) {
        if (maze[1][x] === 0) {
            const k = key(x, 1)
            if (distPlayer[k] !== Infinity && distPlayer[k] < distMonsters[k])
                candidates.push({x, y: 1})  // saída na célula acessível, não na borda
        }
        if (maze[Lines-2][x] === 0) {
            const k = key(x, Lines-2)
            if (distPlayer[k] !== Infinity && distPlayer[k] < distMonsters[k])
                candidates.push({x, y: Lines-2})
        }
    }
    for (let y = 1; y < Lines-1; y++) {
        if (maze[y][1] === 0) {
            const k = key(1, y)
            if (distPlayer[k] !== Infinity && distPlayer[k] < distMonsters[k])
                candidates.push({x: 1, y})
        }
        if (maze[y][Columns-2] === 0) {
            const k = key(Columns-2, y)
            if (distPlayer[k] !== Infinity && distPlayer[k] < distMonsters[k])
                candidates.push({x: Columns-2, y})
        }
    }

    if (candidates.length === 0) return null
    const exit = candidates.reduce((best, c) => {
    const k = key(c.x, c.y)
    return distPlayer[k] > distPlayer[key(best.x, best.y)] ? c : best
    }, candidates[0])
    maze[exit.y][exit.x] = 2
    return exit
}

function hash2(x, y) {
    const h = Math.sin(x*127.1 + y*311.7) * 43758.5453
    return h - Math.floor(h)
}

function drawWallCell(px, py, x, y) {
    const img = hash2(x, y) > 0.5 ? IMAGES.tree1 : IMAGES.tree2
    ctx.drawImage(img, px, py, Cells, Cells)
}

function drawFloorCell(px, py, x, y) {
    const img = (x + y) % 2 === 0 ? IMAGES.grass1 : IMAGES.grass2
    ctx.drawImage(img, px, py, Cells, Cells)
}

function drawMangoCell(px, py, x, y, time) {
    drawFloorCell(px, py, x, y)
    const bob = Math.sin(time / 250 + x + y) * 2
    ctx.drawImage(IMAGES.mango, px + Cells * 0.1, py + Cells * 0.1 + bob, Cells * 0.8, Cells * 0.8)
}

function drawWaterCell(px, py, time) {
    const grad = ctx.createLinearGradient(px, py, px, py + Cells)
    grad.addColorStop(0, '#2b8fd6')
    grad.addColorStop(1, '#123f66')
    ctx.fillStyle = grad
    ctx.fillRect(px, py, Cells, Cells)

    ctx.save()
    ctx.beginPath()
    ctx.rect(px, py, Cells, Cells)
    ctx.clip()
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'
    ctx.lineWidth = 2
    const phase = time / 400
    for (let w = 0; w < 2; w++) {
        ctx.beginPath()
        const baseY = py + Cells * (0.35 + w * 0.35)
        for (let i = 0; i <= Cells; i += 4) {
            const wave = Math.sin((i / Cells) * Math.PI * 2 + phase + w) * 3
            const wx = px + i
            const wy = baseY + wave
            if (i === 0) ctx.moveTo(wx, wy)
            else ctx.lineTo(wx, wy)
        }
        ctx.stroke()
    }
    ctx.restore()
}

function drawBridgeCell(px, py, x, y) {
    ctx.fillStyle = '#6b4423'
    ctx.fillRect(px, py, Cells, Cells)
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 2
    for (let i = 1; i < 4; i++) {
        const lx = px + (Cells / 4) * i
        ctx.beginPath()
        ctx.moveTo(lx, py + 3)
        ctx.lineTo(lx, py + Cells - 3)
        ctx.stroke()
    }
    if (hash2(x, y) > 0.5) {
        ctx.strokeStyle = 'rgba(0,0,0,0.5)'
        ctx.beginPath()
        ctx.moveTo(px + 4, py + Cells * 0.3)
        ctx.lineTo(px + Cells - 6, py + Cells * 0.7)
        ctx.stroke()
    }
}

function drawExitCell(px, py, time) {
    const pulse = 0.5 + 0.5 * Math.sin(time / 300)
    ctx.fillStyle = '#3a3000'
    ctx.fillRect(px, py, Cells, Cells)
    ctx.save()
    ctx.shadowColor = `rgba(255, 215, 0, ${0.5 + pulse * 0.5})`
    ctx.shadowBlur = 12
    ctx.fillStyle = '#FFD700'
    ctx.fillRect(px + 2, py + 2, Cells - 4, Cells - 4)
    ctx.restore()
    ctx.font = `${Cells * 0.6}px serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('🚪', px + Cells/2, py + Cells/2 + 2)
}

function drawGrid(columns, lines, maze, time){
    for(let y=0;y<lines;y++){
        for(let x=0;x<columns;x++){
            const px = x*Cells, py = y*Cells
            const val = maze[y][x]
            if (val === 1) drawWallCell(px, py, x, y)
            else if (val === 0) drawFloorCell(px, py, x, y)
            else if (val === 2) drawExitCell(px, py, time)
            else if (val === 3) drawWaterCell(px, py, time)
            else if (val === 4) drawBridgeCell(px, py, x, y)
            else if (val === 5) drawMangoCell(px, py, x, y, time)
        }
    }
}

function findRandomOpenCell(maze, excluded = []){
    const openCells=[]
    for(let y=0;y<Lines;y++){
        for(let x=0;x<Columns;x++){
            if(maze[y][x]===0 && !excluded.some(c => c.x===x && c.y===y)) openCells.push({x,y})
        }
    }
    return openCells[Math.floor(Math.random() * openCells.length)]
}

function drawEntity(entity, imageKey) {
    const px = entity.x * Cells  // canto da célula
    const py = entity.y * Cells

    ctx.drawImage(IMAGES[imageKey], px, py, Cells, Cells)
}

function draw(time = 0) {
    drawGrid(Columns, Lines, maze, time)
    drawEntity(player, PLAYER_IMAGE)
    monsters.forEach((monster, i) => drawEntity(monster, MONSTER_IMAGES[i % MONSTER_IMAGES.length]))
    drawHintPaths()
}

function startRenderLoop() {
    requestAnimationFrame(function frame(time) {
        draw(time)
        requestAnimationFrame(frame)
    })
}

function showEndScreen(kind, title, message) {
    gameOver = true
    score = kind === 'win' ? score + 300 : Math.max(0, score - 100)
    updateScore()

    const overlay = document.getElementById('overlay')
    const card = document.getElementById('overlayCard')
    document.getElementById('overlayEmoji').textContent = kind === 'win' ? '🎉' : '💀'
    document.getElementById('overlayTitle').textContent = title
    document.getElementById('overlayMessage').textContent = message
    document.getElementById('overlayScore').textContent = `🥭 Pontuação final: ${score}`
    card.classList.remove('win', 'lose')
    card.classList.add(kind)
    overlay.classList.remove('hidden')
}

function hideEndScreen() {
    document.getElementById('overlay').classList.add('hidden')
}

document.addEventListener('keydown', function(event) {
    if (event.key === 'h' || event.key === 'H') {
    toggleHint(graph, weights, player, exit)
    return
    }
    if (gameOver) return  // ignora input enquanto a tela de fim está aberta

    let dx = 0, dy = 0

    if (event.key === 'ArrowUp')    dy = -1
    if (event.key === 'ArrowDown')  dy = 1
    if (event.key === 'ArrowLeft')  dx = -1
    if (event.key === 'ArrowRight') dx = 1

    if (dx === 0 && dy === 0) return  // tecla irrelevante, ignora

    // se tá preso na água, só move monstros e solta
    if (stuck) {
        stuck = false
        for (const monster of monsters) {
            const newPos = moveMonsterTowardsPlayer(graph, weights, monster.x, monster.y, player.x, player.y)
            monster.x = newPos.x
            monster.y = newPos.y
            if (monster.x === player.x && monster.y === player.y) {
                showEndScreen('lose', 'Capturado!', 'Um monstro te alcançou no labirinto.')
                return
            }
        }
        return
    }

    const nx = player.x + dx
    const ny = player.y + dy

    if (maze[ny][nx] === 1) return  // parede, ignora

    player.x = nx
    player.y = ny

    // pegou uma manga — 50 pontos
    if (maze[ny][nx] === 5) {
        maze[ny][nx] = 0
        score += 50
        updateScore()
    }

    // condição de vitória
    if (maze[ny][nx] === 2) {
        showEndScreen('win', 'Você escapou!', 'Parabéns, você encontrou a saída antes dos monstros.')
        return
    }

    // chegou na água — fica preso, monstros não movem ainda
    if (maze[ny][nx] === 3) {
        stuck = true
        return
    }

    // chegou na ponte — 20% de morrer
    if (maze[ny][nx] === 4) {
        if (Math.random() < 0.2) {
            showEndScreen('lose', 'A ponte quebrou!', 'Você caiu e não resistiu à queda.')
            return
        }
    }

    // move monstros
    for (const monster of monsters) {
        const newPos = moveMonsterTowardsPlayer(graph, weights, monster.x, monster.y, player.x, player.y)
        monster.x = newPos.x
        monster.y = newPos.y
        if (monster.x === player.x && monster.y === player.y) {
            showEndScreen('lose', 'Capturado!', 'Um monstro te alcançou no labirinto.')
            return
        }
    }
})

function placeHazards(maze) {
    const openCells = []
    for (let y = 0; y < Lines; y++)
        for (let x = 0; x < Columns; x++)
            if (maze[y][x] === 0) openCells.push({x, y})

    // embaralha e pega uma fração das células abertas
    for (let i = openCells.length-1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1))
        ;[openCells[i], openCells[j]] = [openCells[j], openCells[i]]
    }

    // ~5% viram água, próximos ~5% viram ponte (escala com o tamanho do labirinto)
    const waterCount = Math.floor(openCells.length * 0.05)
    const bridgeCount = Math.floor(openCells.length * 0.05)
    for (let i = 0; i < waterCount; i++) maze[openCells[i].y][openCells[i].x] = 3
    for (let i = waterCount; i < waterCount + bridgeCount; i++) maze[openCells[i].y][openCells[i].x] = 4
}

function placeMangoes(maze) {
    const openCells = []
    for (let y = 0; y < Lines; y++)
        for (let x = 0; x < Columns; x++)
            if (maze[y][x] === 0) openCells.push({x, y})

    for (let i = openCells.length-1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i+1))
        ;[openCells[i], openCells[j]] = [openCells[j], openCells[i]]
    }

    // ~4% das células restantes viram manga (50 pontos cada ao coletar)
    const mangoCount = Math.floor(openCells.length * 0.04)
    for (let i = 0; i < mangoCount; i++) maze[openCells[i].y][openCells[i].x] = 5
}

// Testa se existe ao menos um caminho sem passar por pontes (pontes = celula 4)
function hasSafePath(maze, startX, startY, exitX, exitY) {
    const lines = maze.length
    const columns = maze[0].length
    const safeGraph = {}

    for (let y = 0; y < lines; y++) {
        for (let x = 0; x < columns; x++) {
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

    if (!safeGraph[startKey] || !safeGraph[exitKey]) return false

    const result = dijkstra(safeGraph, startKey, null)
    return result.distances[exitKey] !== Infinity
}

function newGame() {
    let validMapFound = false
    let attempts = 0

    while (!validMapFound && attempts < 100) {
        attempts++
        maze = generateMaze(Columns, Lines)
        addLoops(maze, Columns, Lines) 
        
        placeHazards(maze)
        placeMangoes(maze)

        player = findRandomOpenCell(maze)
        monsters = []
        for (let i = 0; i < MONSTER_COUNT; i++) {
            monsters.push(findRandomOpenCell(maze, [player, ...monsters]))
        }

        ;({ graph, weights } = buildGraph(maze))
        exit = placeExit(maze, graph, weights, player.x, player.y, monsters)

        if (exit && hasSafePath(maze, player.x, player.y, exit.x, exit.y)) {
            validMapFound = true
        }
    }

    stuck = false
    gameOver = false
    score = 0
    updateScore()
    hideEndScreen()
}

document.getElementById('restartBtn').addEventListener('click', newGame)

loadAssets().then(() => {
    newGame()
    startRenderLoop()
})