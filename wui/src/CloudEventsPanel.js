import React from "react";
import { useSelector } from "react-redux";
import { Controller } from "redux-lz-controller";

export default function CloudEventsPanel() {
  const events = useSelector((state) => state.cloudevents.events);
  return (
    <div style={{ overflow: "scroll", maxHeight: "calc(100vh - 80px);" }}>
      <div onClick={() => Controller.get("cloudevents").clear()} style={{ paddingBottom: 15 }}>
        clear events
      </div>
      {events.map((e) => (
        <div className="cloudevent">
          <div className="source">{e.source}</div>
          <div className="type">{e.type}</div>
          <div className="time">{e.time}</div>
        </div>
      ))}
    </div>
  );
}
