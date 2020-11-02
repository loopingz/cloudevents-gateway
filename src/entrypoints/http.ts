import { Context, Route, Service } from "@webda/core";
import { CloudEventEmitter } from "../sdk/emitter";

class HttpEntrypoint extends Service {
  @Route("/entrypoint", ["POST"])
  entrypoint(ctx: Context) {
    CloudEventEmitter.event(ctx.getRequestBody());
  }
}
