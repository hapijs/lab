var getSymbols = function (platform) {
    platform = platform || (process ? process.platform : undefined);
    var symbols = {
        checkMark: '\u2714', // heavy check mark
        multiplicationSign: '\u2716', // heavy multiplication sign
        minus: '-',
        x: 'x',
        dot: '.'
    };

    if (platform === 'win32') {
        symbols.checkMark = '\u221A'; // square root ((heavy check mark not in console font)
        symbols.multiplicationSign = '\u00D7'; // multiplication sign (heavy multiplication sign not in console font)
    }

    return {
        terse: {
            ok: symbols.dot,
            err: symbols.x,
            skipped: symbols.minus
        },
        verbose: {
            ok: symbols.checkMark,
            err: symbols.multiplicationSign,
            skipped: symbols.minus
        }
    }
};

exports = module.exports = getSymbols;
