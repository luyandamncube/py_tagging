interface Content {
  id: string;
  url: string;
  site?: string;
  creator?: string;
  type?: string;
}

interface Props {
  content: Content;
}

export default function ContentPreview({ content }: Props) {
  return (
    <div>
      <div style={{ fontSize: 12, opacity: 0.6 }}>
        Previewing content
      </div>

      <div style={{ marginTop: 8 }}>
        <div><strong>ID:</strong> {content.id}</div>
        <div><strong>URL:</strong> {content.url}</div>
        {content.site && <div><strong>Site:</strong> {content.site}</div>}
        {content.creator && <div><strong>Creator:</strong> {content.creator}</div>}
        {content.type && <div><strong>Type:</strong> {content.type}</div>}
      </div>
    </div>
  );
}
