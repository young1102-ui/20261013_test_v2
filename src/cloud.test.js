import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeClient,pull,push} from './cloud.js';
test('HTTP·다른 호스트·비밀 키 연결 차단',()=>{for(const [url,key] of [['http://x.supabase.co','sb_publishable_test'],['https://evil.example','sb_publishable_test'],['https://x.supabase.co','sb_secret_test']])assert.throws(()=>makeClient(url,key));});
test('로그인된 사용자 RPC 읽기 인터페이스',async()=>{const expected={document:{version:1,categories:[],entries:[]},revision:0};assert.deepEqual(await pull({rpc:async name=>{assert.equal(name,'note_read');return {data:expected};}}),expected);});
test('동기화 동일 작업 ID 재사용과 충돌 안내',async()=>{const calls=[];const client={rpc:async(name,args)=>{calls.push(args);return {data:{revision:1}};}};await push(client,{},0,'same');await push(client,{},0,'same');assert.deepEqual(calls[0],calls[1]);await assert.rejects(push({rpc:async()=>({error:{message:'NOTE_CONFLICT'}})},{},0,'x'),/다른 기기/);});
test('네트워크 실패 안내',async()=>{await assert.rejects(pull({rpc:async()=>({error:{message:'offline'}})}),/읽지 못했습니다/);});
