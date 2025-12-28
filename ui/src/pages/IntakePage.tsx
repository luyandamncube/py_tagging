import UrlInput from "../components/UrlInput";

export default function IntakePage() {
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: "0 auto" }}>
      <h1>📥 Add content</h1>

      <p style={{ opacity: 0.7 }}>
        Paste a URL to create a new content entry.
      </p>

      <UrlInput
        onCreated={() => {
          // future: toast / counter / analytics
        }}
      />
    </div>
  );
}
