import { Bean, Service } from "@webda/core";
import * as process from "process";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "../sdk/emitter";
import { DiscoveryService } from "../sdk/discovery";

const ACTIONS = ["miaou", "sleep", "sit", "meow", "play", "yarn"];
/**
 * Simple service
 */
@Bean
class CatService extends Service {
  async init() {
    if (process.env.CAT_NAME) {
      this._params.timeout = process.env.CAT_INTERVAL || 15000;
      this._params.name = `org.loopingz.cat.${process.env.CAT_NAME}`;
      setInterval(this.cat.bind(this), this._params.timeout);
      DiscoveryService.registerService({
        name: this._params.name,
        types: ACTIONS
      });
    }
  }

  cat() {
    CloudEventEmitter.event(
      new CloudEvent({
        source: this._params.name,
        type: ACTIONS[Math.floor(ACTIONS.length * Math.random())]
      })
    );
  }
}
