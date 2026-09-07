const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');

const Columns = 20 //teremos 20 colunas (ou ent celulas, e so uma matriz mano)
const Lines = 20 //por enquanto deixei hard coded 20x20 mas dps da pra melhorar
const Cells = 36 //isso aqui e o tamanho dos PIXELS das celulas, as varaveis acima eram o numero de pixels por direcao
canvas.width =  Columns*Cells
canvas.height = Lines*Cells

function generateMaze(columns, lines){
    const maze=[]
    for(let i=0;i<lines;i++) maze.push(new Array(columns).fill(1))
    return maze

    function shuffle(array){
        for(let i=0;i<array.length - 1;i++){
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

const maze=generateMaze(Columns,Lines)
drawGrid(Columns,Lines,maze)
