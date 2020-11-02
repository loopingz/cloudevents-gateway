import { Context, Route, Service } from "@webda/core";
import { CloudEvent } from "cloudevents";
const fetch = require("node-fetch");
import { v4 as uuidv4 } from "uuid";

class DemoService extends Service {
  eventsBuffer: CloudEvent[] = [];
  currentSecret: string = "";
  subscriptions: {[key:string]: string} = {};

  resolve() {
    this.currentSecret = uuidv4();
  }

  @Route("/demo/entrypoint", ["POST"])
  async entrypoint(ctx: Context) {
    if (ctx.getHttpContext().getHeader("X-CloudEvents-Subscription-Secret") !== this.currentSecret) {
      throw 403;
    }
    this.eventsBuffer.push(ctx.getRequestBody());
  }

  @Route("/demo/events")
  async events(ctx: Context) {
    ctx.write(this.eventsBuffer);
    this.eventsBuffer = [];
  }

  @Route("/demo/discover",  ["POST"])
  async discover(ctx: Context) {
    let { url } = ctx.getRequestBody();
    ctx.write(await (await fetch(`${url}/services`)).json());
  }

  @Route("/demo/subscriptions")
  async getSubscriptions(ctx: Context) {
    ctx.write(this.subscriptions);
  }

  @Route("/demo/unsubscribe", ["POST"])
  async unsubscribe(ctx: Context) {
    let { url } = ctx.getRequestBody();
    if (this.subscriptions[url]) {
      await fetch(this.subscriptions[url], {
        method: "DELETE",
      });
      delete this.subscriptions[url];
    }
    ctx.write(this.subscriptions);
  }

  @Route("/demo/subscribe", ["POST"])
  async subscribe(ctx: Context) {
    let { url } = ctx.getRequestBody();
    this.log("INFO", "Will subscribe to this one", url);
    let res = await (
      await fetch(`${url}/subscriptions`, {
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
    this.subscriptions[url] = `${url}/subscriptions/${res.id}`;
    ctx.write(this.subscriptions);
  }
}
