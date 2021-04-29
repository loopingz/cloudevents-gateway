import logo from "./logo.svg";
import Map from "./Map";
import "./App.css";
import DiscoveryServicePanel from "./DiscoveryServicePanel";
import ServicePanel from "./ServicePanel";
import CloudEventsPanel from "./CloudEventsPanel";
import NewServiceDialog from "./NewService";
import { IconButton } from "@material-ui/core";
import { ClearAll as ClearAllIcon } from "@material-ui/icons";
import { Controller } from "redux-lz-controller";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src="cloudevents-icon-color.png" className="App-logo" alt="logo" />
        <h1>CloudEvents Gateway</h1>
      </header>
      <div className="App-content">
        <div>
          <div className="Column-header">Subscription</div>
          <div className="Column-header actionIcon">
            <div></div>
            <div>Services</div>
            <NewServiceDialog />
          </div>
          <div className="Column-content">
            <Map />
          </div>
          <div className="Column-header">Details</div>
          <div className="Column-content">
            <ServicePanel />
          </div>
        </div>
        <div>
          <div className="Column-header">Discovery</div>
          <div className="Column-content">
            <DiscoveryServicePanel />
          </div>
        </div>
        <div>
          <div className="Column-header actionIcon">
            <div></div>
            <div>Events</div>
            <div>
              <IconButton color="secondary" onClick={() => Controller.get("cloudevents").clear()}>
                <ClearAllIcon />
              </IconButton>
            </div>
          </div>
          <div className="Column-content">
            <CloudEventsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
