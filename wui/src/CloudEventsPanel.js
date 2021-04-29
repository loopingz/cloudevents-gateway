import React from "react";
import { useSelector } from "react-redux";

export default function CloudEventsPanel() {
  const events = useSelector(state => state.cloudevents.events);
  return (
    <div>
      {events.map(e => (
        <div className="cloudevent">
          <div className="source">{e.source}</div>
          <div className="type">{e.type}</div>
          <div className="time">{e.time}</div>
        </div>
      ))}
    </div>
  );
}
