import { Bean, Service, ServiceParameters } from "@webda/core";
import * as process from "process";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "../sdk/emitter";
import { DiscoveryService } from "../sdk/discovery";

interface PingServiceParameters extends ServiceParameters {
  timeout: number;
  name: string;
}

/**
 * Simple service
 */
@Bean
class PingService extends Service<PingServiceParameters> {
  async init() {
    if (process.env.PING_INTERVAL) {
      this.parameters.timeout = Number.parseInt(process.env.PING_INTERVAL);
      this.parameters.name = process.env.PING_NAME || "org.loopingz.services.PingService";
      setInterval(this.ping.bind(this), this.parameters.timeout);
      DiscoveryService.registerService({
        name: this.parameters.name,
        types: ["ping"]
      });
    }
  }

  ping() {
    CloudEventEmitter.event(
      new CloudEvent({
        source: this.parameters.name,
        type: "ping"
      })
    );
  }
}
