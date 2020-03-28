'use strict';

const { lintFile } = require('./lint-file');

const lintingPartialMainChild = function (lint) {

    if ( lint.total ) {
        return `${lint.lint.map((item,i) =>

            lintFile(item,i)
        )}`;
    }

    return ``;

};

const lintingPartialMain = function (lint) {

    if ( lint.disabled ) {
        return `<span>Nothing to show here, linting is disabled.</span>`;
    }

    return `<div class="lint-stats">
            <span class="lint-errors ${lint.errorClass}">${lint.totalErrors}</span>
            <span class="lint-warnings ${lint.warningClass}">${lint.totalWarnings}</span>
        </div>
        <div class="lint-files">
            ${lintingPartialMainChild(lint)}
        </div>`;

};

exports.linting = (lint) => {

    return `<div id="linting">
        <h1>Linting Report</h1>
        ${lintingPartialMain(lint)}
    </div>`;
};
