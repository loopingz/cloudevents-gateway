import { Service, Context, Bean, Store, Route, RequestFilter, ServiceParameters } from "@webda/core";
import { CloudEventV1Service } from "./sdk/definition";
import { DiscoveryService } from "./sdk/discovery";
import { Proxy } from "./models/proxy";
import * as crypto from "crypto";
const fetch = require("node-fetch");

class DiscoveryFilter {
  canAccessService(service: CloudEventV1Service, context: Context): boolean {
    return true;
  }

  filterTypes(service: CloudEventV1Service, context: Context): CloudEventV1Service {
    return service;
  }
}

interface GatewayDiscoveryParameters extends ServiceParameters {
  prefix: string;
}
@Bean
export class GatewayDiscoveryService extends Service<GatewayDiscoveryParameters> implements RequestFilter<Context> {
  async checkRequest(context: Context): Promise<boolean> {
    return true;
  }

  permissions: DiscoveryFilter = new DiscoveryFilter();
  // @ts-ignore
  proxyStore: Store<Proxy> = undefined;
  proxies: { [key: string]: { url: string; subscriptionId: string } } = {};

  resolve() {
    this._webda.registerRequestFilter(this);
    let prefix = this.parameters.prefix || "";
    this.addRoute(`${prefix}/services{?name}`, ["GET"], this.listServices);
    this.addRoute(`${prefix}/services/{id}`, ["GET"], this.getServiceRequest);
    this.proxyStore = this.getService<Store<Proxy>>("ProxyStore");
    if (process.env.WUI) {
      this.addRoute(`/`, ["GET"], this.redirectUi);
    } else {
      this.addRoute(`/`, ["GET"], this.liveProbe);
    }
    // Discovery management
    this.addRoute(`${prefix}/services{?import}`, ["POST"], this.addService);
    this.addRoute(`${prefix}/services/{id}{?import}`, ["PUT"], this.updateService);
    this.addRoute(`${prefix}/services/{id}`, ["DELETE"], this.deleteService);
  }

  addService(ctx: Context) {
    if (ctx.getParameters().import) {
      // Should be an array
      ctx.getRequestBody().forEach((service: any) => {
        DiscoveryService.registerService(service);
      });
    } else {
      DiscoveryService.registerService(ctx.getRequestBody());
    }
  }

  updateService(ctx: Context) {
    const id = ctx.getParameters().id;
    const service = { ...DiscoveryService.getServices()[id], ...ctx.getRequestBody() };
    if (!ctx.getParameters().import && !DiscoveryService.getServices()[id]) {
      throw 404;
    }
    DiscoveryService.deleteService(id);
    DiscoveryService.registerService(service);
  }

  deleteService(ctx: Context) {
    DiscoveryService.deleteService(ctx.getParameters().id);
  }

  liveProbe(ctx: Context) {}

  redirectUi(ctx: Context) {
    // Fixed in next webda.io
    if (ctx.getHttpContext().getHeader("x-forwarded-port")) {
      ctx.getHttpContext().port = parseInt(ctx.getHttpContext().getHeader("x-forwarded-port"));
    }
    ctx.redirect(ctx.getHttpContext().getAbsoluteUrl("/demo/ui/"));
  }

  async refreshProxies(): Promise<CloudEventV1Service[]> {
    // @ts-ignore
    const flat = arr => [].concat(...arr);
    return flat(
      await Promise.all(
        Object.values(this.proxies).map(async proxy => {
          try {
            return await (await fetch(`${proxy.url}services`)).json();
          } catch (err) {
            this.log("ERROR", "refreshProxies", err);
            return [];
          }
        })
      )
    );
  }

  async filterProxyServices(name: string = "") {
    return this.refreshProxies();
  }

  async listServices(ctx: Context) {
    let { name = "" } = ctx.getPathParameters();
    ctx.write(
      [...DiscoveryService.searchService(name), ...(await this.filterProxyServices(name))]
        .filter(service => this.permissions.canAccessService(service, ctx))
        .map(service => this.permissions.filterTypes(service, ctx))
        .map(service => this.completeService(ctx, service))
    );
  }

  completeService(ctx: Context, service: CloudEventV1Service): CloudEventV1Service {
    let serv = this.permissions.filterTypes(service, ctx);
    // Fixed in next webda.io
    if (ctx.getHttpContext().getHeader("x-forwarded-port")) {
      ctx.getHttpContext().port = parseInt(ctx.getHttpContext().getHeader("x-forwarded-port"));
    }
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

  @Route("/proxies", ["POST", "GET"])
  async createProxy(ctx: Context) {
    if (ctx.getHttpContext().getMethod() === "GET") {
      ctx.write(this.proxies);
      return;
    }
    let { url } = ctx.getRequestBody();
    if (!url.endsWith("/")) {
      url += "/";
    }
    let id = crypto.createHash("sha1").update(url).digest("hex");
    if (this.proxies[id]) {
      throw 409;
    }
    let res = await (
      await fetch(`${url}subscriptions`, {
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
    this.proxies[id] = {
      url,
      subscriptionId: res.id
    };
    ctx.write({ id, url });
  }

  @Route("/proxies/{id}", ["DELETE"])
  async deleteProxy(ctx: Context) {
    let { id } = ctx.getPathParameters();
    if (!this.proxies[id]) {
      throw 404;
    }
    var url = this.proxies[id].url;
    if (!url.endsWith("/")) {
      url += "/";
    }
    await fetch(`${url}subscriptions/${this.proxies[id].subscriptionId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" }
    });
    delete this.proxies[id];
    ctx.write(this.proxies);
  }
}
