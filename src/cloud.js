import {createClient} from '@supabase/supabase-js';
export function makeClient(url,key){
 const parsed=new URL(url);
 if(parsed.protocol!=='https:'||!parsed.hostname.endsWith('.supabase.co')||parsed.pathname!=='/')throw Error('https://프로젝트ID.supabase.co 형식의 주소를 입력해 주세요.');
 if(!(key.startsWith('sb_publishable_')||key.startsWith('eyJ')))throw Error('Publishable key 또는 anon key를 입력해 주세요. Secret/service_role 키는 사용할 수 없습니다.');
 if(key.startsWith('eyJ')){try{const payload=JSON.parse(atob(key.split('.')[1].replaceAll('-','+').replaceAll('_','/')));if(payload.role!=='anon')throw Error();}catch{throw Error('anon 공개 키만 사용할 수 있습니다.');}}
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:true,detectSessionInUrl:false}});
}
export async function pull(client){const {data,error}=await client.rpc('note_read');if(error)throw Error('서버 자료를 읽지 못했습니다. SQL 설정·로그인·네트워크를 확인해 주세요.');return data;}
export async function push(client,document,revision,operationId){const {data,error}=await client.rpc('note_save',{p_document:document,p_expected_revision:revision,p_operation_id:operationId});if(error){if(error.message.includes('NOTE_CONFLICT'))throw Error('다른 기기에서 변경되었습니다. 로컬 백업 후 서버 자료를 불러와 주세요.');throw Error('동기화하지 못했습니다. 로컬 자료는 보존됩니다. 네트워크와 서버 설정을 확인해 주세요.');}return data;}
