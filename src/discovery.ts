import { Service, Context, Bean, Store, Route } from "@webda/core";
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

@Bean
export class GatewayDiscoveryService extends Service {
  permissions: DiscoveryFilter = new DiscoveryFilter();
  // @ts-ignore
  proxyStore: Store<Proxy> = undefined;
  proxies: {[key:string]: {url: string, subscriptionId: string}} = {};

  resolve() {
    let prefix = this._params.prefix || "";
    this._addRoute(`${prefix}/services{?name}`, ["GET"], this.listServices);
    this._addRoute(`${prefix}/services/{id}`, ["GET"], this.getServiceRequest);
    this.proxyStore = this.getService<Store<Proxy>>("ProxyStore");
  }

  async refreshProxies() : Promise<CloudEventV1Service[]> {
    // @ts-ignore
    const flat = arr => [].concat(...arr);
    return flat(await Promise.all(Object.values(this.proxies).map(async (proxy) => {
      try {
        return await (await fetch(`${proxy.url}/services`)).json()
      } catch (err) {
        this.log("ERROR", "refreshProxies", err);
        return [];
      }
    })));
  }

  async filterProxyServices(name: string = "") {
    return this.refreshProxies();
  }

  async listServices(ctx: Context) {
    let {name = ""} = ctx.getPathParameters();
    ctx.write(
      [...DiscoveryService.searchService(name), ...await this.filterProxyServices(name)].filter(service => this.permissions.canAccessService(service, ctx))
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

  @Route("/proxies", ["POST", "GET"])
  async createProxy(ctx: Context) {
    if (ctx.getHttpContext().getMethod() === "GET") {
      ctx.write(this.proxies);
      return;
    }
    let { url } = ctx.getRequestBody();
    let id = crypto.createHash('sha1').update(url).digest('hex');
    if (this.proxies[id]) {
      throw 409;
    }
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
    this.proxies[id] = {
      url,
      subscriptionId: res.id
    }
    ctx.write({id, url})
  }

  @Route("/proxies/{id}", ["DELETE"])
  async deleteProxy(ctx: Context) {
    let { id } = ctx.getPathParameters();
    if (!this.proxies[id]) {
      throw 404;
    }
    const url = this.proxies[id].url;
    await fetch(`${url}/subscriptions/${this.proxies[id].subscriptionId}`, {
      method: "DELETE",
      headers: { "content-type": "application/json" }
    })
    delete this.proxies[id];
    ctx.write(this.proxies);
  }
}
