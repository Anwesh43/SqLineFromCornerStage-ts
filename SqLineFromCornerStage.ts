const nodes : number = 5
const lines : number = 4
const w : number = window.innerWidth
const h : number = window.innerHeight
const scGap : number = 0.05
const scDiv : number = 0.51
class SqLineFromCornerStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()

    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#212121'
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : SqLineFromCornerStage = new SqLineFromCornerStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

const getInverse : Function = (n : number) : number => 1 / n

const divideScale : Function = (scale : number, i : number, n : number) : number =>{
    const a : number = getInverse(n)
    return Math.min(a, Math.max(0, scale - i * a)) * n
}

const scaleFactor : Function = (scale : number) : number => Math.floor(scale / scDiv)

const mirrorValue : Function = (scale : number, a : number , b : number) => {
    const k : number = scaleFactor(scale)
    return (1 - k) * getInverse(a) + k * getInverse(b)
}

const updateScale : Function = (scale : number, dir : number, a : number, b : number) : number => {
    return scGap * dir * mirrorValue(scale, a, b)
}

const drawSLFCNode : Function = (context : CanvasRenderingContext2D, i : number, scale : number) => {
    const gap : number = w / (nodes + 1)
    const sc1 : number = divideScale(scale, 0, 2)
    const sc2 : number = divideScale(scale, 1, 2)
    const size : number = gap / 3
    context.lineWidth = Math.min(w, h) / 100
    context.lineCap = 'round'
    context.strokeStyle = '#880E4F'
    context.save()
    context.translate(gap * (i + 1), h/2)
    context.rotate(Math.PI/2 * sc2)
    context.strokeRect(-size/2, -size/2, size, size)
    for (var j = 0; j < lines; j++) {
        const sc : number = divideScale(sc1, j, lines)
        context.save()
        context.rotate(Math.PI/2 * sc)
        context.beginPath()
        context.moveTo(size/2, size/2)
        context.lineTo(size/2 + (size/2) * sc, size/2 + (size/2) * sc)
        context.stroke()
        context.restore()
    }
    context.restore()
}

class State {
    scale : number = 0
    dir : number = 0
    prevScale : number = 0

    update(cb : Function) {
        this.scale += updateScale(this.scale, this.dir, lines, 1)
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class SLFCNode {
    prev : SLFCNode
    next : SLFCNode
    state : State = new State()
    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new SLFCNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        drawSLFCNode(context, this.i, this.state.scale)
        this.next.draw(context)
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : SLFCNode {
        var curr : SLFCNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class SqLineFromCorner {
    root : SLFCNode = new SLFCNode(0)
    curr : SLFCNode = this.root
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.root.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    slfc : SqLineFromCorner = new SqLineFromCorner()
    animator : Animator = new Animator()
    render(context : CanvasRenderingContext2D) {
        this.slfc.draw(context)
    }

    handleTap(cb : Function) {
        this.slfc.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.slfc.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }
}
