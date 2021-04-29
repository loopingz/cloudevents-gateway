import { Context, Route, Service } from "@webda/core";
import { CloudEvent } from "cloudevents";
const fetch = require("node-fetch");
import { v4 as uuidv4 } from "uuid";
import { CloudEventV1Service } from "../sdk/definition";

class DemoService extends Service {
  eventsBuffer: CloudEvent[] = [];
  currentSecret: string = "";
  subscriptions: { [key: string]: string } = {};
  services: { [key: string]: { name: string; url: string; type: string } } = {
    GATEWAY: {
      url: "http://localhost:18080",
      name: "Gateway",
      type: "Gateway"
    }
  };

  resolve() {
    this.currentSecret = uuidv4();
    setInterval(this.cleanEvents.bind(this), 30000);
  }

  cleanEvents() {
    let filter = Date.now() - 60000;
    this.eventsBuffer = this.eventsBuffer.filter(evt => new Date(evt.time).getTime() > filter);
  }

  @Route("/demo/entrypoint", ["POST"])
  async entrypoint(ctx: Context) {
    if (ctx.getHttpContext().getHeader("X-CloudEvents-Subscription-Secret") !== this.currentSecret) {
      throw 403;
    }
    this.eventsBuffer.push(ctx.getRequestBody());
  }

  @Route("/demo/events{?since}")
  async events(ctx: Context) {
    let filter = ctx.getParameters().since;
    if (filter) {
      ctx.write(this.eventsBuffer.filter(evt => new Date(evt.time).getTime() > filter));
      return;
    }
    ctx.write(this.eventsBuffer);
  }

  @Route("/demo/services", ["GET"])
  async listServices(ctx: Context) {
    this.services.GATEWAY.url = ctx.getHttpContext().getAbsoluteUrl("/");
    ctx.write(this.services);
  }

  @Route("/demo/services/{uuid}", ["DELETE"])
  async deleteService(ctx: Context) {
    if (this.services[ctx.getParameters().uuid]) {
      delete this.services[ctx.getParameters().uuid];
    }
    ctx.write(this.services);
  }

  @Route("/demo/services", ["POST"])
  async addService(ctx: Context) {
    let serv = ctx.getRequestBody();
    let id = require("crypto").createHash("md5").update(serv.url).digest("hex");
    if (this.services[id]) {
      throw 409;
    }
    this.services[id] = { ...serv, id };
    ctx.write(this.services[id]);
  }

  @Route("/demo/discover", ["POST"])
  async discover(ctx: Context) {
    let { url } = ctx.getRequestBody();
    if (!url.endsWith("/")) {
      url += "/";
    }
    this.log("INFO", `Discovering ${url}`);
    ctx.write(await (await fetch(`${url}services`)).json());
  }

  @Route("/demo/subscriptions")
  async getSubscriptions(ctx: Context) {
    ctx.write(this.subscriptions);
  }

  @Route("/demo/unsubscribe", ["POST"])
  async unsubscribe(ctx: Context) {
    let { url } = ctx.getRequestBody();
    if (!url.endsWith("/")) {
      url += "/";
    }
    this.log("INFO", "Subscribe to this one", url);
    if (this.subscriptions[url]) {
      await fetch(this.subscriptions[url], {
        method: "DELETE"
      });
      delete this.subscriptions[url];
    }
    ctx.write(this.subscriptions);
  }

  @Route("/demo/subscribe", ["POST"])
  async subscribe(ctx: Context) {
    let services: CloudEventV1Service[] = ctx.getRequestBody();
    if (!services || !services.length) {
      throw 401;
    }
    const url = services[0].subscriptionurl;
    this.log("INFO", "Subscribe to this one", url);
    if (this.subscriptions[url]) {
      return;
    }

    let res = await (
      await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          protocol: "HTTP",
          sink: ctx.getHttpContext().getAbsoluteUrl("/demo/entrypoint"),
          protocolsettings: {
            headers: {
              "X-CloudEvents-Subscription-Secret": this.currentSecret
            }
          }
        })
      })
    ).json();
    this.subscriptions[url] = `${url}subscriptions/${res.id}`;
    ctx.write(this.subscriptions);
  }
}
