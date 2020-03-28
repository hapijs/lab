'use strict';

exports.lintFile = (item) => {

    return `<div class="lint-file">
    ${item.errors ?
        `<h2 id="lint-${item.filename}">${item.filename}</h2>
    <ul>
    ${item.errors.map((subitem,i) =>

        `<li class="lint-entry">L${subitem.line} - <span class="level-${subitem.severity}">${subitem.severity}</span> - ${subitem.message}</li>`
    )}
    </ul>` : ``}
</div>`;
};
