import React from "react";
import { useSelector } from "react-redux";
import SelectService from "./SelectService";
import { Controller } from "redux-lz-controller";
import GatewayPanel from "./GatewayPanel";

export default function ServicePanel() {
  const { currentService, subscriptions } = useSelector((state) => state.cloudevents);
  if (!currentService) {
    return <SelectService />;
  }
  return (
    <div>
      <h3>{currentService.name}</h3>
      <div style={{ paddingBottom: 20 }}>{currentService.url}</div>
      <button
        onClick={() => {
          if (subscriptions[currentService.url]) {
            Controller.get("cloudevents").unsubscribe();
          } else {
            Controller.get("cloudevents").subscribe();
          }
        }}
      >
        {subscriptions[currentService.url] ? "Unsubscribe" : "Subscribe"}
      </button>
      {currentService.type === "Gateway" ? <GatewayPanel gateway={currentService} /> : undefined}
    </div>
  );
}
