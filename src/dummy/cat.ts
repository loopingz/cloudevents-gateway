import { Bean, Service, ServiceParameters } from "@webda/core";
import * as process from "process";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "../sdk/emitter";
import { DiscoveryService } from "../sdk/discovery";
import * as crypto from "crypto";

interface CatServiceParameters extends ServiceParameters {
  timeout: number;
  name: string;
}

const ACTIONS = ["miaou", "sleep", "sit", "meow", "play", "yarn"];
/**
 * Simple service
 */
@Bean
class CatService extends Service<CatServiceParameters> {
  async init() {
    if (process.env.CAT_NAME) {
      this.parameters.timeout = Number.parseInt(process.env.CAT_INTERVAL || "15000");
      this.parameters.name = `org.loopingz.cat.${process.env.CAT_NAME}`;
      // Generate a fake uuid for now
      let id = crypto.createHash("md5").update(`loopingz/cloudevents-gateway_${this.parameters.name}`).digest("hex");
      id = id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
      setInterval(this.cat.bind(this), this.parameters.timeout);
      DiscoveryService.registerService({
        name: this.parameters.name,
        events: ACTIONS,
        epoch: 2,
        id
      });
    }
  }

  cat() {
    CloudEventEmitter.event(
      new CloudEvent({
        source: this.parameters.name,
        type: ACTIONS[Math.floor(ACTIONS.length * Math.random())]
      })
    );
  }
}
