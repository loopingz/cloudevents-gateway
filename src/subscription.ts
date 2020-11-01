import { Service, Route, Context, MemoryStore, Store, CoreModel, Core } from "@webda/core";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "./sdk/emitter";
import { CloudEventV1Service } from "./sdk/definition";
import { Subscription } from "./models/subscription";
//import * as fetch from "node-fetch";
const fetch = require("node-fetch");

export class SubscriptionService extends Service {
  store: Store<Subscription>;

  getUrl() {
    return "/subscriptions";
  }

  getProtocols() {
    return ["http"];
  }

  constructor(webda: Core, name: string, params: any) {
    super(webda, name, params);
    this.store = new MemoryStore<Subscription>(webda, name, { model: "CloudEventsGateway/Subscription" });
    this.store._model = Subscription;
  }

  resolve() {
    CloudEventEmitter.onEvent(this.onEvent.bind(this));
  }

  async push(evt: CloudEvent, subscription: Subscription) {
    // Do something
    switch (subscription.protocol) {
      case "HTTP":
        await fetch(subscription.sink, {
          method: subscription.protocolsettings.method || "POST",
          headers: { ...subscription.protocolsettings.headers, "content-type": "application/json" },
          body: JSON.stringify(evt)
        });
        break;
    }
  }

  async onEvent(evt: CloudEvent) {
    let subscriptions = await this.store.getAll();
    subscriptions.forEach(subscription => {
      if (subscription.match(evt)) {
        this.push(evt, subscription);
      }
    });
  }

  @Route("/subscriptions{?query}", ["GET", "POST"])
  async listSubscriptions(ctx: Context) {
    if (ctx.getHttpContext().getMethod() === "POST") {
      let subscription = new Subscription();
      subscription.load(ctx.getRequestBody());
      this.log("INFO", "Adding a new subscription", subscription);
      await this.store.save(subscription, ctx);
      ctx.write(subscription);
    } else {
      let result = [];
      let subs = await this.store.getAll();
      for (let i in subs) {
        if (subs[i].canAccess(ctx)) {
          result.push(subs[i]);
        }
      }
      ctx.write(result);
    }
  }

  @Route("/subscriptions/{uuid}", ["GET", "DELETE", "PUT"])
  async updateSubscription(ctx: Context) {
    let subscription = await this.store.get(ctx.getPathParameters().uuid);
    // Check if it exists and we have the rights
    if (!subscription || !(await subscription.canAccess(ctx))) {
      throw 404;
    }
    switch (ctx.getHttpContext().getMethod()) {
      case "GET":
        ctx.write(subscription);
        break;
      case "PUT":
        await subscription.update({ ...ctx.getRequestBody(), uuid: subscription.uuid });
        ctx.write(subscription);
        break;
      case "DELETE":
        await subscription.delete();
        break;
    }
  }
}
