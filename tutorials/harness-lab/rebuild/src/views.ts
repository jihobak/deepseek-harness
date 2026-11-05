import { current } from './model.ts';
import type { Ticket } from './model.ts';
import { Store } from './store.ts';

/** Only an authenticated adapter should supply the worker's ticket id. */
export function readScope(store: Store, viewerTicketId: string, targetTicketId: string, offset = 0, limit = 4000) {
  if (viewerTicketId !== targetTicketId) throw new Error('Forbidden Ticket');
  if (!Number.isInteger(offset) || offset < 0 || !Number.isInteger(limit) || limit < 1 || limit > 8000) throw new Error('Invalid page');
  const ticket = store.get<Ticket>('ticket', targetTicketId);
  if (!ticket) throw new Error('Unknown Ticket');
  const body = ticket.mandate.scope;
  return { text: body.slice(offset, offset + limit), next: offset + limit < body.length ? offset + limit : null };
}
export function overview(store: Store) {
  return {
    paused: store.get<boolean>('control', 'paused') ?? false,
    failures: store.all<{ kind: string; key: string; error: string }>('failure'),
    tickets: store.all<Ticket>('ticket').map(t => ({
      id: t.id, scope: t.mandate.scope, status: t.status,
      assignment: current(t).id, execution: current(t).status,
      attention: t.status === 'open' && current(t).status === 'waiting' ? 'review' : 'none',
    })),
  };
}
function escape(text: string): string {
  return text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] ?? char);
}
/** Local, read-only panel. Text from triggers/reports is always escaped. */
export function page(store: Store): string {
  const data = overview(store);
  return `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Super-agent 구현 실습</title>
  <style>body{font:16px system-ui;max-width:1100px;margin:50px auto;padding:0 20px;color:#213547}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:14px;border-bottom:1px solid #ddd}code{overflow-wrap:anywhere}a{color:#2563eb}</style>
  <h1>Super-agent 구현 실습</h1><p>작업 ${data.tickets.length}개 · 처리 ${data.paused ? '일시 정지' : '활성'} · 전송/실행 실패 ${data.failures.length}개</p>
  <p>범위와 실행 상태를 확인한 뒤 검토할 작업을 고르세요. <a href="/api/tickets">JSON 보기</a></p>
  <table><tr><th>승인된 범위</th><th>작업</th><th>실행</th><th>사람의 확인</th></tr>
  ${data.tickets.map(t => `<tr><td>${escape(t.scope)}</td><td>${escape(t.status)}</td><td>${escape(t.execution)}</td><td>${t.attention === 'review' ? '결과 검토' : '—'}</td></tr>`).join('')}</table>
  <p>API 키 없이 실행되는 교육용 화면입니다. Worker는 코드 수정 대신 고정된 검토 결과를 반환합니다.</p></html>`;
}
