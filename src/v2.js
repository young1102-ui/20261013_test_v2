import {validate} from './model.js';
export const LOCAL_KEY='sales-expense-note-v2-local';
export function checkedData(input){
 const d=input?.data??input;
 if(!d||d.version!==1||!Array.isArray(d.entries)||!Array.isArray(d.categories))throw Error('올바른 장부 백업 파일이 아닙니다.');
 const unique=list=>new Set(list.map(x=>x.id)).size===list.length;
 if(!unique(d.entries)||!unique(d.categories))throw Error('중복 ID가 있는 자료입니다. 이전을 중단했습니다.');
 const categories=d.categories.map(c=>{if(typeof c.id!=='string'||!c.id||typeof c.name!=='string'||!c.name.trim()||c.name.length>40)throw Error('분류 자료가 올바르지 않습니다.');return {id:c.id,name:c.name};});
 const entries=d.entries.map(e=>{if(typeof e.id!=='string'||!e.id||typeof e.amount!=='number'||validate(e)||typeof e.memo!=='string'||e.memo.length>500||typeof e.sample!=='boolean'||new Date(`${e.date}T00:00:00Z`).toISOString().slice(0,10)!==e.date)throw Error('내역 자료가 올바르지 않습니다.');return {id:e.id,date:e.date,type:e.type,categoryId:e.categoryId,amount:e.amount,memo:e.memo,sample:e.sample};});
 return {version:1,categories,entries};
}
export function backupText(data){return JSON.stringify({format:'sales-expense-note-backup',version:2,exportedAt:new Date().toISOString(),data:checkedData(data)},null,2);}
export function mergeData(current,incoming){
 current=checkedData(current);incoming=checkedData(incoming);
 const merge=(a,b)=>{const map=new Map(a.map(x=>[x.id,x]));for(const row of b){if(map.has(row.id)&&JSON.stringify(map.get(row.id))!==JSON.stringify(row))throw Error('같은 ID의 다른 자료가 있습니다. 덮어쓰지 않고 이전을 중단했습니다.');map.set(row.id,row);}return [...map.values()];};
 const categories=merge(current.categories,incoming.categories);
 if(new Set(categories.map(c=>c.name)).size!==categories.length)throw Error('서로 다른 ID의 같은 분류 이름이 있습니다. 분류를 정리한 뒤 이전해 주세요.');
 return {version:1,categories,entries:merge(current.entries,incoming.entries)};
}
export function csvText(data,month=''){
 const safe=v=>{let s=String(v??'');if(/^[\s]*[=+@-]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';};
 const rows=[['날짜','구분','분류','금액(원)','메모','예시자료'],...data.entries.filter(e=>!month||e.date.startsWith(month)).sort((a,b)=>a.date.localeCompare(b.date)).map(e=>[e.date,e.type==='income'?'매출':'지출',data.categories.find(c=>c.id===e.categoryId)?.name??'미분류',e.amount,e.memo,e.sample?'예시':''])];
 return '\uFEFF'+rows.map(r=>r.map(safe).join(',')).join('\r\n');
}
export function download(text,name,type='application/json'){const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function requireRevision(expected,actual){if(expected!==actual)throw Error('다른 기기에서 변경되었습니다. 로컬 백업 후 서버 자료를 불러와 주세요.');}
