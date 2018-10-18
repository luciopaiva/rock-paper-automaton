
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

const rgbToVal = isBigEndian() ?
    (r, g, b) => ((r << 24) | (g << 16) | (b << 8) | 0xff) >>> 0:
    (r, g, b) => ((0xff << 24) | (b << 16) | (g << 8) | r) >>> 0;

const valToRGB = isBigEndian() ?
    (val) => [(val >>> 24) & 0xff, (val >>> 16) & 0xff, (val >>> 8)  & 0xff] :
    (val) => [         val & 0xff, (val >>> 8)  & 0xff, (val >>> 16) & 0xff];

const rgbDist = ([r1, g1, b1], [r2, g2, b2]) => Math.abs(r2 - r1) + Math.abs(g2 - g1) + Math.abs(b2 - b1);

class Cell {

    constructor () {
        this.level = Cell.INITIAL_LEVEL;
        this.type = Cell.TYPE_NEUTRAL;
    }
}

Cell.INITIAL_LEVEL = 15;
Cell.EDIBLE_LEVEL = 1;
Cell.TYPE_NEUTRAL = rgbToVal(0, 0, 0);

class Rock {

    constructor () {
        this.scale = 4;
        this.width = Math.ceil(screen.width / this.scale);
        this.height = Math.ceil(screen.height / this.scale);
        this.numCells = this.width * this.height;
        console.info(`width=${this.width}, height=${this.height}, numCells=${this.numCells}`);

        this.loadColors();

        this.foregroundCells = Array.from(Array(this.numCells), () => new Cell());
        this.backgroundCells = Array.from(Array(this.numCells), () => new Cell());

        this.neighborDeltas = [
            -this.width,  // top
            1,            // right
            this.width,   // bottom
            -1            // left
        ];

        this.canvas = document.getElementById("canvas");
        this.canvas.style.width = `${screen.width}px`;
        this.canvas.style.height = `${screen.height}px`;
        this.canvas.setAttribute("width", this.width.toString());
        this.canvas.setAttribute("height", this.height.toString());
        this.ctx = this.canvas.getContext("2d");
        this.reloadBuffer();

        this.paintSectors();

        // turn off cells at the borders so they don't run the algorithm
        this.clearBorders();
        this.initializeBackgroundCells();

        this.update();

        this.fpsElem = document.getElementById("fps");
        this.fpsCount = 0;
        this.elapsedElem = document.getElementById("elapsed");
        this.elapsedSum = 0;
        this.elapsedCount = 0;
        setInterval(this.doMetrics.bind(this), 1000);
    }

    loadColors() {
        const cssColorToVal = (i) => {
            const val = parseInt(cssVar(`color-${i}`).match(/[a-fA-F0-9]{6}/)[0], 16);
            const r = val >>> 16 & 0xff;
            const g = val >>> 8 & 0xff;
            const b = val & 0xff;
            return rgbToVal(r, g, b);
        };
        this.colorEmpty = rgbToVal(0, 0, 0);
        this.colorIndexes = [
            cssColorToVal(1),
            cssColorToVal(2),
            cssColorToVal(3),
        ];
    }

    reloadBuffer() {
        this.imageData = this.ctx.getImageData(0, 0, this.width, this.height);
        this.buffer = new Uint32Array(this.imageData.data.buffer);
    }

