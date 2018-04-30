
class Canvas {

    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Number} width
     * @param {Number} height
     */
    constructor (canvas, width, height) {
        this.canvas = canvas;
        this.width = width;
        this.height = height;
        this.canvas.setAttribute("width", width.toString());
        this.canvas.setAttribute("height", height.toString());
        this.context = canvas.getContext("2d");

        this.reset();
    }

    /**
     * @return {ImageData}
     */
    getUnderlyingBufferCopy() {
        return this.context.getImageData(0, 0, this.width, this.height);
    }

    /**
     * Paint the whole canvas black and set opacity to maximum.
     */
    reset() {
        const imageData = this.getUnderlyingBufferCopy();
        const buffer = imageData.data;
        buffer.fill(0);
        // raise opacity levels
        for (let i = 3; i < buffer.length; i += 4) {
            buffer[i] = 255;
        }
        this.context.putImageData(imageData, 0, 0);
    }

    coordToIndex(x, y) {
        return 4 * (y * this.width + x);
    }

    isPixelBlank(buffer, x, y) {
        const [r, g, b] = this.getRGB(buffer, x, y);
        return (r + g + b) === 0;
    }

    paintRandomPoints(howMany) {
        const imageData = this.getUnderlyingBufferCopy();
        const buffer = imageData.data;

        for (let i = 0; i < howMany; i++) {
            const x = 1 + Math.trunc(Math.random() * (this.width - 2));
            const y = 1 + Math.trunc(Math.random() * (this.height - 2));
            if (!this.isPixelBlank(buffer, x, y)) {
                continue; // we don't want to color it again; also, don't bother decrementing i
            }
            const rgOrB = Math.trunc(Math.random() * 3);
            buffer[this.coordToIndex(x, y) + rgOrB] = 255;
        }

        // for (let y = 1; y < this.height - 1; y++) {
        //     for (let x = 1; x < this.width - 1; x++) {
        //         const rgOrB = Math.trunc(Math.random() * 3);
        //         buffer[4 * (y * this.width + x) + rgOrB] = 255;
        //     }
        // }

        this.context.putImageData(imageData, 0, 0);
    }

    /**
     * Prepares two copies of this canvas' underlying buffer: one for reading and another for writing. It's important
     * that the writing buffer is not used for reading, since it may read something that was written in this same
     * drawing iteration, compromising the simulation's global state integrity.
     *
     * @param {function(Uint8ClampedArray, Uint8ClampedArray)} callback - will be called when the two copies are ready
     */
    doWork(callback) {
        const originalImageData = this.getUnderlyingBufferCopy();
        const originalBuffer = originalImageData.data;

        const workingImageData = this.getUnderlyingBufferCopy();
        const workingBuffer = workingImageData.data;

        callback.call(this, originalBuffer, workingBuffer);

        this.context.putImageData(workingImageData, 0, 0);
    }

    getRGB(buffer, x, y) {
        const r = buffer[this.coordToIndex(x, y) + 0];
        const g = buffer[this.coordToIndex(x, y) + 1];
        const b = buffer[this.coordToIndex(x, y) + 2];
        return [r, g, b];
    }

    setRGB(buffer, x, y, r, g, b) {
        buffer[this.coordToIndex(x, y) + 0] = r;
        buffer[this.coordToIndex(x, y) + 1] = g;
        buffer[this.coordToIndex(x, y) + 2] = b;
    }
}

function *range(begin, end) {
    for (let i = begin; i < end; i++) {
        yield i;
    }
}

class RockPaperAutomata {

    static getCssVariableNumber(variableName) {
        return parseInt(window.getComputedStyle(document.body).getPropertyValue(variableName), 10);
    }

    update() {
        this.uiCanvas.doWork(/** @this {Canvas} */ function (originalBuffer, workingBuffer) {
            // iterate over all pixels except for the ones in the border, just to simplify neighbor comparisons
            for (const y of range(1, this.height - 1)) {
                for (const x of range(1, this.width - 1)) {
                    const [r, g, b] = this.getRGB(originalBuffer, x, y);
                    if (r + g + b === 0) {  // blank pixel, let's work on it
                        const dx = Math.trunc(Math.random() * 3) - 1;
                        const dy = Math.trunc(Math.random() * 3) - 1;
                        // may pick the pixel itself, no big deal

                        const [or, og, ob] = this.getRGB(originalBuffer, x + dx, y + dy);
                        this.setRGB(workingBuffer, x, y, or, og, ob);
                    }
                }
            }
        });

        // ToDo update cells
        // ToDo swap buffers

        window.requestAnimationFrame(this.update.bind(this));
    }

    constructor () {
        const width = RockPaperAutomata.getCssVariableNumber("--canvas-width");
        const height = RockPaperAutomata.getCssVariableNumber("--canvas-height");

        this.uiCanvas = new Canvas(/** @type {HTMLCanvasElement} */ document.getElementById("canvas"), width, height);
        this.uiCanvas.paintRandomPoints(1000);

        window.requestAnimationFrame(this.update.bind(this));
    }
}

window.addEventListener("load", () => new RockPaperAutomata());
