'use strict';

const { lintJoin } = require('../helpers');

exports.lint = (lintErrors) => {

    if ( lintErrors ) {
        return `<td class="lint">
            ${lintErrors.errors ?
        `<span class="errors" data-tooltip="${lintJoin(lintErrors.errors)}"></span>`
        : `test`}
            ${lintErrors.warnings ?
        `<span class="warnings" data-tooltip="${lintJoin(lintErrors.warnings)}"></span>`
        : ``}
        </td>`;
    }

    return `<td class="lint empty"></td>`;

};
