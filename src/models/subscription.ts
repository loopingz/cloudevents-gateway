import { CoreModel, Context } from "@webda/core";
import { CloudEvent, CloudEventV1 } from "cloudevents";
import { FiltersHelper } from "./filters";

/**
 * For HTTP, the following settings properties SHOULD be supported by all implementations.
 */
export interface HttpSettings {
  /**
   * A set of key/value pairs that is copied into the HTTP request as custom headers.
   */
  headers?: { [key: string]: string };
  /**
   * The HTTP method to use for sending the message. This defaults to POST if not set.
   */
  method?: "POST" | "PUT";
}

/**
 * All implementations that support MQTT MUST support the topicname settings.
 * All other settings SHOULD be supported.
 */
export interface MQTTSettings {
  /**
   * The name of the MQTT topic to publish to.
   */
  topicname: string;
  /**
   * MQTT quality of service (QoS) level: 0 (at most once), 1 (at least once), or 2 (exactly once).
   * This defaults to 1 if not set.
   *
   * @default 1
   */
  qos?: number;
  /**
   * MQTT retain flag: true/false. This defaults to false if not set.
   *
   * @default false
   */
  retain?: boolean;
  /**
   * MQTT expiry interval, in seconds. This value has no default value and the message will not expire
   * if the setting is absent. This setting only applies to MQTT 5.0.
   */
  expiry?: number;
  /**
   * A set of key/value pairs that are copied into the MQTT PUBLISH packet's user property section.
   * This setting only applies to MQTT 5.0.
   */
  userproperties?: { [key: string]: string };
}

/**
 * For AMQP, the address property MUST be supported by all implementations and other settings
 * properties SHOULD be supported by all implementations.
 */
export interface AMQPSettings {
  /**
   * The link target node in the AMQP container identified by the sink URI, if not expressed in the
   * sink URI's path portion.
   */
  address?: string;
  /**
   * Name to use for the AMQP link. If not set, a random link name is used.
   */
  linkname?: string;
  /**
   * Allows to control the sender's settlement mode, which determines whether transfers are performed
   * "settled" (without acknowledgement) or "unsettled" (with acknowledgement).
   *
   * @default "unsettled"
   */
  sendersettlementmode?: "settled" | "unsettled";
  /**
   * A set of key/value pairs that are copied into link properties for the send link.
   */
  linkproperties?: { [key: string]: string };
}

/**
 * All implementations that support Apache Kafka MUST support the topicname settings.
 * All other settings SHOULD be supported.
 */
export interface KafkaSettings {
  /**
   * The name of the Kafka topic to publish to.
   */
  topicname?: string;
  /**
   * A partition key extractor expression per the CloudEvents Kafka transport binding specification.
   */
  partitionkeyextractor?: string;
  /**
   *
   */
  clientid?: string;
  /**
   *
   */
  acks?: string;
}

export interface NATSSettings {
  /**
   * The name of the NATS subject to publish to.
   */
  subject: string;
}

/**
 * Representation of subscription filtering
 */
export interface Filter {}

/**
 * Use of this MUST include one nested filter expression, where the result of this
 * filter expression is the inverse of the result of the nested expression. In other words,
 * if the nested expression evaluated to true, then the not filter expression's result is false.
 */
export interface NotFilter {
  not: Filter;
}

/**
 * Use of this MUST include one nested array of filter expressions, where at least one nested
 * filter expressions MUST evaluate to true in order for the any filter expression to be true.
 */
export interface AnyFilter {
  any: Filter[];
}

/**
 * Use of this MUST include a nested array of filter expressions, where all nested filter
 * expressions MUST evaluate to true in order for the all filter expression to be true.
 *
 * Note: there MUST be at least one filter expression in the array.
 */
export interface AllFilter {
  all: Filter[];
}

type CloudEventProperty = keyof CloudEventV1;

/**
 * Use of this MUST include exactly one nested property, where the key is the name of the
 * CloudEvents attribute to be matched, and its value is the String value to use in the comparison.
 * To evaluate to true the value of the matching CloudEvents attribute MUST exactly match the value
 * String specified (case sensitive).
 *
 * The attribute name and value specified in the filter express MUST NOT be empty strings.
 */
export interface ExactFilter {
  exact: {
    [key: string]: string;
  };
}

/**
 * Use of this MUST include exactly one nested property, where the key is the name of the CloudEvents
 * attribute to be matched, and its value is the String value to use in the comparison.
 * To evaluate to true the value of the matching CloudEvents attribute MUST start with the value
 * String specified (case sensitive).
 *
 * The attribute name and value specified in the filter express MUST NOT be empty strings.
 */
