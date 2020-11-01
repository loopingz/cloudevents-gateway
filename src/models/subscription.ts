import { CoreModel, Context } from "@webda/core";
import { CloudEvent } from "cloudevents";

export interface BasicFilter {
  type: "prefix" | "suffix" | "exact";
  property: string;
  value: string;
}

export interface BasicFiltering {
  dialect: "basic";
  filters: BasicFilter[];
}

export interface HttpSettings {
  headers?: { [key: string]: string };
  method?: "POST" | "PUT";
}

export default class Subscription extends CoreModel {
  id: string = "";
  protocol: "HTTP" = "HTTP";
  protocolsettings: HttpSettings = {};
  sink: string = "";
  filter: BasicFiltering = { dialect: "basic", filters: [] };

  static getUuidField() {
    return "id";
  }

  async canAccess(ctx: Context) {
    return this;
  }

  match(evt: CloudEvent): boolean {
    // A bit too much of filter here
    if (this.filter.filters.length) {
      for (let i in this.filter.filters) {
        let filter = this.filter.filters[i];
        let value: string = <string>evt[filter.property];
        switch (filter.type) {
          case "prefix":
            if (!value.startsWith(filter.value)) {
              return false;
            }
            break;
          case "suffix":
            if (!value.endsWith(filter.value)) {
              return false;
            }
            break;
          default:
            if (value !== filter.value) {
              return false;
            }
        }
      }
    }
    return true;
  }
}

export { Subscription };
