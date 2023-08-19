const canv = document.getElementById('level')
const preview = document.getElementById('preview')


const ctx = canv.getContext('2d')
const previewCtx = preview.getContext('2d')


const brickImg = ctx.createImageData(10, 10);

canv.width = window.innerWidth;
canv.height = window.innerHeight - 48;

preview.width = window.innerWidth;
preview.height = window.innerHeight - 48;

const brickSide = 10


const picker = document.getElementById('colorPicker')


const level = []
let undoBuffer = [[]]
let changeBuffer = []

for (let x = 0; x < 128; x++) {
    level.push([])
    changeBuffer.push([])
}

let curMode = 0
let startX, startY
let prewX, prewY

CanvasRenderingContext2D.prototype.fillBrick = function (x, y) {
    this.fillRect(x * (brickSide * 1.2), y * (brickSide * 1.2), brickSide, brickSide);
    changeBuffer[x] ? changeBuffer[x][y] = previewCtx.fillStyle : null
}

function clearPreview() {
    previewCtx.clearRect(0, 0, canv.width, canv.height)
    for (let x = 0; x < 128; x++) {
        changeBuffer[x] = []
    }
}

function drawLine(x0, y0, x1, y1) {
    let dx = Math.abs(x1 - x0);
    let dy = Math.abs(y1 - y0);
    let sx = (x0 < x1) ? 1 : -1;
    let sy = (y0 < y1) ? 1 : -1;
    let err = dx - dy;
    while (true) {
        previewCtx.fillBrick(x0, y0); // Do what you need to for this
        if ((x0 === x1) && (y0 === y1)) break;
        let e2 = 2 * err;
        if (e2 > -dy) { err -= dy; x0 += sx; }
        if (e2 < dx) { err += dx; y0 += sy; }
    }
}


function drawEllipse(X1, Y1, a, b, filled) {
    let y = b
    let x = 0
    if (b === 0) {
        drawLine(X1 - Math.floor(a * 0.8), Y1, X1 + Math.floor(a * 0.8), Y1)
        return
    }
    previewCtx.fillBrick(X1, Y1 + b)
    previewCtx.fillBrick(X1, Y1 - b)
    while (y > 0) {
        if (b * b * x < a * a * y) {
            if (b ** 2 * (x + 1) ** 2 + a ** 2 * (y - 0.5) ** 2 - a ** 2 * b ** 2 > 0) {
                y--
            }
            x++
        } else {
            if (b ** 2 * (x + 0.5) ** 2 + a ** 2 * (y - 1) ** 2 - a ** 2 * b ** 2 < 0) {
                x++
            }
            y--
        }
        X1 + x > 0 && Y1 - y > 0 ? previewCtx.fillBrick(X1 + x, Y1 - y) : null
        X1 - x > 0 && Y1 - y > 0 ? previewCtx.fillBrick(X1 - x, Y1 - y) : null
        X1 + x > 0 && Y1 + y > 0 ? previewCtx.fillBrick(X1 + x, Y1 + y) : null
        X1 - x > 0 && Y1 + y > 0 ? previewCtx.fillBrick(X1 - x, Y1 + y) : null
        if (filled) {
            for (let i = X1 - x; i < X1 + x; i++) { previewCtx.fillBrick(i, Y1 - y); previewCtx.fillBrick(i, Y1 + y) }
        }
    }
}



