import OsmMap from "./components/OsmMap";
import DataDisplay from "./components/DataDisplay";

function App() {
  return (
    <div className="container text-center">
      <div className="row">
        <div className="col">
          <DataDisplay />
        </div>
        <div className="col">
          <OsmMap />
        </div>
      </div>
    </div>
  );
}

export default App;
