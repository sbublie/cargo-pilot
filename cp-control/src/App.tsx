import OsmMap from "./components/OsmMap";

function App() {

  return (
    <div className="container text-center">
{/*       <div className="row">
        <div className="col">
          <DataDisplay
            showEmptyTours={showEmptyTours}
            setShowEmptyTours={setShowEmptyTours}
            showMatches={showMatches}
            setShowMatches={setShowMatches}
          />
        </div>
      </div> */}
      <h1>Cargo Pilot</h1>
      <h3>Match View</h3>
      <div className="row">
        <OsmMap />
      </div>
    </div>
  );
}

export default App;