const modes = [
    function pencil(e) {
        drawLine(prewX, prewY,
            Math.floor((e.x) / (brickSide * 1.2)), Math.floor((e.y - 48) / (brickSide * 1.2)))
        prewX = Math.floor(e.x / (brickSide * 1.2))
        prewY = Math.floor((e.y - 48) / (brickSide * 1.2))
    },
    function line(e) {
        clearPreview()

        drawLine(startX, startY, Math.floor((e.x) / (brickSide * 1.2)), Math.floor((e.y - 48) / (brickSide * 1.2)))
    },
    function filledSquare(e) {
        clearPreview()
        const endBrickX = Math.floor(e.x / (brickSide * 1.2)) + 1
        const endBrickY = Math.floor((e.y - 48) / (brickSide * 1.2)) + 1

        for (let x = startX; x !== endBrickX; x += Math.sign(endBrickX - startX)) {
            for (let y = startY; y !== endBrickY; y += Math.sign(endBrickY - startY)) {
                previewCtx.fillBrick(x, y)
            }
        }
    },
    function strokeSquare(e) {
        clearPreview()
        const endBrickX = Math.floor(e.x / (brickSide * 1.2))
        const endBrickY = Math.floor((e.y - 48) / (brickSide * 1.2)) + 1

        for (let x = startX; x !== endBrickX; x += Math.sign(endBrickX - startX)) {
            previewCtx.fillBrick(x, startY)
            previewCtx.fillBrick(x, endBrickY - 1)
        }
        for (let y = startY; y !== endBrickY; y += Math.sign(endBrickY - startY)) {
            previewCtx.fillBrick(startX, y)
            previewCtx.fillBrick(endBrickX, y)
        }

    },
    function filledCircle(e) {
        clearPreview()
        drawEllipse(startX, startY, Math.abs(Math.floor(e.x / (brickSide * 1.2)) - startX), Math.abs(Math.floor((e.y - 48) / (brickSide * 1.2)) - startY), true)
    },
    function strokeCircle(e) {
        clearPreview()
        drawEllipse(startX, startY, Math.abs(Math.floor(e.x / (brickSide * 1.2)) - startX), Math.abs(Math.floor((e.y - 48) / (brickSide * 1.2)) - startY), false)

    },
    function fill(e) {

    }
]

const modeButtons = document.querySelectorAll('.mode-btn')


function setMode(mode) {
    modeButtons[curMode].style.removeProperty("background-color")
    modeButtons[mode].style.backgroundColor = '#4CAF50'
    curMode = mode
}


document.addEventListener('keydown', (e) => {
    if (e.keyCode === 90 && e.ctrlKey && undoBuffer.length > 1) {
        for (const el of undoBuffer[undoBuffer.length - 2]) {
            level[el.x][el.y] = el.color
            ctx.fillStyle = el.color ?? '#212121'
            ctx.fillRect(el.x * (brickSide * 1.2), el.y * (brickSide * 1.2), brickSide, brickSide);
        }
        undoBuffer.splice(undoBuffer.length - 2, 1)
    }
    if (e.key === 'e') { drawEllipse(0, 0, 128, 45, true) }
})
preview.addEventListener('mousedown', (e) => {
    startX = Math.floor(e.x / (brickSide * 1.2))
    startY = Math.floor((e.y - 48) / (brickSide * 1.2))
    prewX = startX
    prewY = startY

    ctx.fillStyle = picker.value
    previewCtx.fillStyle = picker.value
    previewCtx.fillRect(e.x - e.x % (brickSide * 1.2), e.y - e.y % (brickSide * 1.2) - 48, brickSide, brickSide)

    preview.addEventListener('mousemove', modes[curMode])
    modes[curMode](e)
})
document.addEventListener('mouseup', (e) => {
    preview.removeEventListener('mousemove', modes[curMode])
    previewCtx.clearRect(0, 0, canv.width, canv.height)
    for (let x = 0; x < 128; x++) {
        for (let y = 0; y < 45; y++) {
            const el = changeBuffer[x][y]
            if (el) {
                undoBuffer[undoBuffer.length - 1].push({ x: x, y: y, color: level[x][y] })
                level[x][y] = el
                ctx.fillBrick(x, y)
                changeBuffer[x][y] = undefined
            }
        }
    }
    if (undoBuffer[undoBuffer.length - 1].length) {
        undoBuffer.push([])
    }
})


ctx.fillStyle = '#fff'
previewCtx.fillStyle = '#fff'


// Функция для сохранения уровня (сохраняем информацию о кирпичах)
function saveLevel() {

}

// Функция для загрузки уровня (загружаем информацию о кирпичах)
function loadLevel() {

}



