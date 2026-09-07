const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');

const Columns = 25 //teremos 20 colunas (ou ent celulas, e so uma matriz mano)
const Lines = 25 //por enquanto deixei hard coded 20x20 mas dps da pra melhorar
const Cells = 36 //isso aqui e o tamanho dos PIXELS das celulas, as varaveis acima eram o numero de pixels por direcao
canvas.width =  Columns*Cells
canvas.height = Lines*Cells

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

function drawGrid(columns, lines, maze){
    for(let y=0;y<lines;y++){
        for(let x=0;x<columns;x++){
            if(maze[y][x]==1) ctx.fillStyle = '#0f3460'
            else if(maze[y][x]==0) ctx.fillStyle = '#16213e'
            ctx.fillRect(x*Cells, y*Cells, Cells, Cells)

        }
    }
}

function findRandomOpenCell(maze){
    const openCells=[]
    for(let y=0;y<Lines;y++){
        for(let x=0;x<Columns;x++){
            if(maze[y][x]===0) openCells.push({x,y})
        }
    }
    return openCells[Math.floor(Math.random() * openCells.length)]
}

function drawEntity(entity, color) {
    const x = entity.x * Cells + Cells/2  // centro horizontal da célula
    const y = entity.y * Cells + Cells/2  // centro vertical da célula

    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, Cells/2 - 4, 0, Math.PI * 2)
    ctx.fill()
}

function draw() {
    drawGrid(Columns, Lines, maze)
    drawEntity(player, '#0e711b')
    for (const monster of monsters)
        drawEntity(monster, '#e24b4a')
}

document.addEventListener('keydown', function(event) {
    let dx = 0, dy = 0

    if (event.key === 'ArrowUp')    dy = -1
    if (event.key === 'ArrowDown')  dy = 1
    if (event.key === 'ArrowLeft')  dx = -1
    if (event.key === 'ArrowRight') dx = 1
    const nx = player.x + dx
    const ny = player.y + dy

    // só mexe se não for parede
    if (maze[ny][nx] === 0) {
        player.x = nx
        player.y = ny
        draw()
    }
})

const maze=generateMaze(Columns,Lines)
const player = findRandomOpenCell(maze)
const monsters = [findRandomOpenCell(maze), findRandomOpenCell(maze)]
draw()
