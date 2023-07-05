//#region canvases
const canv = document.getElementById("mainCanv")
const brickCanv = document.getElementById("bricksCanv")
const debugCanv = document.getElementById("debugCanv")
const ctx = canv.getContext('2d')
const brickCtx = brickCanv.getContext('2d')
const debugCtx = debugCanv.getContext('2d')

canv.width = window.innerWidth;
canv.height = window.innerHeight;
brickCanv.width = window.innerWidth;
brickCanv.height = window.innerHeight;
debugCanv.width = window.innerWidth;
debugCanv.height = window.innerHeight;

debugCtx.lineWidth = 1
debugCtx.strokeStyle = '#00ff00'
debugCtx.fillStyle = '#ff0000'
//#endregion

//#region constants
// const brickRowCount = 30;
// const brickColumnCount = 80;

const brickRowCount = 90;
const brickColumnCount = 240;

const brickWidth = 5;
const brickHeight = 5;
const brickPadding = (canv.width - brickWidth * brickColumnCount) / (brickColumnCount - 1);
const ballRadius = 3;
const ballSpeed = 3;
const paddleHeight = 10;
const paddleWidth = 75;
const paddleY = canv.height - paddleHeight * 2
//#endregion

let fy = (bx, { x, y, velX, velY }) => y + (bx - x) * velY / velX
let fx = (by, { x, y, velX, velY }) => x + (by - y) * velX / velY

class Ball {
    constructor(x, y, velX, velY) {
        this.x = x
        this.y = y
        this.velX = velX
        this.velY = velY
        this.horizontalCollisions = []
        this.verticalCollisions = []
        this.cornerCollisions = []
    }
    calculateCollision() {
        console.time('calculateCollision')
        debugCtx.clearRect(0, 0, debugCanv.width, debugCanv.height)
        this.verticalCollisions = []
        this.horizontalCollisions = []
        this.cornerCollisions = []
        let px = (bx, by) => (bx + k * (by - fy(0, this))) / (1 + k ** 2) // x пересечения скорости и перпендикуляра к ней, проведённого через (bx by)

        let k = this.velY / this.velX

        const verticalExpression = (bx, by) => by < fy(bx, this) && by + brickHeight > fy(bx, this)
        const horizontalExpression = (bx, by) => bx < fx(by, this) && bx + brickWidth > fx(by, this)

        for (const i in bricks) {
            let b = bricks[i]
            if (verticalExpression(b.x + (this.velX > 0 ? -ballRadius : brickWidth + ballRadius), b.y)) {
                this.verticalCollisions.push({ x: b.x + (this.velX > 0 ? -ballRadius : brickWidth + ballRadius), id: i })
            } else if (horizontalExpression(b.x, b.y + (this.velY > 0 ? -ballRadius : brickHeight + ballRadius))) {
                this.horizontalCollisions.push({ y: b.y + (this.velY > 0 ? -ballRadius : brickHeight + ballRadius), id: i })
            } else {
                for (const [bx, by] of [[b.x, b.y], [b.x, b.y + brickHeight], [b.x + brickWidth, b.y], [b.x + brickWidth, b.y + brickHeight]]) {
                    let r = px(bx, by)
                    let dist = Math.sqrt((r - bx) ** 2 + (fy(r, this) - by) ** 2)
                    if (dist <= ballRadius) {
                        this.cornerCollisions.push({
                            x: r - Math.sqrt(ballRadius ** 2 - dist ** 2) * this.velX / Math.sqrt(this.velX ** 2 + this.velY ** 2),
                            y: fy(r, this) - Math.sqrt(ballRadius ** 2 - dist ** 2) * this.velY / Math.sqrt(this.velX ** 2 + this.velY ** 2),
                            bx: bx, by: by,
                            id: i
                        })
                    }
                }
            }
        }
        console.timeEnd('calculateCollision')
        // if (!verticalCollisions.length) { verticalCollisions.push() }
        if (this.velX > 0 !== this.velY > 0) {
            debugDrawLine(fx(0, this), 0, 0, fy(0, this))
        } else {
            debugDrawLine(fx(canv.height, this), canv.height, 0, fy(0, this))
        }
        debugCtx.fillStyle = '#ff00ff'
        for (const i of this.horizontalCollisions) {
            debugDrawPoint(fx(i.y, this), i.y)
        }
        debugCtx.fillStyle = '#ff0000'
        for (const i of this.verticalCollisions) {
            debugDrawPoint(i.x, fy(i.x, this))
        }
        debugCtx.fillStyle = '#fff'
        for (const i of this.cornerCollisions) {
            debugDrawPoint(i.x, i.y)
        }
    }
}
// 632.8152332716845 640.4493503778419 45.33003421940868 421.8354987405247 575.5
//#region varaibles
// let paddleX = (canv.width - paddleWidth) / 2;
let paddleX = 595;
let oldPaddleX
let balls = [new Ball(x = 632.8152332716845, y = 640.4493503778419, velX = 10.33003421940868, velY = 421.8354987405247)]
let bricks = [];
let calculatedBricks = []
let horizontalCollisions = []
let verticalCollisions = []
//#endregion

