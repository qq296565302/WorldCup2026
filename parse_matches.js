import fs from 'fs';
const html = fs.readFileSync('team.html','utf8');
const re = /href="\/match\/(\d+)"[^>]*>[\s\S]*?<span class="dp-schedule-row__team dp-schedule-row__team--home"[^>]*>([^<]+)<\/span>[\s\S]*?<span class="dp-schedule-row__team dp-schedule-row__team--away"[^>]*>([^<]+)<\/span>/g;
let m;
const results = [];
while((m=re.exec(html))!==null){
  results.push({id:m[1], home:m[2].trim(), away:m[3].trim()});
}
console.log(JSON.stringify(results,null,2));
console.log('Total:', results.length);
