import { Bean, Service, ServiceParameters } from "@webda/core";
import * as process from "process";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "../sdk/emitter";
import { DiscoveryService } from "../sdk/discovery";

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
      setInterval(this.cat.bind(this), this.parameters.timeout);
      DiscoveryService.registerService({
        name: this.parameters.name,
        types: ACTIONS
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
