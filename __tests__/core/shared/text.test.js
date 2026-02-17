const { escapeHtml } = require("../../../src/core/shared/text.js");

test("escapeHtml escapa caracteres especiales HTML", () => {
  const input = `<div class="x">Tom & Jerry's</div>`;
  const output = escapeHtml(input);
  expect(output).toBe("&lt;div class=&quot;x&quot;&gt;Tom &amp; Jerry&#039;s&lt;/div&gt;");
});