    update() {
        const start = performance.now();
        for (let i = 0; i < this.numCells; i++) {
            const me = this.backgroundCells[i];
            this.foregroundCells[i].level = me.level > 0 ? me.level - 1 : 0;
            this.foregroundCells[i].type = me.type;

            if (me.type === Cell.TYPE_NEUTRAL) {
                continue;
            }

            if (me.level > Cell.EDIBLE_LEVEL) {  // cell can't be eaten
                continue;
            }

            const neighborIndex = this.pickRandomNeighborIndex(i);
            const neighbor = this.backgroundCells[neighborIndex];

            if (neighbor.level >= me.level) {
                if (neighbor.type === this.colorIndexes[2] && me.type === this.colorIndexes[1] ||
                    neighbor.type === this.colorIndexes[1] && me.type === this.colorIndexes[0] ||
                    neighbor.type === this.colorIndexes[0] && me.type === this.colorIndexes[2]) {

                    this.foregroundCells[i].type = neighbor.type;
                    this.foregroundCells[i].level = Cell.INITIAL_LEVEL;
                }
            }
        }

        for (let i = 0; i < this.numCells; i++) {
            this.buffer[i] = this.foregroundCells[i].type;
        }

        this.ctx.putImageData(this.imageData, 0, 0);

        // swap
        const cells = this.foregroundCells;
        this.foregroundCells = this.backgroundCells;
        this.backgroundCells = cells;

        this.fpsCount++;
        this.elapsedSum += performance.now() - start;
        this.elapsedCount++;
        requestAnimationFrame(this.update.bind(this));
    }

    pickRandomNeighborIndex(i) {
        return i + this.neighborDeltas[Math.floor(Math.random() * this.neighborDeltas.length)];
    }

    paintSectors() {
        const x = this.width / 2;
        const y = this.height / 2;
        const radius = this.width;

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI / 3, false);
        this.ctx.lineTo(x, y);
        this.ctx.fillStyle = cssVar("color-1");
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, radius, 2 * Math.PI / 3, 4 * Math.PI / 3, false);
        this.ctx.lineTo(x, y);
        this.ctx.fillStyle = cssVar("color-2");
        this.ctx.fill();

        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, radius, 4 * Math.PI / 3, 0, false);
        this.ctx.lineTo(x, y);
        this.ctx.fillStyle = cssVar("color-3");
        this.ctx.fill();

        // update buffer with what was just drawn
        this.reloadBuffer();

        this.saturateChannels();
    }

    initializeBackgroundCells() {
        for (let i = 0; i < this.numCells; i++) {
            this.backgroundCells[i].type = this.buffer[i];
            this.backgroundCells[i].level = Cell.EDIBLE_LEVEL;  // so it starts running right away
        }
    }

    /**
     * After paintSector() runs, anti-aliased pixels will result. This method traverses the whole canvas, snapping each
     * pixel color to the nearest known color.
     */
    saturateChannels() {
        for (let i = 0; i < this.numCells; i++) {
            const rgb = valToRGB(this.buffer[i]);

            let chosenColor = null;  // this.colorEmpty;  // set to black by default
            let minDist = Number.POSITIVE_INFINITY;  // rgbDist(valToRGB(this.colorEmpty), rgb);

            for (let ci = 0; ci < this.colorIndexes.length; ci++) {
                const dist = rgbDist(valToRGB(this.colorIndexes[ci]), rgb);
                if (dist < minDist) {
                    minDist = dist;
                    chosenColor = this.colorIndexes[ci];
                }
            }

            this.buffer[i] = chosenColor;
        }
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    // do not let the pixels in the border be painted
    clearBorders() {
        const black = rgbToVal(0, 0, 0);
        for (let x = 0; x < this.width; x++) {
            this.buffer[x] = black;  // top border
            this.buffer[(this.height - 1) * this.width + x] = black;  // bottom border
        }
        for (let y = 0; y < this.height; y++) {
            this.buffer[y * this.width] = black;  // left border
            this.buffer[y * this.width + this.width - 1] = black;  // right border
        }
        this.ctx.putImageData(this.imageData, 0, 0);
    }

    doMetrics() {
        this.fpsElem.innerText = this.fpsCount.toString() + "Hz";
        this.elapsedElem.innerText = (this.elapsedSum / this.elapsedCount).toFixed(1) + "ms";
        this.fpsCount = this.elapsedSum = this.elapsedCount = 0;
    }
}

new Rock();
