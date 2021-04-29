import React from "react";
import { useSelector } from "react-redux";
import SelectService from "./SelectService";
import LoadingPanel from "./LoadingPanel";

export default function DiscoveryServicePanel() {
  const { discoveryServices, _async } = useSelector(state => state.cloudevents);
  if (!discoveryServices) {
    return <SelectService />;
  }
  if (_async && _async.REFRESH_DISCOVERY && _async.REFRESH_DISCOVERY.syncing) {
    return <LoadingPanel />;
  }
  return (
    <div>
      {discoveryServices.map(s => {
        return (
          <div className="serviceBlock">
            <h3>{s.name}</h3>
            <div>
              {s.types.map(t => {
                return <div>{t.type}</div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
