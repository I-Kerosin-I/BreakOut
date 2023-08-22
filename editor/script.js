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
    changeBuffer[x] ? changeBuffer[x][y] = previewCtx.fillStyle : undefined
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
    if (Y1 + b < 45) { previewCtx.fillBrick(X1, Y1 + b) }
    if (Y1 - b >= 0) { previewCtx.fillBrick(X1, Y1 - b) }

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
        if (X1 + x < 128 && Y1 - y >= 0) { previewCtx.fillBrick(X1 + x, Y1 - y) }
        if (X1 - x > 0 && Y1 - y >= 0) { previewCtx.fillBrick(X1 - x, Y1 - y) }
        if (X1 + x < 128 && Y1 + y < 45) { previewCtx.fillBrick(X1 + x, Y1 + y) }
        if (X1 - x > 0 && Y1 + y < 45) { previewCtx.fillBrick(X1 - x, Y1 + y) }
        if (filled) {
            const lastX = Math.min(X1 + x, 128)
            for (let i = Math.max(X1 - x, 0); i < lastX; i++) {
                if (Y1 - y >= 0) { previewCtx.fillBrick(i, Y1 - y) }
                if (Y1 + y < 45) { previewCtx.fillBrick(i, Y1 + y) }
            }
        }
    }
}



const modes = [
    {
        'callback': function pencil(X, Y) {
            drawLine(prewX, prewY, X, Y)
            prewX = X
            prewY = Y
        }, 'continuous': true
    },
    {
        'callback': function line(X, Y) {
            clearPreview()
            drawLine(startX, startY, X, Y)
        }, 'continuous': true
    },
    {
        'callback': function filledSquare(X, Y) {
            clearPreview()
            previewCtx.fillBrick(startX, startY)

            const dx = X - startX >= 0 ? 1 : -1
            const dy = Y - startY >= 0 ? 1 : -1

            for (let x = startX; x !== X + dx; x += dx) {
                for (let y = startY; y !== Y + dy; y += dy) {
                    previewCtx.fillBrick(x, y)
                }
            }
        }, 'continuous': true
    },
    {
        'callback': function strokeSquare(X, Y) {
            clearPreview()

            const dx = X - startX >= 0 ? 1 : -1
            const dy = Y - startY >= 0 ? 1 : -1

            for (let x = startX; x !== X + dx; x += dx) {
                previewCtx.fillBrick(x, startY)
                previewCtx.fillBrick(x, Y)
            }
            for (let y = startY; y !== Y; y += dy) {
                previewCtx.fillBrick(startX, y)
                previewCtx.fillBrick(X, y)
            }

        }, 'continuous': true
    },
    {
        'callback': function filledEllipse(X, Y) {
            clearPreview()
            drawEllipse(startX, startY, Math.abs(X - startX), Math.abs(Y - startY), true)
        }, 'continuous': true
    },
    {
        'callback': function strokeEllipse(X, Y) {
            clearPreview()
            drawEllipse(startX, startY, Math.abs(X - startX), Math.abs(Y - startY), false)

        }, 'continuous': true
    },
    {
        'callback': function fill(X, Y) {
            const targetColor = level[X][Y]
            const buffer = [{ x: X, y: Y }]
            let lastEl

            while (buffer.length) {
                lastEl = buffer.pop()
                previewCtx.fillBrick(lastEl.x, lastEl.y)
                X = lastEl.x
                Y = lastEl.y

                nextBricks = [{ x: X, y: Y - 1 }, { x: X + 1, y: Y }, { x: X, y: Y + 1 }, { x: X - 1, y: Y }]

                for (let i = 0; i < 4; i++) {
                    const brick = nextBricks[i];
                    if (brick.x >= 0 && brick.x < 128 && brick.y >= 0 && brick.y <= 45 && 
                        changeBuffer[brick.x][brick.y] === undefined && level[brick.x][brick.y] === targetColor) {
                        buffer.push(brick)
                        changeBuffer[brick.x][brick.y] = null
                    }
                }
            }
            endDraw()
        }, 'continuous': false
    }
]
let count = 0
const modeButtons = document.querySelectorAll('.mode-btn')


function setMode(mode) {
    modeButtons[curMode].style.removeProperty("background-color")
    modeButtons[mode].style.backgroundColor = '#4CAF50'
    curMode = mode
}

function callbackWrapper(e) {
    modes[curMode].callback(Math.floor(e.x / (brickSide * 1.2)), Math.floor((e.y - 48) / (brickSide * 1.2)))
}

//#region event listeners

function endDraw() {
    preview.removeEventListener('mousemove', callbackWrapper)
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
})
preview.addEventListener('mousedown', (e) => {
    startX = Math.floor(e.x / (brickSide * 1.2))
    startY = Math.floor((e.y - 48) / (brickSide * 1.2))
    prewX = startX
    prewY = startY

    ctx.fillStyle = picker.value
    previewCtx.fillStyle = picker.value

    if (modes[curMode].continuous) { preview.addEventListener('mousemove', callbackWrapper) }
    callbackWrapper(e)
})
document.addEventListener('mouseup', endDraw)
//#endregion


function saveLevel() {

}

function loadLevel() {

}