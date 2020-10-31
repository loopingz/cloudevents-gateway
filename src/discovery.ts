import { Service, Route, Context } from "@webda/core";

class DiscoveryService extends Service {
  @Route("/servies")
  listServices(ctx: Context) {}
}
