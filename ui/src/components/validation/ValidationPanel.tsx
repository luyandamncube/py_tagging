import "./validation-panel.css";

type Issue = {
  level: "error" | "warning" | "info";
  message: string;
};

type Props = {
  loading: boolean;
  issues: Issue[];
};

export default function ValidationPanel({ loading, issues }: Props) {
  return (
    <div className="validation-panel">
      <div className="panel-header">
        Validation
      </div>

      {loading && (
        <div className="panel-empty">Checking…</div>
      )}

      {!loading && issues.length === 0 && (
        <div className="panel-empty success">
          No issues found ✓
        </div>
      )}

      {!loading && issues.length > 0 && (
        <ul className="issues">
          {issues.map((issue, i) => (
            <li key={i} className={`issue ${issue.level}`}>
              {issue.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
