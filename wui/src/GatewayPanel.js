import React from "react";
import { useSelector } from "react-redux";
import { Controller } from "redux-lz-controller";

export default function GatewayPanel({ gateway }) {
  const { services, proxies } = useSelector((state) => state.cloudevents);
  return (
    <div style={{ paddingTop: 30 }}>
      {Object.keys(services).map((id) => {
        let s = services[id];
        if (s === gateway) {
          return undefined;
        }
        let proxy;
        for (let i in proxies) {
          if (proxies[i].url === s.url) {
            proxy = i;
          }
        }
        let className = "gwRow";
        return (
          <div className={className}>
            <div>{s.name}</div>
            <button
              onClick={() => {
                if (proxy) {
                  Controller.get("cloudevents").proxyDisconnect(proxy);
                } else {
                  Controller.get("cloudevents").proxyConnect(s.url);
                }
              }}
            >
              {proxy ? "Disconnect" : "Connect"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
