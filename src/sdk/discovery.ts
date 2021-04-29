import { EventEmitter } from "events";
import { CloudEventV1Service, CloudEventV1Type } from "./definition";

interface RequestHandler {
  (
    req: { query: { matching: string }; url: string },
    res: {
      end: () => void;
      status: (
        code: number
      ) => { json: (obj: Record<string, unknown> | CloudEventV1Service[]) => string; end: () => void };
    }
  ): void;
}

export interface SimpleCloudEventV1Service {
  name: string;
  events: (string | CloudEventV1Type)[];
}
/**
 * DiscoveryService to implement the discovery spec:
 *
 * It provides a way to register Service through programmation and annotation
 *
 * It also include a express method to expose it through your API
 */
export class DiscoveryService {
  /**
   * Services mapped by name
   */
  static servicesMap: { [key: string]: CloudEventV1Service } = {};

  /**
   * Emitter
   */
  static emitter = new EventEmitter();

  /**
   * Register your service to the DiscoveryService
   *
   * Annotation to declare a Service
   *
   * TODO Implement after discussion with team
   * It would add a @Service in front of class to declare a new service
   *
   * @returns {void}
   */
  static Service(): void {
    // TO IMPLEMENT
  }

  /**
   * Register your service to the DiscoveryService
   *
   * @param {CloudEventV1Service} service to register
   * @returns {void}
   */
  static registerService(service: SimpleCloudEventV1Service): void {
    if (DiscoveryService.servicesMap[service.name]) {
      throw new Error(`Service ${service.name} is already registered`);
    }
    DiscoveryService.servicesMap[service.name] = {
      url: `/services/${service.name}`,
      ...service,
      specversions: ["1.0"],
      protocols: ["http"],
      subscriptionurl: "/subscriptions",
      events: service.events.map(e => {
        if (typeof e === "string") {
          return {
            type: e
          };
        }
        return e;
      })
    };
  }

  /**
   * Retrieve all services
   * @returns {CloudEventV1Service[]} array of services
   */
  static getServices(): CloudEventV1Service[] {
    return this.searchService();
  }

  /**
   * Remove a service
   *
   * @param id
   */
  static deleteService(id: string) {
    if (DiscoveryService.servicesMap[id]) {
      delete DiscoveryService.servicesMap[id];
    }
  }

  /**
   * Search for a service
   * @param {string} term to search for, case insensitive
   * @returns {CloudEventV1Service[]} array of filtered services
   */
  static searchService(term = ""): CloudEventV1Service[] {
    //
    const searchTerm = term.toLowerCase();
    return Object.keys(DiscoveryService.servicesMap)
      .filter(k => term === "" || k.toLowerCase().includes(searchTerm))
      .map(k => DiscoveryService.servicesMap[k]);
  }

  /**
   * Express handler
   *
   * You can add it
   *
   * @param {Object} app Your express app
   * @param {string} prefix Prefix for all discovery url
   * @param {Object} permissions Callback to implement CloudEvent permissions
   * @returns {void}
   */
  static express(
    app: { get: (path: string | RegExp, handler: RequestHandler) => void },
    prefix = "",
    permissions: (name: string, type: "Service" | "Type", req: unknown) => boolean = () => true
  ): void {
    /**
     * Based on the spec
     * Note: for each query if the client is not authorized to see any particular
     * entity then that entity MUST be excluded from the response.
     *
     * Therefore we filter events from service as they are an entity
     *
     * TODO Need to confirm this with the group
     * @param {CloudEventV1Service} object a service object
     * @param {Record<string, unknown>} req a request object
     * @returns {CloudEventV1Service} services
     */
    const filterTypes = (object: CloudEventV1Service, req: unknown) => ({
      ...object,
      types: object.events.filter(event => permissions(event.type, "Type", req))
    });
    // Implement services listing
    app.get(`${prefix}/services`, (req, res) => {
      const term = req.query.matching || "";
      res.status(200).json(
        DiscoveryService.searchService(term)
          .filter(service => permissions(service.name, "Service", req))
          .map(service => filterTypes(service, req))
      );
      res.end();
    });
    app.get(new RegExp(`${prefix}/services/.+`), (req, res) => {
      const name = req.url.substr(prefix.length + "/services/".length);
      if (
        // Non existing service
        !DiscoveryService.servicesMap[name] ||
        // User does not have permission
        !permissions(name, "Service", req)
      ) {
        res.status(404).end();
        return;
      }
      res.status(200).json(filterTypes(DiscoveryService.servicesMap[name], req));
    });
  }
}
