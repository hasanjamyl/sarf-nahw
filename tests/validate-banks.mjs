/** Run with `node tests/validate-banks.mjs` — zero external dependencies. */
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const books=[['sarf-1',36,270,40],['sarf-2',27,286,65],['nahw-1',31,230,41],['nahw-2',61,380,105]];
let sum=0,lessons=0,errors=[];
for(const [id,expectedLessons,expectedQuestions,pdfPages] of books){
 const data=JSON.parse(fs.readFileSync(path.join(root,'data',`${id}.json`),'utf-8'));
 const n=data.lessons.reduce((a,l)=>a+l.questions.length,0);
 if(data.lessons.length!==expectedLessons||n!==expectedQuestions)errors.push(`${id}: expected ${expectedLessons}/${expectedQuestions}, got ${data.lessons.length}/${n}`);
 for(const [li,l] of data.lessons.entries()){
  if(!l.title||!l.questions?.length)errors.push(`${id}:${li}: missing title or questions`);
  for(const [qi,q] of l.questions.entries()){
    if(typeof q.q!=='string'||!Array.isArray(q.opts)||q.opts.length!==4||new Set(q.opts).size!==4|| !Number.isInteger(q.a)||q.a<0||q.a>3||!q.why||!Number.isInteger(q.page)||q.page<1||q.page>pdfPages) errors.push(`${id}:${li}:${qi} invalid`);
  }
 }
 const pdf=fs.statSync(path.join(root,'books',`${id}.pdf`));if(!pdf.size) errors.push(`${id} pdf empty`);
 sum+=n;lessons+=data.lessons.length;
 console.log(`✓ ${id}: ${data.lessons.length} quizzes, ${n} questions, ${pdfPages} source PDF pages`);
}
if(sum!==1166||lessons!==155)errors.push('Unexpected totals');
console.log(`Total: ${lessons} quizzes, ${sum} questions`);
if(errors.length){console.error(errors.join('\n'));process.exitCode=1;}
else console.log('All question banks passed validation.');
