export const KEY = 'sales-expense-note-v1';
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const id = () => crypto.randomUUID();
export function initialData() {
 const categories = ['매출','식자재','임대료','인건비','배송비','광고비','기타'].map((name,i)=>({id:`c${i}`,name}));
 const month = today().slice(0,7);
 const entries = [[2,'income','c0',850000,'상품 판매'],[4,'expense','c1',180000,'재료 구입'],[6,'income','c0',420000,'서비스 제공'],[7,'expense','c2',550000,'월 임대료'],[9,'expense','c4',32000,'상품 발송']].map(([day,type,categoryId,amount,memo])=>({id:id(),date:`${month}-${String(day).padStart(2,'0')}`,type,categoryId,amount,memo,sample:true}));
 return {version:1,categories,entries};
}
export function totals(entries,month) { return entries.filter(e=>e.date.startsWith(month)).reduce((a,e)=>{a[e.type]+=e.amount;a.profit=a.income-a.expense;return a;},{income:0,expense:0,profit:0}); }
export function validate(entry) {
 if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || Number.isNaN(Date.parse(entry.date))) return '날짜를 입력해 주세요.';
 if (!['income','expense'].includes(entry.type)) return '매출 또는 지출을 선택해 주세요.';
 if (!entry.categoryId) return '분류를 선택해 주세요.';
 if (!Number.isFinite(Number(entry.amount)) || Number(entry.amount)<=0) return '금액은 0보다 큰 숫자로 입력해 주세요.';
 return '';
}
