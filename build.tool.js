// build.tool.js — run by build.sh via `osascript -l JavaScript`.
// Two jobs, both keeping a single source of truth:
//   1. Compile app.jsx -> app.js   (JSX stripped; the site needs no Babel at runtime)
//   2. Regenerate the <noscript> SEO fallback in index.html from content.js
// Not meant to be run directly — use ./build.sh.

ObjC.import('Foundation');

var DIR = ObjC.unwrap($.NSFileManager.defaultManager.currentDirectoryPath) + '/';

function readFile(p) {
  var s = $.NSString.stringWithContentsOfFileEncodingError(
    $(p), $.NSUTF8StringEncoding, null);
  if (!s) throw new Error('cannot read ' + p);
  return ObjC.unwrap(s);
}
function writeFile(p, text) {
  var ok = $(text).writeToFileAtomicallyEncodingError(
    $(p), true, $.NSUTF8StringEncoding, null);
  if (!ok) throw new Error('cannot write ' + p);
}

// ── 1. Compile app.jsx -> app.js ───────────────────────────────────────────
eval(readFile(DIR + '.cache/babel.min.js'));
if (typeof Babel === 'undefined') throw new Error('Babel failed to load');

var compiled = Babel.transform(readFile(DIR + 'app.jsx'), {
  presets: [['react', { runtime: 'classic' }]],
}).code;
writeFile(DIR + 'app.js',
  '// GENERATED FILE — do not edit.\n' +
  '// Source: app.jsx   ·   Regenerate: ./build.sh\n\n' + compiled + '\n');
console.log('  app.js      <- app.jsx     (' + compiled.length + ' chars)');

// ── 2. SEO / no-JS fallback, generated from content.js ─────────────────────
var win = {};
(function () { var window = win; eval(readFile(DIR + 'content.js')); })();
var C = win.PORTFOLIO_CONTENT;
if (!C) throw new Error('PORTFOLIO_CONTENT missing from content.js');

function esc(s) {
  return String(s).replace(/&/g, '&amp;')
    .replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function bi(o) { return esc(o.en) + ' · ' + esc(o.zh); }

var H = [];
H.push('<style>');
H.push('.splash{display:none!important}#root{display:none!important}');
H.push('html,body{overflow:auto!important;height:auto!important;'
  + 'background:#efe9df!important}');
H.push(".seo-fallback{max-width:720px;margin:0 auto;padding:56px 24px 96px;"
  + "color:#1a1714;font-family:'Inter','Noto Sans SC',system-ui,sans-serif;"
  + "line-height:1.65}");
H.push(".seo-fallback h1,.seo-fallback h2,.seo-fallback h3{"
  + "font-family:'Cormorant Garamond','Noto Serif SC',serif;"
  + "font-weight:500;line-height:1.2}");
H.push('.seo-fallback h1{font-size:40px;margin:0 0 6px}');
H.push('.seo-fallback h2{font-size:27px;margin:46px 0 6px;'
  + 'border-top:1px solid rgba(26,23,20,.18);padding-top:26px}');
H.push('.seo-fallback h3{font-size:19px;margin:26px 0 4px}');
H.push('.seo-fallback .role{color:#a53a2c;letter-spacing:.08em;font-size:14px}');
H.push('.seo-fallback .meta{font-size:13px;color:rgba(26,23,20,.66)}');
H.push('.seo-fallback .zh{color:rgba(26,23,20,.68)}');
H.push('.seo-fallback p{margin:7px 0}');
H.push('</style>');
H.push('<div class="seo-fallback">');
H.push('<h1>' + bi(C.meta.name) + '</h1>');
H.push('<p class="role">' + bi(C.meta.role) + '</p>');
H.push('<p>' + esc(C.meta.tagline.en) + '</p>');
H.push('<p class="zh">' + esc(C.meta.tagline.zh) + '</p>');

H.push('<h2>' + bi(C.about.title) + '</h2>');
C.about.bio.en.forEach(function (p) { H.push('<p>' + esc(p) + '</p>'); });
C.about.bio.zh.forEach(function (p) { H.push('<p class="zh">' + esc(p) + '</p>'); });
C.about.affiliations.en.forEach(function (row) {
  H.push('<p class="meta"><strong>' + esc(row[0]) + ':</strong> '
    + esc(row[1]) + '</p>');
});

H.push('<h2>' + bi(C.projects.title) + '</h2>');
H.push('<p>' + esc(C.projects.intro.en) + '</p>');
H.push('<p class="zh">' + esc(C.projects.intro.zh) + '</p>');
C.projects.items.forEach(function (it) {
  H.push('<h3>' + bi(it.title) + '</h3>');
  H.push('<p class="meta">' + bi(it.kind) + ' · ' + esc(it.year) + '</p>');
  H.push('<p>' + esc(it.blurb.en) + '</p>');
  H.push('<p class="zh">' + esc(it.blurb.zh) + '</p>');
});

H.push('<h2>' + bi(C.publications.title) + '</h2>');
C.publications.items.forEach(function (it) {
  H.push('<h3>' + bi(it.title) + '</h3>');
  H.push('<p class="meta">' + (it.authors ? esc(it.authors) + ' — ' : '')
    + bi(it.venue) + ', ' + esc(it.year) + '</p>');
  H.push('<p>' + esc(it.abstract.en) + '</p>');
  H.push('<p class="zh">' + esc(it.abstract.zh) + '</p>');
});

H.push('<h2>' + bi(C.contact.title) + '</h2>');
H.push('<p>' + esc(C.contact.invitation.en) + '</p>');
H.push('<p class="zh">' + esc(C.contact.invitation.zh) + '</p>');
C.contact.channels.forEach(function (ch) {
  var v = typeof ch.value === 'string'
    ? ch.value : (ch.value.en + ' · ' + ch.value.zh);
  H.push('<p class="meta"><strong>' + bi(ch.label) + ':</strong> '
    + esc(v) + '</p>');
});
H.push('</div>');

var seo = H.join('\n');

var html = readFile(DIR + 'index.html');
var A = '<!-- SEO:START -->', B = '<!-- SEO:END -->';
var i = html.indexOf(A), j = html.indexOf(B);
if (i < 0 || j < 0) throw new Error('SEO markers not found in index.html');
html = html.slice(0, i + A.length) + '\n' + seo + '\n    ' + html.slice(j);
writeFile(DIR + 'index.html', html);
console.log('  index.html  <- content.js  (noscript fallback, '
  + seo.length + ' chars)');
