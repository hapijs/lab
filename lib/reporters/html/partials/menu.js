'use strict';

exports.menu = (coverage, lint) => {

    return `<div id="menu">
    <li><a href="#tests">Test Report</a></li>
    <li><a href="#coverage">Coverage Report</a></li>
    ${coverage.cov.files.map((item,i) => {

        return `<li class="${item.sourcemaps ? `generated` : ``}">
        <span class="cov ${item.percentClass}">${item.percent}</span>
        <a href="#${item.filename}">${item.dirname ? `<span class="dirname">${item.dirname}</span>` : ``}<span class="basename">${item.basename}</span></a>
    </li>`;
    })}
    <li><a href="#linting">Linting Report</a></li>
    ${lint.lint.map((item,i) => {

        return item.errors.length ?
            `<li>
        <span class="lint"><span class="${item.errorClass}">${item.totalErrors}</span> || <span class="${item.warningClass}">${item.totalWarnings}</span></span>
        <a href="#lint-${item.filename}">${item.filename}</a>
    </li>` : ``;
    })}
</div>`;
};
