import { Controller } from "redux-lz-controller";

// Extends library controller
class CloudEventController extends Controller {
  constructor() {
    // This controller manage the subtree "contacts" of global Redux state
    super("cloudevents", {
      events: [],
      subscriptions: { "0A4A733D11F878E99F38E8F28243E3D1": "subid" },
      services: {
        "41AE7BA24F4E640353EB3DE20E84FA61": {
          url: "http://localhost:18080",
          name: "Gateway",
          type: "Gateway",
          connections: ["0A4A733D11F878E99F38E8F28243E3D1", "E4CAB58F28BB19AE602CE3FD8DBD6B70"],
        },
        "0A4A733D11F878E99F38E8F28243E3D1": {
          url: "http://localhost:18081",
          name: "Garfield",
          type: "Service",
          connections: [],
        },
        E4CAB58F28BB19AE602CE3FD8DBD6B70: {
          url: "http://localhost:18082",
          name: "Ping",
          type: "Service",
          connections: [],
        },
      },
    }); // its default value is an empty array
    setInterval(this.loadEvents.bind(this), 3000);
  }

  init() {
    this.loadSubscriptions();
    this.loadProxies();
  }

  selectNode(node) {
    Controller.dispatch({
      type: "SELECT_NODE",
      node,
    });
    this.refreshDiscovery(this.getLocalState().services[node]);
  }

  refreshDiscovery(service = this.getLocalState().currentService) {
    this.asyncAction("REFRESH_DISCOVERY", async () => {
      let infos = await this.ajax("/demo/discover", "POST", service);
      return { discoveryServices: infos };
    });
  }

  loadSubscriptions() {
    this.asyncAction("LOAD_SUBSCRIPTIONS", async () => {
      let infos = await this.ajax("/demo/subscriptions", "GET");
      return { subscriptions: infos };
    });
  }

  clear() {
    Controller.dispatch({ type: "CLEAR_EVENTS" });
  }

  onCLEAR_EVENTS(state) {
    return {
      ...state,
      events: [],
    };
  }

  subscribe() {
    this.asyncAction("SUBSCRIBE", async () => {
      let infos = await this.ajax("/demo/subscribe", "POST", this.getLocalState().currentService);
      return { subscriptions: infos };
    });
  }

  unsubscribe() {
    this.asyncAction("UNSUBSCRIBE", async () => {
      let infos = await this.ajax("/demo/unsubscribe", "POST", this.getLocalState().currentService);
      return { subscriptions: infos };
    });
  }

  loadProxies() {
    this.asyncAction("GET_PROXIES", async () => {
      let infos = await this.ajax("/proxies", "GET");
      return { proxies: infos };
    });
  }

  proxyConnect(url) {
    this.asyncAction(
      "NEW_PROXY",
      async () => {
        await this.ajax("/proxies", "POST", { url });
      },
      () => {
        this.refreshDiscovery();
        this.loadProxies();
      }
    );
  }

  proxyDisconnect(id) {
    this.asyncAction(
      "DELETE_PROXY",
      async () => {
        let infos = await this.ajax(`/proxies/${id}`, "DELETE");
        return { proxies: infos };
      },
      () => {
        this.refreshDiscovery();
      }
    );
  }

  onSELECT_NODE(state, action) {
    return {
      ...state,
      currentService: state.services[action.node],
    };
  }

  loadEvents() {
    this.asyncAction("REFRESH_EVENTS", async () => {
      let events = await this.ajax("/demo/events");
      if (!events.length) {
        return;
      }
      events.sort((a, b) => {
        return new Date(a.time).getTime() > new Date(b.time).getTime() ? 1 : -1;
      });
      return { events: [...events, ...this.getLocalState().events] };
    });
  }
}

export default CloudEventController;
