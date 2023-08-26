//#region canvases
const canv = document.getElementById("mainCanv")
const brickCanv = document.getElementById("bricksCanv")
const ctx = canv.getContext('2d')
const brickCtx = brickCanv.getContext('2d')

canv.width = window.innerWidth;
canv.height = window.innerHeight;
brickCanv.width = window.innerWidth;
brickCanv.height = window.innerHeight;

//#endregion

//#region constants

const brickRowCount = 45;
const brickColumnCount = 120;

const brickWidth = 10;
const brickHeight = 10;
const brickPadding = (canv.width - brickWidth * brickColumnCount) / (brickColumnCount - 1);
const ballRadius = 3;
const ballSpeed = 3;
const paddleHeight = 10;
const paddleWidth = 115;
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
        this.verticalCollisions = []
        this.horizontalCollisions = []
        this.cornerCollisions = []
        let px = (bx, by) => (bx + k * (by - fy(0, this))) / (1 + k ** 2) // x пересечения скорости и перпендикуляра к ней, проведённого через (bx by)

        let k = this.velY / this.velX

        const verticalExpression = (bx, by) => by < fy(bx, this) && by + brickHeight > fy(bx, this)
        const horizontalExpression = (bx, by) => bx < fx(by, this) && bx + brickWidth > fx(by, this)

        for (let i = 0; i < bricks.length; i++) {
            let b = bricks[i]
            if (verticalExpression(b.x + (this.velX > 0 ? -ballRadius : brickWidth + ballRadius), b.y)) {
                this.verticalCollisions.push({ x: b.x + (this.velX > 0 ? -ballRadius : brickWidth + ballRadius), id: b.id })
                b.expectedCollisions.push(this.verticalCollisions)
            } else if (horizontalExpression(b.x, b.y + (this.velY > 0 ? -ballRadius : brickHeight + ballRadius))) {
                this.horizontalCollisions.push({ y: b.y + (this.velY > 0 ? -ballRadius : brickHeight + ballRadius), id: b.id })
                b.expectedCollisions.push(this.horizontalCollisions)
            } else {
                for (const [bx, by] of [[b.x, b.y], [b.x, b.y + brickHeight], [b.x + brickWidth, b.y], [b.x + brickWidth, b.y + brickHeight]]) {
                    let r = px(bx, by)
                    let dist = Math.sqrt((r - bx) ** 2 + (fy(r, this) - by) ** 2)
                    if (dist <= ballRadius) {
                        this.cornerCollisions.push({
                            x: r - Math.sqrt(ballRadius ** 2 - dist ** 2) * this.velX / Math.sqrt(this.velX ** 2 + this.velY ** 2),
                            y: fy(r, this) - Math.sqrt(ballRadius ** 2 - dist ** 2) * this.velY / Math.sqrt(this.velX ** 2 + this.velY ** 2),
                            bx: bx, by: by,
                            id: b.id
                        })
                        b.expectedCollisions.push(this.cornerCollisions)
                    }
                }
            }
        }
        console.timeEnd('calculateCollision')
    }
}

class Brick {
    constructor(x, y, id, color, breakable) {
        this.x = x
        this.y = y
        this.id = id
        this.color = color
        this.expectedCollisions = []
        this.breakable = breakable
    }
    destroy(id) {
        if (this.breakable) {
            brickCtx.clearRect(this.x - brickPadding, this.y - brickPadding, brickWidth + brickPadding, brickHeight + brickPadding)
            for (let i = 0; i < this.expectedCollisions.length; i++) {
                const ball = this.expectedCollisions[i];
                ball.splice(ball.findIndex((obj) => obj.id === this.id), 1)
            }
            bricks.splice(id, 1)
        }
    }
}
//#region varaibles
let paddleX = (canv.width - paddleWidth) / 2;
let oldPaddleX
let balls = [new Ball(x = canv.width / 2, y = paddleY - ballRadius * 2, velX = 0, velY = 0)]
let bricks = []

//#endregion

