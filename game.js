const canvas = document.getElementById('gc');
const ctx = canvas.getContext('2d');

const Columns = 20 //teremos 20 colunas (ou ent celulas, e so uma matriz mano)
const Lines = 20 //por enquanto deixei hard coded 20x20 mas dps da pra melhorar
const Cells = 36 //isso aqui e o tamanho dos PIXELS das celulas, as varaveis acima eram o numero de pixels por direcao

canvas.width =  Columns*Cells
canvas.height = Lines*Cells

for(let i=0;i<Columns;i++){
    for(let j=0;j<Lines;j++){
        ctx.strokeRect(i*Cells,j*Cells,Cells,Cells);
    }
}