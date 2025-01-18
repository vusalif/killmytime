/* NeuQuant Neural-Net Quantization Algorithm
 * ------------------------------------------
 *
 * Copyright (c) 1994 Anthony Dekker
 *
 * NEUQUANT Neural-Net quantization algorithm by Anthony Dekker, 1994.
 * See "Kohonen neural networks for optimal colour quantization"
 * in "Network: Computation in Neural Systems" Vol. 5 (1994) pp 351-367.
 * for a discussion of the algorithm.
 * See also http://members.ozemail.com.au/~dekker/NEUQUANT.HTML
 *
 * Any party obtaining a copy of these files from the author, directly or
 * indirectly, is granted, free of charge, a full and unrestricted irrevocable,
 * world-wide, paid up, royalty-free, nonexclusive right and license to deal
 * in this software and documentation files (the "Software"), including without
 * limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons who receive
 * copies from any such party to do so, with the only requirement being
 * that this copyright notice remain intact.
 *
 * (JavaScript port 2012 by Johan Nordberg)
 */

function TypedNeuQuant(pixels, samplefac) {
    var network; // int[netsize][4]
    var netindex; // for network lookup - really 256

    // bias and freq arrays for learning
    var bias;
    var freq;
    var radpower;

    var netsize = 256; // number of colours used
    var maxnetpos = netsize - 1;

    // defs for freq and bias
    var netbiasshift = 4; // bias for colour values
    var intbiasshift = 16; // bias for fractions
    var intbias = (1 << intbiasshift);
    var gammashift = 10;
    var gamma = (1 << gammashift);
    var betashift = 10;
    var beta = (intbias >> betashift); // beta = 1/1024
    var betagamma = (intbias << (gammashift - betashift));

    // defs for decreasing radius factor
    var initrad = (netsize >> 3); // for 256 cols, radius starts
    var radiusbiasshift = 6; // at 32.0 biased by 6 bits
    var radiusbias = (1 << radiusbiasshift);
    var initradius = (initrad * radiusbias); //and decreases by a
    var radiusdec = 30; // factor of 1/30 each cycle

    // defs for decreasing alpha factor
    var alphabiasshift = 10; // alpha starts at 1.0
    var initalpha = (1 << alphabiasshift);
    var alphadec; // biased by 10 bits

    // radbias and alpharadbias used for radpower calculation
    var radbiasshift = 8;
    var radbias = (1 << radbiasshift);
    var alpharadbshift = (alphabiasshift + radbiasshift);
    var alpharadbias = (1 << alpharadbshift);

    // four primes near 500 - assume no image has a length so large that it is
    // divisible by all four primes
    var prime1 = 499;
    var prime2 = 491;
    var prime3 = 487;
    var prime4 = 503;
    var minpicturebytes = (3 * prime4);

    /*
     * Constructor: TypedNeuQuant
     * Initializes network in use for pixel mapping.
     *
     * pixels - array of pixels in RGB format
     * samplefac - sampling factor 1 to 30 where lower numbers
     *             mean better quality, but slower performance.
     */
    function init() {
        network = [];
        netindex = new Int32Array(256);
        bias = new Int32Array(netsize);
        freq = new Int32Array(netsize);
        radpower = new Int32Array(netsize >> 3);

        var i, v;
        for (i = 0; i < netsize; i++) {
            v = (i << (netbiasshift + 8)) / netsize;
            network[i] = new Float64Array([v, v, v, 0]);
            freq[i] = intbias / netsize;
            bias[i] = 0;
        }
    }

    function unbiasnet() {
        for (var i = 0; i < netsize; i++) {
            network[i][0] >>= netbiasshift;
            network[i][1] >>= netbiasshift;
            network[i][2] >>= netbiasshift;
            network[i][3] = i;
        }
    }

    function altersingle(alpha, i, b, g, r) {
        network[i][0] -= (alpha * (network[i][0] - b)) / initalpha;
        network[i][1] -= (alpha * (network[i][1] - g)) / initalpha;
        network[i][2] -= (alpha * (network[i][2] - r)) / initalpha;
    }

    function alterneigh(radius, i, b, g, r) {
        var lo = Math.abs(i - radius);
        var hi = Math.min(i + radius, netsize);

        var j = i + 1;
        var k = i - 1;
        var m = 1;

        var p, a;
        while ((j < hi) || (k > lo)) {
            a = radpower[m++];

            if (j < hi) {
                p = network[j++];
                p[0] -= (a * (p[0] - b)) / alpharadbias;
                p[1] -= (a * (p[1] - g)) / alpharadbias;
                p[2] -= (a * (p[2] - r)) / alpharadbias;
            }

            if (k > lo) {
                p = network[k--];
                p[0] -= (a * (p[0] - b)) / alpharadbias;
                p[1] -= (a * (p[1] - g)) / alpharadbias;
                p[2] -= (a * (p[2] - r)) / alpharadbias;
            }
        }
    }

    function contest(b, g, r) {
        var bestd = ~(1 << 31);
        var bestbiasd = bestd;
        var bestpos = -1;
        var bestbiaspos = bestpos;

        var i, n, dist, biasdist, betafreq;
        for (i = 0; i < netsize; i++) {
            n = network[i];

            dist = Math.abs(n[0] - b) + Math.abs(n[1] - g) + Math.abs(n[2] - r);
            if (dist < bestd) {
                bestd = dist;
                bestpos = i;
            }

            biasdist = dist - ((bias[i]) >> (intbiasshift - netbiasshift));
            if (biasdist < bestbiasd) {
                bestbiasd = biasdist;
                bestbiaspos = i;
            }

            betafreq = (freq[i] >> betashift);
            freq[i] -= betafreq;
            bias[i] += (betafreq << gammashift);
        }

        freq[bestpos] += beta;
        bias[bestpos] -= betagamma;

        return bestbiaspos;
    }

    /*
     * Move neuron i towards biased (b,g,r) by factor alpha
     */
    function inxbuild() {
        var i, j, p, q, smallpos, smallval, previouscol = 0, startpos = 0;
        for (i = 0; i < netsize; i++) {
            p = network[i];
            smallpos = i;
            smallval = p[1]; // index on g
            // find smallest in i..netsize-1
            for (j = i + 1; j < netsize; j++) {
                q = network[j];
                if (q[1] < smallval) { // index on g
                    smallpos = j;
                    smallval = q[1]; // index on g
                }
            }
            q = network[smallpos];
            // swap p (i) and q (smallpos) entries
            if (i != smallpos) {
                j = q[0];
                q[0] = p[0];
                p[0] = j;
                j = q[1];
                q[1] = p[1];
                p[1] = j;
                j = q[2];
                q[2] = p[2];
                p[2] = j;
                j = q[3];
                q[3] = p[3];
                p[3] = j;
            }
            // smallval entry is now in position i
            if (smallval != previouscol) {
                netindex[previouscol] = (startpos + i) >> 1;
                for (j = previouscol + 1; j < smallval; j++)
                    netindex[j] = i;
                previouscol = smallval;
                startpos = i;
            }
        }
        netindex[previouscol] = (startpos + maxnetpos) >> 1;
        for (j = previouscol + 1; j < 256; j++)
            netindex[j] = maxnetpos; // really 256
    }

    /*
     * Main Learning Loop
     */
    function learn() {
        var i;

        var lengthcount = pixels.length;
        var alphadec = 30 + ((samplefac - 1) / 3);
        var samplepixels = lengthcount / (3 * samplefac);
        var delta = ~~(samplepixels / ncycles);
        var alpha = initalpha;
        var radius = initradius;

        var rad = radius >> radiusbiasshift;

        if (rad <= 1) rad = 0;
        for (i = 0; i < rad; i++)
            radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));

        var step;
        if (lengthcount < minpicturebytes) {
            samplefac = 1;
            step = 3;
        } else if ((lengthcount % prime1) !== 0) {
            step = 3 * prime1;
        } else if ((lengthcount % prime2) !== 0) {
            step = 3 * prime2;
        } else if ((lengthcount % prime3) !== 0) {
            step = 3 * prime3;
        } else {
            step = 3 * prime4;
        }

        var b, g, r, j;
        var pix = 0; // current pixel

        i = 0;
        while (i < samplepixels) {
            b = (pixels[pix] & 0xff) << netbiasshift;
            g = (pixels[pix + 1] & 0xff) << netbiasshift;
            r = (pixels[pix + 2] & 0xff) << netbiasshift;

            j = contest(b, g, r);

            altersingle(alpha, j, b, g, r);
            if (rad !== 0) alterneigh(rad, j, b, g, r); // alter neighbours

            pix += step;
            if (pix >= lengthcount) pix -= lengthcount;

            i++;

            if (delta === 0) delta = 1;

            if (i % delta === 0) {
                alpha -= alpha / alphadec;
                radius -= radius / radiusdec;
                rad = radius >> radiusbiasshift;

                if (rad <= 1) rad = 0;
                for (j = 0; j < rad; j++)
                    radpower[j] = alpha * (((rad * rad - j * j) * radbias) / (rad * rad));
            }
        }
    }

    /*
     * Search for BGR values 0..255 (after net is unbiased) and return colour index
     */
    function map(b, g, r) {
        var i, j, dist, a, bestd;
        var best;
        bestd = 1000; // biggest possible dist is 256*3
        best = -1;
        i = netindex[g]; // index on g
        j = i - 1; // start at netindex[g] and work outwards

        while ((i < netsize) || (j >= 0)) {
            if (i < netsize) {
                a = network[i];
                dist = a[1] - g; // inx key
                if (dist >= bestd) i = netsize; // stop iter
                else {
                    i++;
                    if (dist < 0) dist = -dist;
                    a = a[0] - b;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = a[2] - r;
                        if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = network[i][3];
                        }
                    }
                }
            }
            if (j >= 0) {
                a = network[j];
                dist = g - a[1]; // inx key - reverse dif
                if (dist >= bestd) j = -1; // stop iter
                else {
                    j--;
                    if (dist < 0) dist = -dist;
                    a = a[0] - b;
                    if (a < 0) a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = a[2] - r;
                        if (a < 0) a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = network[j][3];
                        }
                    }
                }
            }
        }

        return best;
    }

    function process() {
        learn();
        unbiasnet();
        inxbuild();
        return colorMap();
    }

    /*
     * Unbias network to give byte values 0..255 and record position i to prepare for sort
     */
    function colorMap() {
        var map = [];
        var index = [];
        for (var i = 0; i < netsize; i++)
            index[network[i][3]] = i;
        var k = 0;
        for (var l = 0; l < netsize; l++) {
            var j = index[l];
            map[k++] = (network[j][0]);
            map[k++] = (network[j][1]);
            map[k++] = (network[j][2]);
        }
        return map;
    }

    /*
     * Insertion sort of network and building of netindex[0..255] (to do after unbias)
     */
    var ncycles = 100; // number of learning cycles

    // initialize and learn
    init();
    process();

    /*
     * Public methods
     */
    var exports = {
        map: map, // converts a color to a palette index
        process: process, // process() converts the image to the palette
        colorMap: colorMap // returns the color map
    };
    return exports;
}

try {
    exports.TypedNeuQuant = TypedNeuQuant;
} catch (e) {
    // nothing
} 