import { PaginatedTable } from "../../components/PaginatedResults";

export function WorkflowHistory({ entries }: { entries: { at: string; text: string }[] }) {
  return <div className="table-wrap workflow-history">
    <PaginatedTable><thead><tr><th scope="col">Recorded at</th><th scope="col">Activity / evidence</th></tr></thead>
      <tbody>{entries.map((entry, index) => <tr key={`${entry.at}-${index}`}><td><time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time></td><td>{entry.text}</td></tr>)}</tbody>
    </PaginatedTable>
    {!entries.length && <div className="empty"><p>No workflow actions recorded yet.</p></div>}
  </div>;
}
