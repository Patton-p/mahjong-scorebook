function normalize(s){return String(s||'').normalize('NFKC').replace(/[−–—﹣]/g,'-').replace(/＋/g,'+');}
function key(s){return normalize(s).toLowerCase().replace(/[\s.…·_\-]/g,'');}
// Heuristic suggestions only: never saves scores or infers missing signs.
function parse(detections,names){
 const lines=(detections||[]).map(d=>{const p=d.ItemPolygon||{};return {text:normalize(d.DetectedText),x:Number(p.X)||0,y:Number(p.Y)||0,w:Number(p.Width)||0,h:Number(p.Height)||20};});
 const candidates=[];
 for(const line of lines){const text=line.text.trim();const match=text.match(/(?:累计|得分|积分|本局|分数)?\s*([+-]\s*\d{1,7}|-?\d{1,7})\s*分?$/);if(!match)continue;
 const prefix=text.slice(0,match.index).trim();const labeled=/累计|得分|积分|本局|分数/.test(text);const signed=/[+-]/.test(match[1]);if(!signed&&!labeled&&prefix)continue;
 const score=Number(match[1].replace(/\s/g,''));if(!Number.isSafeInteger(score)||Math.abs(score)>1000000)continue;
 const center=line.y+line.h/2;const adjacent=lines.filter(n=>n!==line&&n.x<line.x&&Math.abs(n.y+n.h/2-center)<Math.max(n.h,line.h)*.9&&!/^\d+$/.test(n.text.trim())).sort((a,b)=>b.x-a.x);
 const name=prefix.replace(/累计|得分|积分|本局|分数/g,'').trim()||(adjacent[0]&&adjacent[0].text.trim())||'';
 candidates.push({name,score:String(score),y:center,x:line.x,priority:(signed?2:0)+(labeled?1:0)});
 }
 // One score per visual row: signed/labeled values first, then rightmost.
 candidates.sort((a,b)=>b.priority-a.priority||b.x-a.x);const rows=[];
 for(const c of candidates){if(!rows.some(r=>Math.abs(r.y-c.y)<16))rows.push(c);}
 rows.sort((a,b)=>a.y-b.y);
 const used=new Set();const suggestions=rows.slice(0,4).map(r=>{const matches=names.map((n,i)=>key(n)===key(r.name)?i:-1).filter(i=>i>=0&&!used.has(i));const player=matches.length===1?matches[0]:-1;if(player>=0)used.add(player);return {name:r.name.slice(0,30),score:r.score,player};});
 while(suggestions.length<4)suggestions.push({name:'',score:'',player:-1});
 return {rows:suggestions,raw:lines.map(l=>l.text).join('\n'),candidateCount:rows.length};
}
module.exports={parse};