function hsvToRgb(h, s, v) {
    var r, g, b;

    var i = Math.floor(h * 6);
    var f = h * 6 - i;
    var p = v * (1 - s);
    var q = v * (1 - f * s);
    var t = v * (1 - (1 - f) * s);

    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }

    return '#' + Math.round((r * 255)).toString(16).padStart(2, '0') + Math.round((g * 255)).toString(16).padStart(2, '0') + Math.round((b * 255)).toString(16).padStart(2, '0');
}


for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
        bricks.push(new Brick(x = (c * (brickWidth + brickPadding)), y = r * (brickHeight + brickPadding), id = c * brickColumnCount + r, hsvToRgb(c / 60, 1, 1), true));
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
function moveBall(e) {
    clearBalls()
    balls[0].x = Math.min(Math.max(e.x, ballRadius), canv.width - ballRadius)
}
function throwBall(e) {
    balls[0].velY = -500
    balls[0].velX = 0.001
    balls[0].calculateCollision()
    document.removeEventListener('mousemove', moveBall)
    document.removeEventListener('mousedown', throwBall)
    document.addEventListener('mousedown', (e) => { balls.push(new Ball(e.x, e.y, 0.1, -500)); balls[balls.length - 1].calculateCollision() })
}
document.addEventListener('mousemove', moveBall)
document.addEventListener('mousedown', throwBall)


document.addEventListener('keydown', (e) => {
    if (e.key === 'd') {
        startTime = new Date().getTime() - 5
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


function drawBricks() {
    for (const brick of bricks) {
        brickCtx.fillStyle = brick.color
        brickCtx.fillRect(brick.x, brick.y, brickWidth, brickHeight)
    }
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
                const index = bricks.findIndex((obj) => obj.id === i.id)
                bricks[index].destroy(index)
                ball.calculateCollision()
                continue ballLoop
            }
        }
        for (const i of ball.verticalCollisions) {
            if (ball.x > i.x !== ball.x + dx > i.x) {
                ball.x = i.x
                ball.y = fy(i.x, ball)
                ball.velX = -ball.velX
                const index = bricks.findIndex((obj) => obj.id === i.id)
                bricks[index].destroy(index)
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
                const index = bricks.findIndex((obj) => obj.id === i.id)
                bricks[index].destroy(index)
                ball.calculateCollision()
                continue ballLoop
            }
        }

        if (ball.x + dx > canv.width - ballRadius || ball.x + dx < ballRadius) {  // врезался в стену
            ball.y = fy(ball.velX > 0 ? canv.width - ballRadius : ballRadius, ball)
            ball.x = ball.velX > 0 ? canv.width - ballRadius : ballRadius
            ball.velX = -ball.velX;
            ball.calculateCollision()
            continue ballLoop
        }
        if (ball.y + dy < ballRadius) {     // врезался в потолок
            ball.x = fx(ballRadius, ball)
            ball.y = ballRadius
            ball.velY = -ball.velY;
            ball.calculateCollision()
            continue ballLoop
        }
        else if (ball.y + dy <= paddleY + paddleHeight && ball.y >= paddleY + paddleHeight) {
            if (fx(paddleY + paddleHeight, ball) > paddleX && fx(paddleY + paddleHeight, ball) < paddleX + paddleWidth) {  // врезался в низ платформы
                ball.x = fx(paddleY + paddleHeight, ball)
                ball.y = paddleY + paddleHeight
                ball.velY = -ball.velY
                continue ballLoop
            }
        }
        else if (ball.y + dy >= paddleY && ball.y <= paddleY) {
            if (fx(paddleY, ball) > paddleX && fx(paddleY, ball) < paddleX + paddleWidth) {  // врезался в верх платформы
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
        if (ball.y > canv.height + ballRadius) {   // улетел вниз
            balls.splice(i, 1)
            if (!balls.length) {
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

    clearBalls()
    collisionDetection(dTime);
    drawBalls();
    clearPaddle()
    drawPaddle();
    oldPaddleX = paddleX
}
drawBricks();
let startTime = new Date().getTime()
draw()
