//#region canvases
const canv = document.getElementById("mainCanv")
const brickCanv = document.getElementById("bricksCanv")
const bonusCanv = document.getElementById("bonusCanv")
const ctx = canv.getContext('2d')
const brickCtx = brickCanv.getContext('2d')
const bonusCtx = bonusCanv.getContext('2d')

canv.width = window.innerWidth;
canv.height = window.innerHeight;
brickCanv.width = window.innerWidth;
brickCanv.height = window.innerHeight;
bonusCanv.width = window.innerWidth;
bonusCanv.height = window.innerHeight;

//#endregion

//#region constants

const bonusImgs = {
    'add': new Image(),
    'mul': new Image(),
    'inc': new Image(),
    'dec': new Image(),
    'floor': new Image()
}

bonusImgs.add.src = 'img/add.png'
bonusImgs.mul.src = 'img/mul.png'
bonusImgs.inc.src = 'img/inc.png'
bonusImgs.dec.src = 'img/dec.png'
bonusImgs.floor.src = 'img/floor.png'


const bonusSide = 24;
const bonusSpeed = 100;
const bonusChanceDec = 0.01;
const bonusChanceInc = 0.002;
let bonusChance = 0.1

const brickRowCount = 30; // 45
const brickColumnCount = 85;  // 128


const brickWidth = Math.round(canv.width / (brickColumnCount - 1) / 1.2)
const brickHeight = Math.round(canv.width / (brickColumnCount - 1) / 1.2)

const brickPadding = (canv.width - brickWidth * brickColumnCount) / (brickColumnCount - 1);
const ballRadius = 3;
const ballSpeed = 500;

const paddleHeight = 10;
const startPaddleWidth = 115
const paddleY = canv.height - paddleHeight * 2
let paddleWidth = startPaddleWidth;
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
            if (Math.random() < bonusChance / balls.length) { bonuses.push(new Bonus(this.x, this.y, ['add', 'mul', 'inc', 'dec', 'floor'][Math.floor(Math.random() * 5)])); bonusChance -= bonusChanceDec }
            bonusChance += bonusChanceInc
        }
    }
}

class Bonus {
    constructor(x, y, type) {
        this.x = x
        this.y = y
        this.type = type
    }
    check() {
        if (this.y - bonusSide > canv.height) { return true }
        if (this.y + bonusSide >= paddleY && this.y - bonusSide <= paddleY + paddleHeight && this.x + bonusSide >= paddleX && this.x - bonusSide <= paddleX + paddleWidth) {
            switch (this.type) {
                case 'add':
                    const vel = Math.sqrt(ballSpeed ** 2 / 2)
                    balls.push(new Ball(paddleX + paddleWidth / 2, paddleY - ballRadius, vel, -vel))
                    balls.push(new Ball(paddleX + paddleWidth / 2, paddleY - ballRadius, 0.001, -ballSpeed,))
                    balls.push(new Ball(paddleX + paddleWidth / 2, paddleY - ballRadius, -vel, -vel))
                    for (let i = 1; i < 4; i++) { balls[balls.length - i].calculateCollision() }
                    break;

                case 'mul':
                    console.time('mul')
                    let ang
                    const curLength = Math.min(balls.length, 100)
                    for (let i = 0; i < curLength; i++) {
                        ang = Math.acos(balls[i].velX / ballSpeed) * Math.sign(balls[i].velY / ballSpeed)
                        balls.push(new Ball(balls[i].x, balls[i].y, ballSpeed * Math.cos(ang + Math.PI / 4), ballSpeed * Math.sin(ang + Math.PI / 4)))
                        balls.push(new Ball(balls[i].x, balls[i].y, ballSpeed * Math.cos(ang - Math.PI / 4), ballSpeed * Math.sin(ang - Math.PI / 4)))

                        for (let j = 1; j < 3; j++) { balls[balls.length - j].calculateCollision() }
                    }
                    console.timeEnd('mul')
                    break;

                case 'inc':
                    paddleWidth += startPaddleWidth / 5
                    break;

                case 'dec':
                    paddleWidth -= startPaddleWidth / 5
                    break;

                case 'floor':
                    console.log('floor bonus catched!')
                    break;

                default:
                    console.log('invalid bonus type!')
                    break;
            }
            return true
        }
    }

    draw() {
        bonusCtx.drawImage(bonusImgs[this.type], this.x, this.y, bonusSide, bonusSide)
    }
    clear() {
        bonusCtx.clearRect(this.x, this.y, bonusSide, bonusSide)
    }
}
//#region varaibles
let paddleX = (canv.width - paddleWidth) / 2;
let oldPaddleX
let balls = [new Ball(x = canv.width / 2, y = paddleY - ballRadius * 2, velX = 0, velY = 0)]
let bricks = []
const bonuses = []

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
window.addEventListener('resize', () => {
    canv.width = window.innerWidth;
    canv.height = window.innerHeight
}, false);

document.addEventListener('mousemove', (e) => {
    paddleX = e.x - paddleWidth / 2
})
function moveBall(e) {
    clearBalls()
    balls[0].x = Math.min(Math.max(e.x, ballRadius), canv.width - ballRadius)
}
function throwBall(e) {
    balls[0].velY = -ballSpeed
    balls[0].velX = 0.001
    balls[0].calculateCollision()
    document.removeEventListener('mousemove', moveBall)
    document.removeEventListener('mousedown', throwBall)
    document.addEventListener('mousedown', (e) => { balls.push(new Ball(e.x, e.y, 0.1, -ballSpeed)); balls[balls.length - 1].calculateCollision() })
}
document.addEventListener('mousemove', moveBall)
document.addEventListener('mousedown', throwBall)


document.addEventListener('keydown', (e) => {
    if (e.key === 'd') {
        startTime = new Date().getTime() - 5
        draw()
    }
    if (e.key === 's') {
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
paddleCanv.width = canv.width;
paddleCanv.height = paddleHeight * 2;
const paddleCtx = paddleCanv.getContext('2d');

paddleCtx.fillStyle = "#787878";
paddleCtx.fillRect(0, 0, canv.width, paddleHeight);
paddleCtx.fillStyle = "#212121";
paddleCtx.fillRect(0, paddleHeight, canv.width, paddleHeight);

function drawPaddle() {
    ctx.drawImage(paddleCanv, 0, 0, paddleWidth, paddleHeight, paddleX, paddleY, paddleWidth, paddleHeight)
}
function clearPaddle() {
    ctx.drawImage(paddleCanv, 0, paddleHeight, paddleWidth, paddleHeight, oldPaddleX, paddleY, paddleWidth + 1, paddleHeight)
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

                ball.velX = ballSpeed * Math.cos(ang)
                ball.velY = -ballSpeed * Math.sin(ang)

                ball.calculateCollision()
                continue ballLoop
            }
        }
        if (ball.y > canv.height + ballRadius) {   // улетел вниз
            balls.splice(i, 1)
            if (!balls.length) {
                location.reload()
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

    for (let i = 0; i < bonuses.length; i++) {
        bonuses[i].clear()
        bonuses[i].y += bonusSpeed * dTime
        if (bonuses[i].check()) { bonuses.splice(i, 1) }
    }
    for (let i = 0; i < bonuses.length; i++) { bonuses[i].draw() }
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
