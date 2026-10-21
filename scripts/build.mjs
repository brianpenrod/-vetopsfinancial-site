import {mkdir,readdir,readFile,writeFile,copyFile,stat,rm,lstat} from 'node:fs/promises';
import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),out=path.join(root,'dist');
// Only the explicit static output is replaced; never copy the repository root wholesale.
if(out!==path.resolve(root,'dist')||path.dirname(out)!==root)throw Error('Invalid build destination');
try{if((await lstat(out)).isSymbolicLink())throw Error('Output must not be a symlink');await rm(out,{recursive:true});}catch(e){if(e.code!=='ENOENT')throw e;}
await mkdir(out,{recursive:true});
const pages=['index.html','studio.html','studio-portfolio.html','margincommand.html','margincommand_pilot_links_live.html','founderrelease.html','robots.txt','sitemap.xml','vetops-logo.png','vetops-shield.png','founder-bbq-1.jpg','founder-bbq-2.jpg'];
for(const name of pages)await copyFile(path.join(root,name),path.join(out,name));
const allowed=new Set(['.css','.js','.png','.jpg','.jpeg','.webp','.svg','.mp4','.glb','.hdr','.wasm','.txt','.ico','.bin']);let count=pages.length;
async function copyAssets(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.isSymbolicLink())throw Error('Symlink in public assets');const p=path.join(dir,e.name);if(e.isDirectory()){await copyAssets(p);continue;}if(e.name==='README.md'&&p.includes(path.sep+'vendor'+path.sep))continue;if(e.name!=='LICENSE'&&!allowed.has(path.extname(p)))throw Error('Unexpected public file: '+p);if((await stat(p)).size>25*1024*1024)throw Error('Pages asset exceeds 25 MiB: '+p);const relative=path.relative(root,p),target=path.join(out,relative);await mkdir(path.dirname(target),{recursive:true});await copyFile(p,target);count++;}}
await copyAssets(path.join(root,'assets'));
// Explicit fallback configuration until the separate, secured email Worker is activated.
await mkdir(path.join(out,'api/studio-request'),{recursive:true});
await writeFile(path.join(out,'api/studio-request/config.json'),JSON.stringify({mode:'unavailable'}));
await writeFile(path.join(out,'_redirects'),'/api/studio-request/config /api/studio-request/config.json 200\n');
await writeFile(path.join(out,'_headers'),'/api/studio-request/*\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n/assets/after-hours/*\n  X-Content-Type-Options: nosniff\n');
console.log(`Built ${count} public files. Private sources, server code, tests and docs excluded.`);