for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
        bricks.unshift({ x: c * (brickWidth + brickPadding), y: r * (brickHeight + brickPadding) });
    }
}

//#region listenrs
// window.addEventListener('resize', () => {
//     canv.width = window.innerWidth;
//     canv.height = window.innerHeight
// }, false);

document.addEventListener('mousemove', (e) => {
    paddleX = e.x - paddleWidth / 2
})

document.addEventListener('keydown', (e) => {
    if (e.key === 'd') {
        draw()
    }
    if (e.key === 's') {
        console.log(balls[0].x, balls[0].y, balls[0].velX, balls[0].velY, paddleX)
    }
})

document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        startTime = new Date().getTime()
    }
});

//#endregion

//#region ball draw
const ballCanv = document.createElement('canvas');
ballCanv.width = ballRadius * 4 + 1;
ballCanv.height = ballRadius * 2;
const ballCtx = ballCanv.getContext('2d');
ballCtx.fillStyle = "#212121";
ballCtx.fillRect(ballRadius * 2 + 1, 0, ballRadius * 2, ballRadius * 2)
ballCtx.beginPath();
ballCtx.arc(ballRadius, ballRadius, ballRadius, 0, Math.PI * 2);
ballCtx.fillStyle = "#dedede";
ballCtx.fill();
ballCtx.closePath();

function drawBalls() {
    for (const ball of balls) {
        ctx.drawImage(ballCanv, 0, 0, ballRadius * 2, ballRadius * 2, Math.round(ball.x) - ballRadius, Math.round(ball.y) - ballRadius, ballRadius * 2, ballRadius * 2)
    }
}
function clearBalls() {
    for (const ball of balls) {
        ctx.drawImage(ballCanv, ballRadius * 2 + 1, 0, ballRadius * 2, ballRadius * 2, Math.round(ball.x) - ballRadius, Math.round(ball.y) - ballRadius, ballRadius * 2, ballRadius * 2)
    }
}
//#endregion

//#region paddle draw
const paddleCanv = document.createElement('canvas');
paddleCanv.width = paddleWidth * 2 + 1;
paddleCanv.height = paddleHeight;
const paddleCtx = paddleCanv.getContext('2d');

paddleCtx.fillStyle = "#787878";
paddleCtx.fillRect(0, 0, paddleWidth, paddleHeight);
paddleCtx.fillStyle = "#212121";
paddleCtx.fillRect(paddleWidth, 0, paddleWidth + 1, paddleHeight);

function drawPaddle() {
    ctx.drawImage(paddleCanv, 0, 0, paddleWidth, paddleHeight, paddleX, paddleY, paddleWidth, paddleHeight)
}
function clearPaddle() {
    ctx.drawImage(paddleCanv, paddleWidth + 1, 0, paddleWidth, paddleHeight, oldPaddleX, paddleY, paddleWidth + 1, paddleHeight)
}
//#endregion

//#region bricks draw
const brickImg = document.createElement('canvas');
brickImg.width = brickWidth * 2 + 1;
brickImg.height = brickHeight;
const brickImgCtx = brickImg.getContext('2d');

brickImgCtx.fillStyle = "#0060dd";
brickImgCtx.fillRect(0, 0, brickWidth, brickHeight);
brickImgCtx.fillStyle = "#00000000";
brickImgCtx.fillRect(brickWidth, 0, brickWidth + 1, brickHeight);

function drawBrick(x, y) {
    brickCtx.drawImage(brickImg, 0, 0, brickWidth, brickHeight, x, y, brickWidth, brickHeight)
}
function clearBrick({ x, y }) {
    brickCtx.clearRect(x, y, brickWidth, brickHeight)
}

//#endregion

function drawBricks() {
    for (const brick of bricks) {
        drawBrick(brick.x, brick.y)
    }
}

function debugDrawPoint(x, y) {
    debugCtx.beginPath()
    debugCtx.moveTo(x, y)
    debugCtx.arc(x, y, 3, 0, 6.29)
    debugCtx.fill()
}
function debugDrawLine(x1, y1, x2, y2) {
    debugCtx.beginPath()
    debugCtx.moveTo(x1, y1)
    debugCtx.lineTo(x2, y2)
    debugCtx.stroke()
    debugCtx.closePath()
}


