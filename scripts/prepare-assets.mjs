import sharp from 'sharp';
import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { execFileSync, spawnSync } from 'node:child_process';
import ffmpeg from 'ffmpeg-static';
for (const dir of ['brand','projects/original','projects/without-balloons','videos','images','images/carousel','services']) await mkdir(`public/assets/${dir}`, {recursive:true});
import { existsSync } from 'node:fs';
for(let i=1;i<=4;i++) {
  const id=String(i).padStart(2,'0');
  if (existsSync(`assets/carrossel/${id}.jpg`)) {
    await sharp(`assets/carrossel/${id}.jpg`).rotate().webp({quality:90}).toFile(`public/assets/images/carousel/${id}.webp`);
  }
}
const serviceFiles = [
  ['Sua marca merece surpreender..jpg', '01.webp'],
  ['Momentos especiais ganham novas cores..jpg', '02.webp'],
  ['Pequenos detalhes. Grandes emoções..jpg', '03.webp'],
];
for (const [src, out] of serviceFiles) {
  if (existsSync(`assets/serviços/${src}`)) {
    await sharp(`assets/serviços/${src}`).rotate().webp({quality:90}).toFile(`public/assets/services/${out}`);
  }
}
const dimensions = [[1120,1400],[1086,1448],[1122,1402],[1122,1402]];
for(let i=1;i<=4;i++) {
  const id=String(i).padStart(2,'0');
  for (const [source,target] of [['projects-original','original'],['projects-without-ballons','without-balloons']]) {
    const ext = existsSync(`assets/${source}/${id}.jpg`) ? 'jpg' : 'png';
    await sharp(`assets/${source}/${id}.${ext}`).rotate().resize(...dimensions[i-1],{fit:'fill'}).webp({quality:90}).toFile(`public/assets/projects/${target}/${id}.webp`);
  }
}
await copyFile('assets/brand/Cris Balões H.png','public/assets/brand/logo-horizontal.png');
await copyFile('assets/brand/Cris Balões V.png','public/assets/brand/logo-vertical.png');
await sharp('assets/champagne.jpg').rotate().webp({quality:90}).toFile('public/assets/images/champagne.webp');
if (existsSync('assets/foto_cris.jpg')) {
  await sharp('assets/foto_cris.jpg').rotate().resize(1800, 1344, { fit: 'cover' }).webp({ quality: 92 }).toFile('public/assets/images/cris.webp');
}
// All derived files keep the originals intact. Both states receive identical processing.
for(const [file,out,interval] of [['boluopi001_pindown.io_1793385200.mp4','door',1],['referencia website motion.mp4','motion',3]]){
  const input=`assets/videos/${file}`;
  const info=spawnSync(ffmpeg,['-hide_banner','-i',input,'-f','null','-'],{encoding:'utf8'});
  await writeFile(`docs/${out}-inspection.txt`,info.stderr);
  execFileSync(ffmpeg,['-y','-i',input,'-vf',`fps=1/${interval},scale=240:-1,tile=5x4`,'-frames:v','1',`docs/${out}-frames.jpg`],{stdio:'ignore'});
}
execFileSync(ffmpeg,['-y','-i','assets/videos/boluopi001_pindown.io_1793385200.mp4','-t','3.05','-vf','setpts=0.72*PTS,scale=540:-2','-an','-c:v','libx264','-crf','24','-preset','medium','-movflags','+faststart','public/assets/videos/door-intro.mp4'],{stdio:'ignore'});
execFileSync(ffmpeg,['-y','-i','assets/videos/boluopi001_pindown.io_1793385200.mp4','-frames:v','1','-vf','scale=540:-2','public/assets/images/door-poster.jpg'],{stdio:'ignore'});
console.log('Assets normalized; video contact sheets ready.');
