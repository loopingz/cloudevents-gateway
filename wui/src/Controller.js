import { Controller } from "redux-lz-controller";

// Extends library controller
class CloudEventController extends Controller {
  interval = 0;
  lastEvent = 0;

  constructor() {
    // This controller manage the subtree "contacts" of global Redux state
    super("cloudevents", {
      events: [],
      subscriptions: {},
      services: {}
    }); // its default value is an empty array
  }

  addService(name, url, callback) {
    if (!url.endsWith("/")) {
      url += "/";
    }
    this.asyncAction(
      "ADD_SERVICE",
      async () => {
        let infos = await this.ajax("/demo/services", "POST", { name, url });
        let services = { ...this.getLocalState().services };
        services[infos.id] = infos;
        return { services };
      },
      callback
    );
  }

  deleteService(id) {
    this.asyncAction("DELETE_SERVICE", async () => {
      await this.ajax(`/demo/services/${id}`, "DELETE");
      let services = { ...this.getLocalState().services };
      delete services[id];
      return { services };
    });
  }

  init() {
    this.loadSubscriptions();
    this.loadProxies();
    this.loadServices();
  }

  selectNode(node) {
    Controller.dispatch({
      type: "SELECT_NODE",
      node
    });
    this.refreshDiscovery(this.getLocalState().services[node]);
  }

  refreshDiscovery(service = this.getLocalState().currentService) {
    this.asyncAction("REFRESH_DISCOVERY", async () => {
      let infos = await this.ajax("/demo/discover", "POST", service);
      return { discoveryServices: infos };
    });
  }

  updateInterval(infos) {
    if (Object.keys(infos).length) {
      if (!this.interval) {
        this.interval = setInterval(this.loadEvents.bind(this), 3000);
      }
    } else if (this.interval) {
      clearInterval(this.interval);
    }
  }

  loadSubscriptions() {
    this.asyncAction("LOAD_SUBSCRIPTIONS", async () => {
      let infos = await this.ajax("/demo/subscriptions", "GET");
      this.updateInterval(infos);
      return { subscriptions: infos };
    });
  }

  clear() {
    Controller.dispatch({ type: "CLEAR_EVENTS" });
  }

  onCLEAR_EVENTS(state) {
    return {
      ...state,
      events: []
    };
  }

  subscribe() {
    this.asyncAction("SUBSCRIBE", async () => {
      let infos = await this.ajax("/demo/subscribe", "POST", this.getLocalState().discoveryServices);
      this.updateInterval(infos);
      return { subscriptions: infos };
    });
  }

  unsubscribe() {
    this.asyncAction("UNSUBSCRIBE", async () => {
      let infos = await this.ajax("/demo/unsubscribe", "POST", this.getLocalState().discoveryServices);
      this.updateInterval(infos);
      return { subscriptions: infos };
    });
  }

  loadProxies() {
    this.asyncAction("GET_PROXIES", async () => {
      let infos = await this.ajax("/proxies", "GET");
      return { proxies: infos };
    });
  }

  loadServices() {
    this.asyncAction("GET_SERVICES", async () => {
      return { services: await this.ajax("/demo/services", "GET") };
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
      currentService: state.services[action.node]
    };
  }

  loadEvents() {
    this.asyncAction("REFRESH_EVENTS", async () => {
      let events = await this.ajax(`/demo/events?since=${this.lastEvent}`);
      if (!events.length) {
        return;
      }
      events.sort((a, b) => {
        return new Date(a.time).getTime() > new Date(b.time).getTime() ? -1 : 1;
      });
      this.lastEvent = new Date(events[0].time).getTime();
      return { events: [...events, ...this.getLocalState().events] };
    });
  }
}

export default CloudEventController;
