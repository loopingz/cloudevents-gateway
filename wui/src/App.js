import logo from "./logo.svg";
import Map from "./Map";
import "./App.css";
import DiscoveryServicePanel from "./DiscoveryServicePanel";
import ServicePanel from "./ServicePanel";
import CloudEventsPanel from "./CloudEventsPanel";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="cloudevents-icon-color.png" className="App-logo" alt="logo" />
      </header>
      <div className="App-content">
        <div>
          <div className="Column-header">Subscription</div>
          <div className="Column-header">Services</div>
          <div>
            <Map />
          </div>
          <div className="Column-header">Details</div>
          <div>
            <ServicePanel />
          </div>
        </div>
        <div>
          <div className="Column-header">Discovery</div>
          <div>
            <DiscoveryServicePanel />
          </div>
        </div>
        <div>
          <div className="Column-header">Events</div>
          <div>
            <CloudEventsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
