/**
 * Definition of a CloudEvents Service
 */
export interface CloudEventV1Service {
  /**
   * [REQUIRED] A URL that references this Service. This value MUST
   * be usable in subsequent requests, by authorized clients, to retrieve this
   * Service entity.
   * @required MUST be a non-empty URL
   * @required MUST end with `fsegments` (per RFC1738) of: `/services/{name}` where
   *     `name` is the Service's `name` attribute.
   * @example `http://example.com/services/storage`
   * @example `http://discovery.github.com/services/github`
   */
  url: string;

  /**
   * [REQUIRED] A unique identifier for this Service. This value MUST be unique within the scope of this
   * Discovery Endpoint.
   *
   * @required MUST be a valid `fsegment` per RFC1738.
   * @example storage
   * @example github
   */
  name: string;

  /**
   * [OPTIONAL] Human readable description.
   * If present, MUST be a non-empty string
   */
  description?: string;
  /**
   * Absolute URL that provides a link to additional documentation
   * about the service. This is intended for a developer to
   * use in order to learn more about this service's events produced.
   *
   * If present, MUST be a non-empty absolute URI
   *
   * @example http://cloud.example.com/docs/blobstorage
   */
  docsurl?: string;
  /**
   * [REQUIRED] CloudEvents [`specversions`](https://github.com/cloudevents/spec/blob/master/spec.md#specversion)
   * that can be used for events published for this service.
   *
   * @required MUST be a non-empty array or non-empty strings.
   * @required strings define per [RFC 2046](https://tools.ietf.org/html/rfc2046)
   */
  specversions: string[];
  /**
   * [REQUIRED] An absolute URL indicating where CloudSubscriptions `subscribe`
   * API calls MUST be sent to.
   */
  subscriptionurl: string;
  /**
   * A map indicating supported options for the `config` parameter
   * for the CloudSubscriptions subscribe() API call. Keys are the name of keys
   * in the allowed config map, the values indicate the type of that parameter,
   * confirming to the CloudEvents [type system](https://github.com/cloudevents/spec/blob/master/spec.md#type-system).
   * TODO: Needs resolution with CloudSubscriptions API
   */
  subscriptionconfig?: { [key: string]: string };
  /**
   * Authorization scope needed for creating subscriptions.
   * The actual meaning of this field is determined on a per-service basis.
   * @example storage.read
   */
  authscope?: string;
  /**
   * [REQUIRED] This field describes the different values that might be passed
   * in the `protocol` field of the CloudSubscriptions API. The protocols with
   * existing CloudEvents bindings are identified as AMQP, MQTT3, MQTT5, HTTP,
   * KAFKA, and NATS. An implementation MAY add support for further
   * protocols. All services MUST support at least one delivery protocol, and MAY
   * support additional protocols.
   * @example [ "HTTP" ]
   * @example [ "HTTP", "AMQP", "KAFKA" ]
   */
  protocols: string[];
  /**
   * [REQUIRED] CloudEvent types produced by the service
   */
  events: CloudEventV1Type[];
}

/**
 * Definition of a CloudEvents Type Extension
 */
export interface CloudEventV1TypeExtension {
  /**
   * [REQUIRED] the CloudEvents context attribute name used by this extension.
   * It MUST adhere to the CloudEvents context attrbibute naming rules
   * @example dataref
   */
  name: string;
  /**
   * [REQUIRED] the data type of the extension attribute. It MUST adhere to the
   * CloudEvents [type system](./spec.md#type-system)
   * @example URI-reference
   */
  type: string;
  /**
   * an attribute pointing to the specification that defines the extension
   * @example https://github.com/cloudevents/spec/blob/master/extensions/dataref.md
   */
  specurl?: string;
}

/**
 * Definition of a CloudEvents Type
 */
export interface CloudEventV1Type {
  /**
   * [REQUIRED] CloudEvents
   * [`type`](https://github.com/cloudevents/spec/blob/master/spec.md#type)
   * attribute.
   * @required MUST be a non-empty string, following the constraints as defined in the
   * CloudEvents spec.
   * @example com.github.pull.create
   * @example com.example.object.delete.v2
   */
  type: string;
  /**
   * Human readable description.
   * If present, MUST be a non-empty string
   */
  description?: string;
  /**
   * CloudEvents [`datacontenttype`](https://github.com/cloudevents/spec/blob/master/spec.md#datacontenttype)
   * attribute. Indicating how the `data` attribute of subscribed events will be
   * encoded.
   *
   * If present, MUST adhere to the format specified in [RFC 2046](https://tools.ietf.org/html/rfc2046)
   */
  datacontenttype?: string;
  /**
   * CloudEvents [`datacontenttype`](https://github.com/cloudevents/spec/blob/master/spec.md#dataschema)
   * attribute. This identifies the canonical storage location of the schema of
   * the `data` attribute of subscribed events.
   *
   * If present, MUST be a non-empty URI
   */
  dataschema?: string;
  /**
   * If using `dataschemacontent` for inline schema storage, the
   * `dataschematype` indicates the type of schema represented there.
   *
   * If present, MUST adhere to the format specified in [RFC 2046](https://tools.ietf.org/html/rfc2046)
   * @example application/json
   */
  dataschematype?: string;
  /**
   * An inline representation of the schema of the `data` attribute
   * encoding mechanism. This is an alternative to using the `dataschema`
   * attribute.
   *
   * If present, MUST be a non-empty string containing a schema compatible with
   * the `datacontenttype`.
   * If `dataschama` is present, this field MUST NOT be present.
   */
  dataschemacontent?: string;
  /**
   * An array or CloudEvents
   * [Extension Context Attributes](http://github.com/cloudevents/spec/blob/master/spec.md#extension-context-attributes)
   * that are used for this event `type`.
   */
  extensions?: CloudEventV1TypeExtension[];
}
