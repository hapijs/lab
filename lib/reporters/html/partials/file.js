'use strict';

const { line } = require('./line');

exports.file = (item) => {

    const { filename } = item;

    return `<div class="file ${ item.sourcemaps ? `show generated` : `` }">
    <h2 id="${item.filename}">${item.filename} ${item.generated ? `(transformed to <a href="#${item.generated}">${item.generated})</a>` : ``}</h2>
    <div class="stats ${item.percentClass}">
        <div class="percentage">${item.percent}%</div>
        <div class="sloc">${item.sloc}</div>
        <div class="hits">${item.hits}</div>
        <div class="misses">${item.misses}</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>Line</th>
                <th>Lint</th>
                <th>Hits</th>
                <th>Source</th>
                ${item.sourcemaps ? `<th>Original line</th>` : ``}
            </tr>
        </thead>
        <tbody>
        ${item.source ?
        `
        ${Object.entries(item.source).map((subitem,i) =>

        `
            ${line(filename, subitem[1], i)}
        `)}` : ``}
        </tbody>
    </table>
</div>`;
};