export interface PrefixFilter {
  prefix: {
    [key: string]: string;
  };
}

/**
 * Use of this MUST include exactly one nested property, where the key is the name of the CloudEvents
 * attribute to be matched, and its value is the String value to use in the comparison.
 * To evaluate to true the value of the matching CloudEvents attribute MUST end with the value
 * String specified (case sensitive).
 *
 * The attribute name and value specified in the filter express MUST NOT be empty strings.
 *
 */ export interface SuffixFilter {
  suffix: {
    [key: string]: string;
  };
}

/**
 * Use of this MUST have a string value, representing a CloudEvents SQL Expression.
 * The filter result MUST be true if the result value of the expression, coerced to boolean,
 * equals to the TRUE boolean value, otherwise MUST be false if an error occurred while
 * evaluating the expression or if the result value, coerced to boolean, equals to the FALSE
 * boolean value.
 *
 * Implementations SHOULD reject subscriptions with invalid CloudEvents SQL expressions.
 */
export interface SqlFilter {
  sql: string;
}

/**
 * A subscription manager manages a collection of subscriptions. The upper limit on how many
 * subscriptions are supported is implementation specific.
 *
 * To help explain the subscription resource, the following non-normative pseudo json shows its
 * basic structure:
 *
 */
export default class Subscription extends CoreModel {
  id: string = "";
  /**
   * Indicates the source to which the subscription is related. When present on a subscribe request,
   * all events generated due to this subscription MUST have a CloudEvents source property that
   * matches this value. If this property is not present on a subscribe request then there are no
   * constraints placed on the CloudEvents source property for the events generated.
   *
   * If present, MUST be a non-empty URI
   */
  source?: string;
  /**
   * Indicates which types of events the subscriber is interested in receiving. When present on a
   * subscribe request, all events generated due to this subscription MUST have a CloudEvents type
   * property that matches one of these values.
   *
   * If present, any value present MUST a non-empty string
   *
   * @example com.github.pull_request.opened
   * @example com.example.object.deleted
   */
  types?: string[];
  /**
   * A set of key/value pairs that modify the configuration of of the subscription related to the
   * event generation process. While this specification places no constraints on the data type of
   * the map values. When there is a Discovery Enpoint Service definition defined for the subscription
   * manager, then the key MUST be one of the subscriptionconfig keys specified in the Discovery
   * Endpoint Service definition. The value MUST conform to the data type specified by the value in
   * the subscriptionconfig entry for the key
   *
   * If present, any "key" used in the map MUST be a non-empty string
   */
  config?: { [key: string]: string };
  /**
   * Identifier of a delivery protocol. Because of WebSocket tunneling options for AMQP, MQTT and
   * other protocols, the URI scheme is not sufficient to identify the protocol. The protocols with
   * existing CloudEvents bindings are identified as AMQP, MQTT3, MQTT5, HTTP, KAFKA, and NATS.
   * An implementation MAY add support for further protocols.
   *
   * Value comparisons are case sensitive.
   */
  protocol: "HTTP" = "HTTP";
  /**
   * A set of settings specific to the selected delivery protocol provider. Options for these
   * settings are listed in the following subsection. An subscription manager MAY offer more options.
   * See the Protocol Settings section for future details.
   */
  protocolsettings?: HttpSettings | MQTTSettings | AMQPSettings | KafkaSettings | NATSSettings = {};
  /**
   * The address to which events MUST be sent. The format of the address MUST be valid for the
   * protocol specified in the protocol property, or one of the protocol's own transport bindings
   * (e.g. AMQP over WebSockets).
   *
   * @required
   */
  sink: string = "";
  /**
   * An array of filter expressions that evaluates to true or false. If any filter expression in the
   * array evaluates to false, the event MUST NOT be sent to the sink. If all the filter expressions
   * in the array evaluates to true, the event MUST be attempted to be delivered. Absence of a filter
   * or empty array implies a value of true.
   *
   * Each filter dialect MUST have a name that is unique within the scope of the subscription manager.
   * Each dialect will define the semantics and syntax of the filter expression language. See the
   * Filters section for more information.
   *
   * If a subscription manager does not support filters, or the filter dialect specified in a
   * subscription request, then it MUST generate an error and reject the subscription create or
   * update request.
   */
  filters: Filter[] = [];

  static getUuidField() {
    return "id";
  }

  async canAccess(ctx: Context) {
    return this;
  }

  match(event: CloudEvent): boolean {
    return FiltersHelper.get({ all: this.filters }).match(event);
  }
}

export { Subscription };
