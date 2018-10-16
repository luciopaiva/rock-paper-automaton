
const cssVar = (varName) => getComputedStyle(document.documentElement)
    .getPropertyValue(varName.startsWith("--") ? "" : "--" + varName);
const cssVarAsNumber = (varName) => parseInt(cssVar(varName), 10);

/**
 * https://stackoverflow.com/a/52827031/778272
 * @returns {Boolean} true if system is big endian */
function isBigEndian() {
    const array = new Uint8Array(4);
    const view = new Uint32Array(array.buffer);
    return !((view[0] = 1) & array[0]);
}
console.info("Endianness: " + (isBigEndian() ? "big" : "little"));

const rgb = isBigEndian() ?
    (r, g, b) => (r << 24) | (g << 16) | (b << 8) | 0xff:
    (r, g, b) => (0xff << 24) | (b << 16) | (g << 8) | r;

class Cell {

}

class Rock {

    constructor () {
        this.scale = 4;
        this.width = Math.ceil(screen.width / this.scale);
        this.height = Math.ceil(screen.height / this.scale);
        this.numCells = this.width * this.height;
        console.info(`width=${this.width}, height=${this.height}, numCells=${this.numCells}`);

        this.canvas = document.getElementById("canvas");
        this.canvas.style.width = `${screen.width}px`;
        this.canvas.style.height = `${screen.height}px`;
        this.canvas.setAttribute("width", this.width.toString());
        this.canvas.setAttribute("height", this.height.toString());
        this.ctx = this.canvas.getContext("2d");
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);

        this.cells = Array.from(Array(this.numCells), () => new Cell());
        this.buffer = new Uint32Array(this.imageData.data.buffer);

        this.update();

        this.fpsElem = document.getElementById("fps");
        this.fpsCount = 0;
        this.elapsedElem = document.getElementById("elapsed");
        this.elapsedSum = 0;
        this.elapsedCount = 0;
        setInterval(this.doMetrics.bind(this), 1000);
    }

    update() {
        const start = performance.now();
        for (let i = 0; i < this.numCells; i++) {
            const level = (128 * Math.random()) & 0xff;
            const r = level;
            const g = level;
            const b = level;
            this.buffer[i] = rgb(r, g, b);
        }

        this.ctx.putImageData(this.imageData, 0, 0);

        this.fpsCount++;
        this.elapsedSum += performance.now() - start;
        this.elapsedCount++;
        requestAnimationFrame(this.update.bind(this));
    }

    doMetrics() {
        this.fpsElem.innerText = this.fpsCount.toString() + "Hz";
        this.elapsedElem.innerText = (this.elapsedSum / this.elapsedCount).toFixed(1) + "ms";
        this.fpsCount = this.elapsedSum = this.elapsedCount = 0;
    }
}

new Rock();
