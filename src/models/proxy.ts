import { Context, CoreModel } from "@webda/core";
import { GatewayDiscoveryService } from "../discovery";

export default class Proxy extends CoreModel {
  url: string = "";

  async listServices() {}

  async describeService() {}

  async _onSaved() {
    this.getContext().getWebda().log("INFO", "Saved proxy");
  }

  async canAct(ctx: Context) {
    return this;
  }

  static getUuidField() {
    return "id";
  }
}

export { Proxy };
