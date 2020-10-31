import { Service, Route, Context } from "@webda/core";

export interface BasicFilter {
  type: "prefix" | "suffix" | "exact";
  property: string;
  value: string;
}

export interface BasicFiltering {
  dialect: "basic";
  filters: BasicFilter[];
}

export class SubscriptionService extends Service {
  @Route("/subscriptions(?query)", ["GET"])
  listServices(ctx: Context) {}

  @Route("/subscriptions/{uuid}", ["GET", "DELETE", "PUT"])
  updateService(ctx: Context) {}
}
