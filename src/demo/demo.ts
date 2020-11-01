import { Context, Route, Service } from "@webda/core";
import { CloudEvent } from "cloudevents";
const fetch = require("node-fetch");
import { v4 as uuidv4 } from "uuid";

class DemoService extends Service {
  eventsBuffer: CloudEvent[] = [];
  currentSecret: string = "";
  unsubscribeUrl: string = "";

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

  @Route("/demo/subscribe", ["POST"])
  async subscribe(ctx: Context) {
    let { url } = ctx.getRequestBody();
    this.currentSecret = uuidv4();
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
    this.unsubscribeUrl = `${url}/subscriptions/${res.id}`;
  }
}
