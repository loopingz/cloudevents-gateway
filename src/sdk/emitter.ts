import { CloudEvent } from "cloudevents";
import { EventEmitter } from "events";

export class CloudEventEmitter extends EventEmitter {
  static singleton: CloudEventEmitter;

  static event(evt: CloudEvent) {
    CloudEventEmitter.singleton.emit("cloudevent", evt);
  }

  static onEvent(listener: (evt: CloudEvent) => void | Promise<void>) {
    CloudEventEmitter.singleton.on("cloudevent", listener);
  }
}

CloudEventEmitter.singleton = new CloudEventEmitter();
