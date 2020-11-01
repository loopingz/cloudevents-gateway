import { Bean, Service } from "@webda/core";
import * as process from "process";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "../sdk/emitter";
import { DiscoveryService } from "../sdk/discovery";

/**
 * Simple service
 */
@Bean
class PingService extends Service {
  async init() {
    if (process.env.PING_INTERVAL) {
      this._params.timeout = process.env.PING_INTERVAL;
      this._params.name = process.env.PING_NAME || "org.loopingz.services.PingService";
      setInterval(this.ping.bind(this), this._params.timeout);
      DiscoveryService.registerService({
        name: this._params.name,
        types: ["ping"]
      });
    }
  }

  ping() {
    CloudEventEmitter.event(
      new CloudEvent({
        source: this._params.name,
        type: "ping"
      })
    );
  }
}
