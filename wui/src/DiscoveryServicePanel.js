import React from "react";
import { useSelector } from "react-redux";
import SelectService from "./SelectService";

export default function DiscoveryServicePanel() {
  const { discoveryServices } = useSelector((state) => state.cloudevents);
  if (!discoveryServices) {
    return <SelectService />;
  }
  return (
    <div>
      {discoveryServices.map((s) => {
        return (
          <div className="serviceBlock">
            <h3>{s.name}</h3>
            <div>
              {s.types.map((t) => {
                return <div>{t.type}</div>;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
