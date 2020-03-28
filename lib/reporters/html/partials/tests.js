'use strict';

const { replace, join, errorMessage, errorStack } = require('../helpers');

exports.tests = (failures, skipped, tests, duration, paths, errors) => {

    return `<div id="tests">
  <h1>Test Report</h1>
  <div class="stats ${failures.length ? `terrible` : skipped.length ? `low` : `high`}">
      <div class="failures">${failures.length}</div>
      <div class="skipped">${skipped.length}</div>
      <div class="test-count">${tests.length}</div>
      <div class="duration">${duration}</div>
  </div>
  <div id="filters">
      <input type="checkbox" checked="" onchange="filter(this)" value="success" id="show-success">
      <label for="show-success">Show Success</label>
      <input type="checkbox" checked="" onchange="filter(this)" value="failure" id="show-failure">
      <label for="show-failure">Show Failure</label>
      <br>
      ${paths.map((item,i) =>

        `
      <input type="checkbox" checked="" onchange="filter(this)" value="${item}" id="show-${item}">
      <label for="show-${item}">${replace(item, '\_', ' ', 'gi')}</label>
      `)}
  </div>
  <table>
      <thead>
      <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Duration (ms)</th>
      </tr>
      </thead>
      <tbody>
      ${tests.map((item,i) =>

        `
      <tr class="show ${join(item.path, ' ')} ${item.err ? `failure` : `success` }">
        <td class="test-id">${item.id}</td>
        <td class="test-title">${item.title}
            ${item.err ? `<div class="stack">${item.err.stack}</div>` : ``}
        </td>
        <td class="test-duration">${item.duration}</td>
      </tr>
      `)}
      </tbody>
  </table>

  ${errors.length ?
        `<h2>Script errors :</h2>
  <ul>
    ${errors.map((item, i) =>

        `
    <li>
      <div>${errorMessage(item)}</div>
      ${item.stack ?
        `<pre>${errorStack(item)}</pre>` : ``}
    </li>
    `)}
  </ul>` : ``}
</div>`;
};
