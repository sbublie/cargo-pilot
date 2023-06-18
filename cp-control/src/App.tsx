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

      <div className="row">
        <OsmMap />
      </div>
    </div>
  );
}

export default App;