function collisionDetection(dTime) {
    ballLoop: for (let i = 0; i < balls.length; i++) {
        const ball = balls[i]
        const dx = ball.velX * dTime
        const dy = ball.velY * dTime
        for (const i of ball.horizontalCollisions) {
            if (ball.y > i.y !== ball.y + dy > i.y) {
                ball.x = fx(i.y, ball)
                ball.y = i.y
                ball.velY = -ball.velY
                clearBrick(bricks[i.id])
                bricks.splice(i.id, 1)
                ball.calculateCollision()
                continue ballLoop
            }
        }
        for (const i of ball.verticalCollisions) {
            if (ball.x > i.x !== ball.x + dx > i.x) {
                ball.x = i.x
                ball.y = fy(i.x, ball)
                ball.velX = -ball.velX
                clearBrick(bricks[i.id])
                bricks.splice(i.id, 1)
                ball.calculateCollision()
                continue ballLoop
            }
        }
        for (const i of ball.cornerCollisions) {
            if (ball.x > i.x !== ball.x + dx > i.x) {
                ball.x = i.x
                ball.y = fy(i.x, ball)
                let ballVelAng = Math.acos(ball.velX / Math.sqrt(ball.velX ** 2 + ball.velY ** 2)) * (ball.velY < 0 ? 1 : -1) + (ball.velY < 0 ? 0 : Math.PI * 2)
                let bisector = Math.acos((i.x - i.bx) / ballRadius) * (i.y < i.by ? 1 : -1) + (i.y < i.by ? 0 : Math.PI * 2)
                let newAng = Math.PI + 2 * bisector - ballVelAng
                let vel = Math.sqrt(ball.velX ** 2 + ball.velY ** 2)
                ball.velX = vel * Math.cos(newAng)
                ball.velY = vel * -Math.sin(newAng)
                clearBrick(bricks[i.id])
                bricks.splice(i.id, 1)
                ball.calculateCollision()
                continue ballLoop
            }
        }

        if (ball.x + dx > canv.width - ballRadius || ball.x + dx < ballRadius) {
            ball.y = fy(ball.velX > 0 ? canv.width - ballRadius : ballRadius, ball)
            ball.x = ball.velX > 0 ? canv.width - ballRadius : ballRadius
            ball.velX = -ball.velX;
            ball.calculateCollision()
            continue ballLoop
        }
        if (ball.y + dy < ballRadius) {
            ball.x = fx(ballRadius, ball)
            ball.y = ballRadius
            ball.velY = -ball.velY;
            ball.calculateCollision()
            continue ballLoop
        }
        else if (ball.y + dy <= paddleY + paddleHeight && ball.y >= paddleY + paddleHeight) {
            if (fx(paddleY + paddleHeight, ball) > paddleX && fx(paddleY + paddleHeight, ball) < paddleX + paddleWidth) {
                ball.x = fx(paddleY + paddleHeight, ball)
                ball.y = paddleY + paddleHeight
                ball.velY = -ball.velY
                continue ballLoop
            }
        }
        else if (ball.y + dy >= paddleY && ball.y <= paddleY) {
            if (fx(paddleY, ball) > paddleX && fx(paddleY, ball) < paddleX + paddleWidth) {
                ball.x = fx(paddleY, ball)
                ball.y = paddleY
                const ang = (1 - (ball.x - paddleX) / paddleWidth) * 3.14
                const vel = Math.sqrt(ball.velX ** 2 + ball.velY ** 2)

                ball.velX = vel * Math.cos(ang)
                ball.velY = -vel * Math.sin(ang)

                ball.calculateCollision()
                continue ballLoop
            }
        }
        if (ball.y > canv.height + ballRadius) {
            balls.splice(i, 1)
            if (balls = []) {
                location.reload()
                console.log('game over')
            }
            continue ballLoop
        }
        ball.x += dx;
        ball.y += dy;
    }
}

function draw() {
    requestAnimationFrame(draw)
    let curTime = new Date().getTime()
    let dTime = (curTime - startTime) / 1000
    startTime = curTime
    // console.time('FULL_FRAME')

    clearBalls()


    // console.time('collisionDetection')
    collisionDetection(dTime);
    // console.timeEnd('collisionDetection')

    // console.time('drawBall')
    drawBalls();
    // console.timeEnd('drawBall')

    // console.time('drawPaddle')
    clearPaddle()
    drawPaddle();
    oldPaddleX = paddleX
    // console.timeEnd('drawPaddle')

    // console.timeEnd('FULL_FRAME')
}
balls[0].calculateCollision()
drawBricks();
let startTime = new Date().getTime()
draw()
