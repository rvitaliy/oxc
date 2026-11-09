// Each entry occupies exactly one source line; diagnostics are expected at that line.
export const clean = [
  { name: "constructor", code: "new Response('ok', {status: 200});", diagnostics: 0 },
  { name: "null-body", code: "new Response(null, {status: 204});", diagnostics: 0 },
  { name: "json", code: "Response.json({ok: true}, {status: 201});", diagnostics: 0 },
  { name: "redirect", code: "Response.redirect('/next', 302);", diagnostics: 0 },
  { name: "override", code: "new Response('ok', {status: 204, status: 200});", diagnostics: 0 },
  { name: "coercion", code: "Response.redirect('/next', '302');", diagnostics: 0 },
  { name: "wrapped", code: "new Response('', {status: 65736});", diagnostics: 0 },
  { name: "unknown", code: "new Response(body, {status: status});", diagnostics: 0 },
];
export const invalid = [
  { name: "body", code: "new Response('body', {status: 204});", diagnostics: 1 },
  { name: "json", code: "Response.json(null, {status: 304});", diagnostics: 1 },
  { name: "redirect", code: "Response.redirect('/next', 200);", diagnostics: 1 },
  { name: "range", code: "new Response(null, {status: 600});", diagnostics: 1 },
  { name: "string", code: "new Response('body', {status: '205'});", diagnostics: 1 },
  { name: "fraction", code: "Response.redirect('/next', 200.9);", diagnostics: 1 },
  { name: "computed", code: "new Response('body', {['status']: 204});", diagnostics: 1 },
  { name: "wrap", code: "new Response('body', {status: 65740});", diagnostics: 1 },
];
export const nonTarget = [
  { name: "request", code: "new Request('/path', {method: 'POST'});", diagnostics: 0 },
  { name: "object", code: 'const options = {status: 204, body: "value"};', diagnostics: 0 },
  { name: "function", code: "function calculate(value) { return value + 1; }", diagnostics: 0 },
  { name: "array", code: "const values = [1, 2, 3].map(value => value * 2);", diagnostics: 0 },
];
