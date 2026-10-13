import fs from 'node:fs';
const html = fs.readFileSync('dist/index.html','utf8');
const jsPath = html.match(/src="([^"]+\.js)"/)[1];
const cssPath = html.match(/href="([^"]+\.css)"/)[1];
const js = fs.readFileSync(`dist${jsPath}`,'utf8').replace(/<\/script/gi,'<\\/script');
const css = fs.readFileSync(`dist${cssPath}`,'utf8');
const result = html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/,'').replace(/<link[^>]*href="[^"]+\.css"[^>]*>/,()=>`<style>${css}</style>`).replace('</body>',()=>`<script>${js}</script></body>`);
fs.writeFileSync('매출지출노트_V2_바로실행.html',result);
