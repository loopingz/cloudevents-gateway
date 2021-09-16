import { Bean, Service, ServiceParameters } from "@webda/core";
import * as process from "process";
import { CloudEvent } from "cloudevents";
import { CloudEventEmitter } from "../sdk/emitter";
import { DiscoveryService } from "../sdk/discovery";
import * as crypto from "crypto";

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
      // Generate a fake uuid for now
      let id = crypto.createHash("md5").update(`loopingz/cloudevents-gateway_${this.parameters.name}`).digest("hex");
      id = id.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, "$1-$2-$3-$4-$5");
      DiscoveryService.registerService({
        name: this.parameters.name,
        epoch: 2,
        events: ["ping"],
        id
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
