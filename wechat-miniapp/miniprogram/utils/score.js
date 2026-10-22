const LIMIT = 1000000;
const defaults = () => ({schemaVersion:1,names:['日落尤…','轩逸','在西…','机器人','机器人2'],robotIndices:[3,4],rounds:[]});
function validRobots(a){return Array.isArray(a)&&a.length<=5&&new Set(a).size===a.length&&a.every(i=>Number.isInteger(i)&&i>=0&&i<5);}
function validScores(a){return Array.isArray(a)&&a.length===5&&a.every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=LIMIT)&&a.reduce((s,v)=>s+v,0)===0;}
function settle(raw,robots){
 if(!validScores(raw)||!validRobots(robots))throw Error('请填写五位玩家的整数原始分（每人不超过100万），合计须为0');
 const win=[],loss=[],out=[0,0,0,0,0];raw.forEach((v,i)=>{if(!robots.includes(i)){if(v>0)win.push(i);if(v<0)loss.push(i);}});
 const W=win.reduce((s,i)=>s+raw[i],0),L=loss.reduce((s,i)=>s-raw[i],0),pot=Math.min(W,L)*100;
 function alloc(ids,sign){const denominator=sign>0?W:L;if(!denominator||!pot)return;const shares=ids.map(i=>{const numerator=pot*Math.abs(raw[i]);return {i,units:Math.floor(numerator/denominator),rem:numerator%denominator};});let left=pot-shares.reduce((s,x)=>s+x.units,0);shares.sort((a,b)=>b.rem-a.rem||a.i-b.i);shares.forEach(x=>{out[x.i]=sign*(x.units+(left-->0?1:0));});}
 alloc(win,1);alloc(loss,-1);return out;
}
function cents(n){return (n>0?'+':'')+(n/100).toFixed(2);}
function totals(s){return s.rounds.reduce((a,r)=>a.map((v,i)=>v+r.weightedCents[i]),[0,0,0,0,0]);}
function validate(s){
 if(!s||s.schemaVersion!==1||!Array.isArray(s.names)||s.names.length!==5||!s.names.every(n=>typeof n==='string'&&n.trim()&&n.length<=16)||new Set(s.names).size!==5||!validRobots(s.robotIndices)||!Array.isArray(s.rounds)||s.rounds.length>10000)throw Error('备份格式无效：需要本小程序导出的备份');
 s.rounds.forEach(r=>{if(!r||!validScores(r.scores)||!validRobots(r.robots)||!Array.isArray(r.weightedCents)||r.weightedCents.length!==5||typeof r.note!=='string'||r.note.length>100||typeof r.time!=='string'||!Number.isFinite(Date.parse(r.time)))throw Error('牌局数据无效');const expected=settle(r.scores,r.robots);if(!r.weightedCents.every((v,i)=>Number.isSafeInteger(v)&&v===expected[i]))throw Error('备份的加权结果校验失败');});return s;
}
module.exports={defaults,validScores,validRobots,settle,cents,totals,validate};
