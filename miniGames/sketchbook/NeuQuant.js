/*
* NeuQuant Neural-Net Quantization Algorithm
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
*/

function NeuQuant(pixels, samplefac) {
    var network;
    var netindex;
    var bias;
    var freq;
    var radpower;

    var netsize = 256; // number of colours used
    var maxnetpos = netsize - 1;
    var initrad = netsize >> 3; // for 256 cols, radius starts at 32
    var radiusbiasshift = 6;
    var radiusbias = 1 << radiusbiasshift;
    var initbiasradius = initrad * radiusbias;
    var radiusdec = 30; // factor of 1/30 each cycle

    var alphabiasshift = 10; // alpha starts at 1
    var initalpha = 1 << alphabiasshift; // biased by 10 bits

    var alphadec; // biased by 10 bits
    var lengthcount;
    var samplepixels;

    var n = 3;
    var nrows;
    var ncols;
    var pixels_length;
    var rad;

    this.buildColormap = function() {
        network = [];
        netindex = new Int32Array(256);
        bias = new Int32Array(netsize);
        freq = new Int32Array(netsize);
        radpower = new Int32Array(netsize >> 3);

        var i, v;
        for (i = 0; i < netsize; i++) {
            v = (i << (netbiasshift + 8)) / netsize;
            network[i] = new Float64Array([v, v, v]);
            freq[i] = intbias / netsize;
            bias[i] = 0;
        }
    };

    this.getColormap = function() {
        var map = [];
        var index = [];

        for (var i = 0; i < netsize; i++)
            index[network[i][3]] = i;

        var k = 0;
        for (var l = 0; l < netsize; l++) {
            var j = index[l];
            map[k++] = network[j][0];
            map[k++] = network[j][1];
            map[k++] = network[j][2];
        }
        return map;
    };

    // Insertion sort of network and building of netindex[0..255]
    function inxbuild() {
        var i, j, smallpos, smallval;
        var p;
        var q;
        var previouscol, startpos;

        previouscol = 0;
        startpos = 0;
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

    this.learn = function() {
        var i;
        var j;
        var b;
        var g;
        var r;
        var radius;
        var rad;
        var alpha;
        var step;
        var delta;
        var samplepixels;
        var p;
        var pix;
        var lim;

        if (lengthcount < minpicturebytes)
            samplefac = 1;
        alphadec = 30 + ((samplefac - 1) / 3);
        p = pixels;
        pix = 0;
        lim = lengthcount;
        samplepixels = lengthcount / (3 * samplefac);
        delta = samplepixels / ncycles;
        alpha = initalpha;
        radius = initradius;

        rad = radius >> radiusbiasshift;
        if (rad <= 1)
            rad = 0;
        for (i = 0; i < rad; i++)
            radpower[i] = alpha * (((rad * rad - i * i) * radbias) / (rad * rad));

        if (lengthcount < minpicturebytes) {
            step = 3;
        } else if ((lengthcount % prime1) !== 0) {
            step = 3 * prime1;
        } else {
            if ((lengthcount % prime2) !== 0) {
                step = 3 * prime2;
            } else {
                if ((lengthcount % prime3) !== 0)
                    step = 3 * prime3;
                else
                    step = 3 * prime4;
            }
        }

        i = 0;
        while (i < samplepixels) {
            b = (p[pix + 0] & 0xff) << netbiasshift;
            g = (p[pix + 1] & 0xff) << netbiasshift;
            r = (p[pix + 2] & 0xff) << netbiasshift;
            j = contest(b, g, r);

            altersingle(alpha, j, b, g, r);
            if (rad !== 0)
                alterneigh(rad, j, b, g, r); // alter neighbours

            pix += step;
            if (pix >= lim)
                pix -= lengthcount;

            i++;
            if (delta === 0)
                delta = 1;
            if (i % delta === 0) {
                alpha -= alpha / alphadec;
                radius -= radius / radiusdec;
                rad = radius >> radiusbiasshift;
                if (rad <= 1)
                    rad = 0;
                for (j = 0; j < rad; j++)
                    radpower[j] = alpha * (((rad * rad - j * j) * radbias) / (rad * rad));
            }
        }
    };

    // Search for BGR values 0..255 (after net is unbiased) and return colour index
    this.map = function(b, g, r) {
        var i;
        var j;
        var dist;
        var a;
        var bestd;
        var p;
        var best;

        bestd = 1000; // biggest possible dist is 256*3
        best = -1;
        i = netindex[g]; // index on g
        j = i - 1; // start at netindex[g] and work outwards

        while ((i < netsize) || (j >= 0)) {
            if (i < netsize) {
                p = network[i];
                dist = p[1] - g; // inx key
                if (dist >= bestd)
                    i = netsize; // stop iter
                else {
                    i++;
                    if (dist < 0)
                        dist = -dist;
                    a = p[0] - b;
                    if (a < 0)
                        a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0)
                            a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
            if (j >= 0) {
                p = network[j];
                dist = g - p[1]; // inx key - reverse dif
                if (dist >= bestd)
                    j = -1; // stop iter
                else {
                    j--;
                    if (dist < 0)
                        dist = -dist;
                    a = p[0] - b;
                    if (a < 0)
                        a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0)
                            a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
        }
        return best;
    };

    function contest(b, g, r) {
        var i;
        var dist;
        var a;
        var biasdist;
        var betafreq;
        var bestpos;
        var bestbiaspos;
        var bestd;
        var bestbiasd;
        var n;

        bestd = ~(1 << 31);
        bestbiasd = bestd;
        bestpos = -1;
        bestbiaspos = bestpos;

        for (i = 0; i < netsize; i++) {
            n = network[i];
            dist = n[0] - b;
            if (dist < 0)
                dist = -dist;
            a = n[1] - g;
            if (a < 0)
                a = -a;
            dist += a;
            a = n[2] - r;
            if (a < 0)
                a = -a;
            dist += a;
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

    this.process = function() {
        learn();
        unbiasnet();
        inxbuild();
        return colorMap();
    };

    // Unbias network to give byte values 0..255 and record position i to prepare for sort
    function unbiasnet() {
        var i;
        var j;

        for (i = 0; i < netsize; i++) {
            network[i][0] >>= netbiasshift;
            network[i][1] >>= netbiasshift;
            network[i][2] >>= netbiasshift;
            network[i][3] = i; // record colour no
        }
    }

    // Move adjacent neurons by precomputed alpha*(1-((i-j)^2/[r]^2)) in radpower[|i-j|]
    function alterneigh(rad, i, b, g, r) {
        var j;
        var k;
        var lo;
        var hi;
        var a;
        var m;
        var p;

        lo = i - rad;
        if (lo < -1)
            lo = -1;
        hi = i + rad;
        if (hi > netsize)
            hi = netsize;

        j = i + 1;
        k = i - 1;
        m = 1;
        while ((j < hi) || (k > lo)) {
            a = radpower[m++];
            if (j < hi) {
                p = network[j++];
                try {
                    p[0] -= (a * (p[0] - b)) / alpharadbias;
                    p[1] -= (a * (p[1] - g)) / alpharadbias;
                    p[2] -= (a * (p[2] - r)) / alpharadbias;
                } catch (e) {} // prevents 1.3 miscompilation
            }
            if (k > lo) {
                p = network[k--];
                try {
                    p[0] -= (a * (p[0] - b)) / alpharadbias;
                    p[1] -= (a * (p[1] - g)) / alpharadbias;
                    p[2] -= (a * (p[2] - r)) / alpharadbias;
                } catch (e) {}
            }
        }
    }

    // Move neuron i towards biased (b,g,r) by factor alpha
    function altersingle(alpha, i, b, g, r) {
        // alter hit neuron
        var n = network[i];
        n[0] -= (alpha * (n[0] - b)) / initalpha;
        n[1] -= (alpha * (n[1] - g)) / initalpha;
        n[2] -= (alpha * (n[2] - r)) / initalpha;
    }

    // Search for biased BGR values
    function lookup(b, g, r) {
        var i;
        var j;
        var dist;
        var a;
        var bestd;
        var p;
        var best;

        bestd = 1000; // biggest possible dist is 256*3
        best = -1;
        i = netindex[g]; // index on g
        j = i - 1; // start at netindex[g] and work outwards

        while ((i < netsize) || (j >= 0)) {
            if (i < netsize) {
                p = network[i];
                dist = p[1] - g; // inx key
                if (dist >= bestd)
                    i = netsize; // stop iter
                else {
                    i++;
                    if (dist < 0)
                        dist = -dist;
                    a = p[0] - b;
                    if (a < 0)
                        a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0)
                            a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
            if (j >= 0) {
                p = network[j];
                dist = g - p[1]; // inx key - reverse dif
                if (dist >= bestd)
                    j = -1; // stop iter
                else {
                    j--;
                    if (dist < 0)
                        dist = -dist;
                    a = p[0] - b;
                    if (a < 0)
                        a = -a;
                    dist += a;
                    if (dist < bestd) {
                        a = p[2] - r;
                        if (a < 0)
                            a = -a;
                        dist += a;
                        if (dist < bestd) {
                            bestd = dist;
                            best = p[3];
                        }
                    }
                }
            }
        }
        return best;
    }

    function buildColormap() {
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

    this.unbiasnet = unbiasnet;
    this.alterneigh = alterneigh;
    this.altersingle = altersingle;
    this.contest = contest;
    this.buildColormap = buildColormap;
    this.getColormap = getColormap;
    this.lookup = lookup;
} 