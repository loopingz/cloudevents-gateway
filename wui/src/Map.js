import React from "react";
import { Controller } from "redux-lz-controller";
import Graph from "vis-react";
import { useSelector } from "react-redux";
import VisibilityIcon from "@material-ui/icons/Visibility";

var graph = {
  nodes: [
    { id: 1, label: "Service A" },
    { id: 2, label: "Service B" },
    { id: 3, label: "Gateway" },
    { id: 5, label: "Client (You)" }
  ],
  edges: [
    // { from: 1, to: 2 },
    // { from: 1, to: 3 },
    // { from: 2, to: 4 },
    // { from: 2, to: 5 },
  ]
};

var options = {
  layout: {
    hierarchical: true
  },
  edges: {
    color: "#000000"
  },
  interaction: { hoverEdges: true }
};

const style = {
  minHeight: 300
};

export default function Map() {
  const { subscriptions, services, currentService } = useSelector(state => state.cloudevents);
  const events = {
    select: function (event) {
      var { nodes, edges } = event;
      console.log(event);
      Controller.get("cloudevents").selectNode("test");
    }
  };
  const graph = {
    nodes: [{ id: "wui", label: "Client (You)" }],
    edges: []
  };

  return (
    <div style={{ minHeight: 200 }}>
      {Object.keys(services).map(id => {
        let s = services[id];
        let className = "mapRow";
        if (s === currentService) {
          className += " mapRowSelected";
        }
        return (
          <div
            style={{ display: "flex" }}
            onClick={() => Controller.get("cloudevents").selectNode(id)}
            className={className}
          >
            <div style={{ width: 24 }}>{subscriptions[s.url] ? <VisibilityIcon /> : null}</div>
            <div style={{ flexGrow: 1 }}>{s.name}</div>
            <div style={{ width: 24 }}></div>
          </div>
        );
      })}
    </div>
  );
  for (let id in services) {
    graph.nodes.push({ id, label: services[id].name });
    //services[id].connections.forEach((to) => graph.edges.push({ from: id, to }));
  }
  for (let id in subscriptions) {
    // graph.edges.push({ from: "wui", to: id });
  }
  console.log(services, graph);
  return (
    <Graph
      graph={graph}
      options={options}
      events={events}
      style={style}
      getNetwork={network => {
        //  if you want access to vis.js network api you can set the state in a parent component using this property
      }}
    />
  );
}
