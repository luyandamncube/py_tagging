import "./App.css";
import ContentPreview from "./components/ContentPreview";
import TagGroupSection from "./components/TagGroupSection";
import ValidationBanner from "./components/ValidationBanner";

function App() {
  return (
    <div className="app">
      <div className="left">
        <ContentPreview />
      </div>

      <div className="right">
        <TagGroupSection title="Required">
          <p>Niche</p>
          <p>Models</p>
        </TagGroupSection>

        <TagGroupSection title="Optional">
          <p>Appearance</p>
          <p>Species</p>
          <p>Genre</p>
        </TagGroupSection>

        <ValidationBanner />
      </div>
    </div>
  );
}

export default App;
