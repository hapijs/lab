'use strict';

const { number } = require('../helpers');
const { lint } = require('./lint');

exports.line = (filename, item, key) => {

    return `<tr id="${filename}__${key + 1}" class="${item.miss ? item.chunks ? `chunks` : `miss` : `hit`}">
  <td class="line" data-tooltip>${key}</td>
  ${lint(item.lintErrors)}
  <td class="hits" data-tooltip>${item.miss ? `${number(item.percent)}` : `${number(item.hits)}`}</td>
  ${item.chunks ?
        `<td class="source">${item.chunks.map((subitem,i) =>

            `${subitem.miss ? `<div class="miss ${subitem.miss}" data-tooltip>${subitem.source}</div>` : `<div>${subitem.source}</div>`}`
        ).join('')}</td>`
        :
        `<td class="source"${item.miss ? ` data-tooltip` : ``}>${item.source}</td>`
}
  ${item.originalFilename ? `<td class="original-line" data-tooltip="${item.originalFilename}"><a href="#${item.originalFilename}__${item.originalLine}">${item.originalLine}</a></td>` : ``}
</tr>`;
};
