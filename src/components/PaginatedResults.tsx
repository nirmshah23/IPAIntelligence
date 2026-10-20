import { Children, cloneElement, isValidElement, useState, type ReactElement, type ReactNode } from "react";
import "./pagination.css";

function useResultPage(rows: ReactNode[]) {
  const signature = rows.map((row, index) => isValidElement(row) ? row.key ?? index : index).join("|");
  const [state, setState] = useState({ signature, page: 1, size: 10 });
  const pages = Math.max(1, Math.ceil(rows.length / state.size));
  const page = state.signature === signature ? Math.min(state.page, pages) : 1;
  if (state.signature !== signature || state.page !== page) setState({ ...state, signature, page });
  const start = (page - 1) * state.size;
  return {
    visible: rows.slice(start, start + state.size),
    controls: <nav className="result-pagination" aria-label="Result pagination">
      <span aria-live="polite">Showing {rows.length ? start + 1 : 0}–{Math.min(start + state.size, rows.length)} of {rows.length}</span>
      <label>Rows per page<select value={state.size} onChange={event => setState({ signature, page: 1, size: Number(event.target.value) })}>{[10, 25, 50].map(size => <option key={size}>{size}</option>)}</select></label>
      <div><button type="button" disabled={page === 1} onClick={() => setState({ ...state, page: page - 1 })}>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page === pages} onClick={() => setState({ ...state, page: page + 1 })}>Next</button></div>
    </nav>,
  };
}

export function PaginatedTable({ children }: { children: ReactNode }) {
  const sections = Children.toArray(children);
  const body = sections.find(section => isValidElement(section) && section.type === "tbody") as ReactElement<{ children: ReactNode }> | undefined;
  const { visible, controls } = useResultPage(Children.toArray(body?.props.children));
  return <><table>{sections.map(section => section === body ? cloneElement(body, {}, visible) : section)}</table>{controls}</>;
}

export function PaginatedList({ children, className }: { children: ReactNode; className?: string }) {
  const { visible, controls } = useResultPage(Children.toArray(children));
  return <><div className={className}>{visible}</div>{controls}</>;
}
