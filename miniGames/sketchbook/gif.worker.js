importScripts('NeuQuant.js');

// GIF Encoder implementation
var GIFEncoder = function() {
    var exports = {};
    var width; // image size
    var height;
    var transparent = null; // transparent color if given
    var transIndex; // transparent index in color table
    var repeat = -1; // no repeat
    var delay = 0; // frame delay (hundredths)
    var started = false; // ready to output frames
    var out;
    var image; // current frame
    var pixels; // BGR byte array from frame
    var indexedPixels; // converted frame indexed to palette
    var colorDepth; // number of bit planes
    var colorTab; // RGB palette
    var usedEntry = []; // active palette entries
    var palSize = 7; // color table size (bits-1)
    var dispose = -1; // disposal code (-1 = use default)
    var closeStream = false; // close stream when finished
    var firstFrame = true;
    var sizeSet = false; // if false, get size from first frame
    var sample = 10; // default sample interval for quantizer

    var setDelay = exports.setDelay = function setDelay(ms) {
        delay = Math.round(ms / 10);
    };

    var setFrameRate = exports.setFrameRate = function setFrameRate(fps) {
        if (fps != 0) delay = Math.round(100 / fps);
    };

    var setDispose = exports.setDispose = function setDispose(code) {
        if (code >= 0) dispose = code;
    };

    var setRepeat = exports.setRepeat = function setRepeat(iter) {
        if (iter >= 0) repeat = iter;
    };

    var setTransparent = exports.setTransparent = function setTransparent(color) {
        transparent = color;
    };

    var setSize = exports.setSize = function setSize(w, h) {
        width = w;
        height = h;
        if (width < 1) width = 320;
        if (height < 1) height = 240;
        sizeSet = true;
    };

    var setQuality = exports.setQuality = function setQuality(quality) {
        if (quality < 1) quality = 1;
        sample = quality;
    };

    var start = exports.start = function start() {
        var ok = true;
        if (!started) {
            if (!width || !height) {
                ok = false;
            } else {
                started = true;
                out = { bin: [] };
                out.writeUTFBytes = function(str) {
                    for (var i = 0; i < str.length; i++)
                        this.bin.push(str.charCodeAt(i));
                };
                out.writeByte = function(val) {
                    this.bin.push(val);
                };
                out.writeBytes = function(array, offset, length) {
                    for (var i = 0; i < length; i++)
                        this.bin.push(array[offset + i]);
                };
                out.writeUTFBytes("GIF89a");
            }
        }
        return ok;
    };

    var addFrame = exports.addFrame = function addFrame(imageData) {
        if (!started || !imageData) return false;

        var ok = true;
        try {
            image = imageData;
            getImagePixels(); // convert to correct format if necessary
            analyzePixels(); // build color table & map pixels

            if (firstFrame) {
                writeLSD(); // logical screen descriptior
                writePalette(); // global color table
                if (repeat >= 0) {
                    // use NS app extension to indicate reps
                    writeNetscapeExt();
                }
            }

            writeGraphicCtrlExt(); // write graphic control extension
            writeImageDesc(); // image descriptor
            if (!firstFrame) writePalette(); // local color table
            writePixels(); // encode and write pixel data
            firstFrame = false;
        } catch (e) {
            ok = false;
        }

        return ok;
    };

    var finish = exports.finish = function finish() {
        if (!started) return false;

        var ok = true;
        started = false;

        try {
            out.writeByte(0x3b); // gif trailer
        } catch (e) {
            ok = false;
        }

        return ok;
    };

    var getImagePixels = function getImagePixels() {
        var w = width;
        var h = height;
        pixels = [];
        var data = image;
        
        for (var i = 0; i < h; i++) {
            for (var j = 0; j < w; j++) {
                var b = (i * w * 4) + j * 4;
                pixels.push(data[b]);
                pixels.push(data[b+1]);
                pixels.push(data[b+2]);
            }
        }
    };

    var analyzePixels = function analyzePixels() {
        var len = pixels.length;
        var nPix = len / 3;
        indexedPixels = new Uint8Array(nPix);

        var nq = new NeuQuant(pixels, len, sample);
        colorTab = nq.process(); // create reduced palette

        // Map image pixels to new palette
        var k = 0;
        for (var j = 0; j < nPix; j++) {
            var index = nq.map(pixels[k++] & 0xff, pixels[k++] & 0xff, pixels[k++] & 0xff);
            usedEntry[index] = true;
            indexedPixels[j] = index;
        }

        pixels = null;
        colorDepth = 8;
        palSize = 7;

        // Get closest match to transparent color if specified
        if (transparent !== null) {
            transIndex = findClosest(transparent);
        }
    };

    var findClosest = function findClosest(c) {
        if (colorTab === null) return -1;
        var r = (c & 0xFF0000) >> 16;
        var g = (c & 0x00FF00) >> 8;
        var b = (c & 0x0000FF);
        var minpos = 0;
        var dmin = 256 * 256 * 256;
        var len = colorTab.length;

        for (var i = 0; i < len;) {
            var dr = r - (colorTab[i++] & 0xff);
            var dg = g - (colorTab[i++] & 0xff);
            var db = b - (colorTab[i] & 0xff);
            var d = dr * dr + dg * dg + db * db;
            var index = i / 3;
            if (usedEntry[index] && (d < dmin)) {
                dmin = d;
                minpos = index;
            }
            i++;
        }

        return minpos;
    };

    var writeGraphicCtrlExt = function writeGraphicCtrlExt() {
        out.writeByte(0x21); // extension introducer
        out.writeByte(0xf9); // GCE label
        out.writeByte(4); // data block size
        var transp, disp;
        if (transparent === null) {
            transp = 0;
            disp = 0; // dispose = no action
        } else {
            transp = 1;
            disp = 2; // force clear if using transparent color
        }
        if (dispose >= 0) {
            disp = dispose & 7; // user override
        }
        disp <<= 2;
        out.writeByte(0 | // 1:3 reserved
            disp | // 4:6 disposal
            0 | // 7 user input - 0 = none
            transp); // 8 transparency flag
        writeShort(delay); // delay x 1/100 sec
        out.writeByte(transIndex); // transparent color index
        out.writeByte(0); // block terminator
    };

    var writeImageDesc = function writeImageDesc() {
        out.writeByte(0x2c); // image separator
        writeShort(0); // image position x,y = 0,0
        writeShort(0);
        writeShort(width); // image size
        writeShort(height);

        // packed fields
        if (firstFrame) {
            // no LCT - GCT is used for first (or only) frame
            out.writeByte(0);
        } else {
            // specify normal LCT
            out.writeByte(0x80 | // 1 local color table 1=yes
                0 | // 2 interlace - 0=no
                0 | // 3 sorted - 0=no
                0 | // 4-5 reserved
                palSize); // 6-8 size of color table
        }
    };

    var writeLSD = function writeLSD() {
        // logical screen size
        writeShort(width);
        writeShort(height);
        // packed fields
        out.writeByte(0x80 | // 1 : global color table flag = 1 (gct used)
            0x70 | // 2-4 : color resolution = 7
            0x00 | // 5 : gct sort flag = 0
            palSize); // 6-8 : gct size
        out.writeByte(0); // background color index
        out.writeByte(0); // pixel aspect ratio - assume 1:1
    };

    var writeNetscapeExt = function writeNetscapeExt() {
        out.writeByte(0x21); // extension introducer
        out.writeByte(0xff); // app extension label
        out.writeByte(11); // block size
        out.writeUTFBytes('NETSCAPE2.0'); // app id + auth code
        out.writeByte(3); // sub-block size
        out.writeByte(1); // loop sub-block id
        writeShort(repeat); // loop count (extra iterations, 0=repeat forever)
        out.writeByte(0); // block terminator
    };

    var writePalette = function writePalette() {
        out.writeBytes(colorTab);
        var n = (3 * 256) - colorTab.length;
        for (var i = 0; i < n; i++)
            out.writeByte(0);
    };

    var writeShort = function writeShort(pValue) {
        out.writeByte(pValue & 0xFF);
        out.writeByte((pValue >> 8) & 0xFF);
    };

    var writePixels = function writePixels() {
        var enc = new LZWEncoder(width, height, indexedPixels, colorDepth);
        enc.encode(out);
    };

    var stream = exports.stream = function stream() {
        return out;
    };

    return exports;
};

// Handle incoming worker messages
self.onmessage = function(e) {
    console.log('Worker received message:', e.data);
    var encoder = new GIFEncoder();
    var page = e.data;

    if (page.delay) encoder.setDelay(page.delay);
    if (page.repeat >= 0) encoder.setRepeat(page.repeat);
    if (page.transparent) encoder.setTransparent(page.transparent);
    if (page.width) encoder.setSize(page.width, page.height);
    if (page.quality) encoder.setQuality(page.quality);

    encoder.start();
    encoder.addFrame(page.data);
    encoder.finish();

    var stream = encoder.stream();
    self.postMessage({
        type: 'progress',
        data: stream.bin,
        index: page.index,
        last: page.last
    });
}; 