import React from "react";
import { useSelector } from "react-redux";
import SelectService from "./SelectService";
import { Controller } from "redux-lz-controller";
import GatewayPanel from "./GatewayPanel";
import { Button } from "@material-ui/core";
import LoadingPanel from "./LoadingPanel";

export default function ServicePanel() {
  const { currentService, subscriptions, _async, discoveryServices } = useSelector(state => state.cloudevents);
  if (!currentService) {
    return <SelectService />;
  }
  if (_async && _async.REFRESH_DISCOVERY && _async.REFRESH_DISCOVERY.syncing) {
    return <LoadingPanel />;
  }
  let subscriptionUrl = `${currentService.url}/subscriptions`;
  if (discoveryServices && discoveryServices.length) {
    subscriptionUrl = discoveryServices[0].subscriptionurl;
  }

  return (
    <div>
      <h3>{currentService.name}</h3>
      <div style={{ paddingBottom: 20 }}>{currentService.url}</div>
      <div style={{ paddingBottom: 20, fontSize: 12 }}>
        <h4>Subscription URLs</h4>
        {discoveryServices
          .map(s => s.subscriptionurl)
          .map(e => {
            return <div>{e}</div>;
          })}
        <div style={{ paddingTop: 10, color: "red" }}>This UI will use {subscriptionUrl}</div>
      </div>
      <Button
        variant="contained"
        onClick={() => {
          if (subscriptions[currentService.url]) {
            Controller.get("cloudevents").unsubscribe();
          } else {
            Controller.get("cloudevents").subscribe();
          }
        }}
      >
        {subscriptions[currentService.url] ? "Unsubscribe" : "Subscribe"}
      </Button>
      {currentService.type === "Gateway" ? <GatewayPanel gateway={currentService} /> : undefined}
    </div>
  );
}
