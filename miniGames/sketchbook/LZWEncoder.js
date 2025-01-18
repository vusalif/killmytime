/**
 * This class handles LZW encoding
 * Adapted from Jef Poskanzer's Java port by way of J. M. G. Elliott.
 * @author Kevin Weiner (original Java version - kweiner@fmsware.com)
 * @author Thibault Imbert (AS3 version - bytearray.org)
 * @author Kevin Kwok (JavaScript version - https://github.com/antimatter15/jsgif)
 * @version 0.1 AS3 implementation
 */
function LZWEncoder(width, height, pixels, colorDepth) {
    var initCodeSize = Math.max(2, colorDepth);

    var EOF = -1;
    var imgW = width;
    var imgH = height;
    var pixAry = pixels;
    var initCodeSize = Math.max(2, colorDepth);

    var remaining = imgW * imgH;
    var curPixel = 0;

    var BITS = 12;
    var HSIZE = 5003;
    var n_bits;
    var maxbits = BITS;
    var maxcode;
    var maxmaxcode = 1 << BITS;
    var htab = [];
    var codetab = [];
    var hsize = HSIZE;
    var free_ent = 0;
    var clear_flg = false;
    var g_init_bits;
    var ClearCode;
    var EOFCode;

    var cur_accum = 0;
    var cur_bits = 0;
    var accum = [];

    var masks = [
        0x0000, 0x0001, 0x0003, 0x0007, 0x000F,
        0x001F, 0x003F, 0x007F, 0x00FF, 0x01FF,
        0x03FF, 0x07FF, 0x0FFF, 0x1FFF, 0x3FFF,
        0x7FFF, 0xFFFF
    ];

    function char_out(c, outs) {
        accum[a_count++] = c;
        if (a_count >= 254) flush_char(outs);
    }

    function cl_block(outs) {
        cl_hash(hsize);
        free_ent = ClearCode + 2;
        clear_flg = true;
        output(ClearCode, outs);
    }

    function cl_hash(hsize) {
        for (var i = 0; i < hsize; ++i) htab[i] = -1;
    }

    function compress(init_bits, outs) {
        var fcode, c, i, ent, disp, hsize_reg, hshift;

        g_init_bits = init_bits;
        clear_flg = false;
        n_bits = g_init_bits;
        maxcode = MAXCODE(n_bits);

        ClearCode = 1 << (init_bits - 1);
        EOFCode = ClearCode + 1;
        free_ent = ClearCode + 2;

        a_count = 0;
        ent = nextPixel();

        hshift = 0;
        for (fcode = hsize; fcode < 65536; fcode *= 2) ++hshift;
        hshift = 8 - hshift;
        hsize_reg = hsize;
        cl_hash(hsize_reg);

        output(ClearCode, outs);

        outer_loop: while ((c = nextPixel()) != EOF) {
            fcode = (c << maxbits) + ent;
            i = (c << hshift) ^ ent;

            if (htab[i] === fcode) {
                ent = codetab[i];
                continue;
            } else if (htab[i] >= 0) {
                disp = hsize_reg - i;
                if (i === 0) disp = 1;
                do {
                    if ((i -= disp) < 0) i += hsize_reg;
                    if (htab[i] === fcode) {
                        ent = codetab[i];
                        continue outer_loop;
                    }
                } while (htab[i] >= 0);
            }

            output(ent, outs);
            ent = c;

            if (free_ent < maxmaxcode) {
                codetab[i] = free_ent++;
                htab[i] = fcode;
            } else {
                cl_block(outs);
            }
        }

        output(ent, outs);
        output(EOFCode, outs);
    }

    function encode(outs) {
        outs.writeByte(initCodeSize);
        remaining = imgW * imgH;
        curPixel = 0;
        compress(initCodeSize + 1, outs);
        outs.writeByte(0);
    }

    function flush_char(outs) {
        if (a_count > 0) {
            outs.writeByte(a_count);
            outs.writeBytes(accum, 0, a_count);
            a_count = 0;
        }
    }

    function MAXCODE(n_bits) {
        return (1 << n_bits) - 1;
    }

    function nextPixel() {
        if (remaining === 0) return EOF;
        --remaining;
        var pix = pixAry[curPixel++];
        return pix & 0xff;
    }

    function output(code, outs) {
        cur_accum &= masks[cur_bits];

        if (cur_bits > 0)
            cur_accum |= (code << cur_bits);
        else
            cur_accum = code;

        cur_bits += n_bits;

        while (cur_bits >= 8) {
            char_out((cur_accum & 0xff), outs);
            cur_accum >>= 8;
            cur_bits -= 8;
        }

        if (free_ent > maxcode || clear_flg) {
            if (clear_flg) {
                maxcode = MAXCODE(n_bits = g_init_bits);
                clear_flg = false;
            } else {
                ++n_bits;
                if (n_bits == maxbits)
                    maxcode = maxmaxcode;
                else
                    maxcode = MAXCODE(n_bits);
            }
        }

        if (code == EOFCode) {
            while (cur_bits > 0) {
                char_out((cur_accum & 0xff), outs);
                cur_accum >>= 8;
                cur_bits -= 8;
            }
            flush_char(outs);
        }
    }

    var a_count;
    return { encode: encode };
}

try {
    exports.LZWEncoder = LZWEncoder;
} catch (e) {
    // nothing
} 