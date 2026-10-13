import {test} from 'node:test';
import assert from 'node:assert/strict';
import {totals,validate,initialData} from './model.js';
test('월별 매출·지출과 음수 순이익 계산',()=>{assert.deepEqual(totals([{date:'2026-10-01',type:'income',amount:100},{date:'2026-10-02',type:'expense',amount:150},{date:'2026-09-01',type:'income',amount:900}],'2026-10'),{income:100,expense:150,profit:-50});});
test('필수 입력 및 금액 검증',()=>{const valid={date:'2026-10-01',type:'income',categoryId:'a',amount:1};assert.equal(validate(valid),'');for(const amount of [0,-1,'',NaN,Infinity,'abc'])assert.ok(validate({...valid,amount}));for(const field of ['date','type','categoryId'])assert.ok(validate({...valid,[field]:''}));});
test('예시 자료 합계와 예시 삭제 후 빈 합계',()=>{const d=initialData();assert.equal(d.entries.length,5);assert.ok(d.entries.every(e=>e.sample));assert.deepEqual(totals(d.entries,d.entries[0].date.slice(0,7)),{income:1270000,expense:762000,profit:508000});assert.deepEqual(totals(d.entries.filter(e=>!e.sample),'2026-10'),{income:0,expense:0,profit:0});});
