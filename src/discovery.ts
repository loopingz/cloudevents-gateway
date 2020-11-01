import { Service, Context, Bean, Store, Route } from "@webda/core";
import { CloudEventV1Service } from "./sdk/definition";
import { DiscoveryService } from "./sdk/discovery";
import { Proxy } from "./models/proxy";

class DiscoveryFilter {
  canAccessService(service: CloudEventV1Service, context: Context): boolean {
    return true;
  }

  filterTypes(service: CloudEventV1Service, context: Context): CloudEventV1Service {
    return service;
  }
}

@Bean
export class GatewayDiscoveryService extends Service {
  permissions: DiscoveryFilter = new DiscoveryFilter();
  // @ts-ignore
  proxyStore: Store<Proxy> = undefined;

  resolve() {
    let prefix = this._params.prefix || "";
    this._addRoute(`${prefix}/services{?name}`, ["GET"], this.listServices);
    this._addRoute(`${prefix}/services/{id}`, ["GET"], this.getServiceRequest);
    this.proxyStore = this.getService<Store<Proxy>>("ProxyStore");
  }

  refreshProxies() {
    let proxies = this.proxyStore.getAll();
  }

  listServices(ctx: Context) {
    ctx.write(
      DiscoveryService.searchService(ctx.getPathParameters().name || "")
        .filter(service => this.permissions.canAccessService(service, ctx))
        .map(service => this.permissions.filterTypes(service, ctx))
        .map(service => this.completeService(ctx, service))
    );
  }

  completeService(ctx: Context, service: CloudEventV1Service): CloudEventV1Service {
    let serv = this.permissions.filterTypes(service, ctx);
    return {
      ...serv,
      url: `${ctx.getHttpContext().getAbsoluteUrl(serv.url)}`,
      subscriptionurl: `${ctx.getHttpContext().getAbsoluteUrl(serv.subscriptionurl)}`
    };
  }

  getServiceRequest(ctx: Context) {
    let service = DiscoveryService.servicesMap[ctx.getPathParameters().id];
    if (!service || !this.permissions.canAccessService(service, ctx)) {
      throw 404;
    }
    ctx.write(this.completeService(ctx, service));
  }

  @Route("/proxies", ["GET"])
  async listProxies(ctx: Context) {
    ctx.write(await this.proxyStore.getAll());
  }

  async proxies(ctx: Context) {
    let { url } = ctx.getRequestBody();
    let res = await (
      await fetch(`${url}/subscriptions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          protocol: "HTTP",
          sink: ctx.getHttpContext().getAbsoluteUrl("/entrypoint"),
          protocolsettings: {
            headers: {
              "X-CloudEvents-Subscription-Secret": "test"
            }
          }
        })
      })
    ).json();
  }
}
