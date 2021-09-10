import { CloudEvent } from "cloudevents";
import { Filter, PrefixFilter, AllFilter, SuffixFilter, ExactFilter, AnyFilter, SqlFilter } from "../subscription";
import { CESQLParserLexer } from "./sql/CESQLParserLexer";
import {
  AtomContext,
  AtomExpressionContext,
  BinaryAdditiveExpressionContext,
  BinaryComparisonExpressionContext,
  BinaryLogicExpressionContext,
  BinaryMultiplicativeExpressionContext,
  BooleanAtomContext,
  BooleanLiteralContext,
  CesqlContext,
  CESQLParserParser,
  ExistsExpressionContext,
  ExpressionContext,
  FunctionIdentifierContext,
  FunctionInvocationExpressionContext,
  FunctionParameterListContext,
  IdentifierAtomContext,
  IdentifierContext,
  InExpressionContext,
  IntegerAtomContext,
  IntegerLiteralContext,
  LikeExpressionContext,
  SetExpressionContext,
  StringAtomContext,
  StringLiteralContext,
  SubExpressionContext,
  UnaryLogicExpressionContext,
  UnaryNumericExpressionContext
} from "./sql/CESQLParserParser";
import { ANTLRInputStream, CommonTokenStream } from "antlr4ts";
import { AbstractParseTreeVisitor } from "antlr4ts/tree/AbstractParseTreeVisitor";
import { CESQLParserVisitor } from "./sql/CESQLParserVisitor";
// @ts-ignore
import * as RegexEscape from "regex-escape";

//import { SqlFilterImplementation } from "./sql/sql";
/**
 * Implementation of a defined filter
 */
export abstract class FilterImplementation<T extends Filter = Filter> {
  /**
   * Definition from the spec
   */
  definition: T;
  constructor(definition: T) {
    this.definition = definition;
  }

  /**
   * Return true if it match the filter, false otherwise
   *
   * @param event to filter
   */
  abstract match(event: CloudEvent): boolean;
}

/**
 * Abstract class to read CloudEvent specified property
 */
export abstract class StringPropertyFilterImplementation<T extends Filter> extends FilterImplementation<T> {
  /**
   * Property to read event from
   */
  property: string;
  /**
   * Filter property to read from
   */
  filterProperty: string;
  constructor(definition: T, filterProperty: string) {
    super(definition);
    this.filterProperty = filterProperty;
    // @ts-ignore
    if (Object.keys(definition[filterProperty]).length !== 1) {
      throw new Error("Filter only accept one property filtering");
    }
    // @ts-ignore
    this.property = Object.keys(definition[filterProperty]).pop();
  }

  /**
   * @override
   */
  match(event: CloudEvent): boolean {
    let value: string = <string>event[this.property];
    if (!event[this.property] || typeof value !== "string") {
      return false;
    }
    // @ts-ignore
    return this.matchString(value, this.definition[this.filterProperty][this.property]);
  }

  /**
   * Verify if value match the condition
   *
   * @param value from the CloudEvent
   * @param condition from the filter definition
   */
  abstract matchString(value: string, condition: string): boolean;
}

/**
 * Use of this MUST include exactly one nested property, where the key is the name of the
 * CloudEvents attribute to be matched, and its value is the String value to use in the comparison.
 * To evaluate to true the value of the matching CloudEvents attribute MUST start with the value
 * String specified (case sensitive).
 */
export class PrefixFilterImplementation extends StringPropertyFilterImplementation<PrefixFilter> {
  constructor(definition: PrefixFilter) {
    super(definition, "prefix");
  }

  /**
   * @override
   */
  matchString(value: string, condition: string) {
    return value.startsWith(condition);
  }
}

/**
 * Use of this MUST include exactly one nested property, where the key is the name of the
 * CloudEvents attribute to be matched, and its value is the String value to use in the comparison.
 * To evaluate to true the value of the matching CloudEvents attribute MUST end with the value
 * String specified (case sensitive).
 */
export class SuffixFilterImplementation extends StringPropertyFilterImplementation<SuffixFilter> {
  constructor(definition: SuffixFilter) {
    super(definition, "suffix");
  }

  /**
   * @override
   */
  matchString(value: string, condition: string) {
    return value.endsWith(condition);
  }
}

/**
 * Use of this MUST include exactly one nested property, where the key is the name of the CloudEvents
 * attribute to be matched, and its value is the String value to use in the comparison. To evaluate
 * to true the value of the matching CloudEvents attribute MUST exactly match the value String
 * specified (case sensitive).
 */
export class ExactFilterImplementation extends StringPropertyFilterImplementation<ExactFilter> {
  constructor(definition: ExactFilter) {
    super(definition, "exact");
  }

  /**
   * @override
   */
  matchString(value: string, condition: string) {
    return value === condition;
  }
}

/**
 * Use of this MUST include a nested array of filter expressions, where all nested filter
 * expressions MUST evaluate to true in order for the all filter expression to be true.
 *
 * Note: there MUST be at least one filter expression in the array.
 */
export class AllFilterImplementation extends FilterImplementation<AllFilter> {
  /**
   * @override
   */
  match(event: CloudEvent): boolean {
    for (let filter of this.definition.all) {
      if (!FiltersHelper.get(filter).match(event)) {
        return false;
      }
    }
    return true;
  }
}

/**
 * Use of this MUST include one nested array of filter expressions, where at least one nested
 * filter expressions MUST evaluate to true in order for the any filter expression to be true.
 *
 * Note: there MUST be at least one filter expression in the array.
 */
export class AnyFilterImplementation extends FilterImplementation<AnyFilter> {
  /**
   * @override
   */
  match(event: CloudEvent): boolean {
    for (let filter of this.definition.any) {
      if (FiltersHelper.get(filter).match(event)) {
        return true;
      }
    }
    return false;
  }
}

interface FilterImplementationConstructor {
  new (definition: any): FilterImplementation;
}

const functions: { [key: string]: (...args: any[]) => any } = {
  ABS: (...args: number[]) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return Math.abs(args[0]);
  },
  LENGTH: (...args: string[]) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return args[0].length;
  },
  CONCAT: (...args: string[]) => {
    return args.join("");
  },
  CONCAT_WS: (...args: string[]) => {
    let merger = args.shift();
    return args.join(merger);
  },
  LOWER: (...args: string[]) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return args[0].toLowerCase();
  },
  UPPER: (...args: string[]) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return args[0].toUpperCase();
  },
  TRIM: (...args: string[]) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return args[0].trim();
  },
  LEFT: (...args: any[]) => {
    if (args.length !== 2) {
      throw new Error("Wrong arguments count");
    }
    return args[0].substr(0, args[1]);
  },
  RIGHT: (...args: any[]) => {
    if (args.length !== 2) {
      throw new Error("Wrong arguments count");
    }
    return args[0].substr(args[0].length - args[1]);
  },
  SUBSTRING: (...args: any[]) => {
    if (args.length > 3 || args.length < 2) {
      throw new Error("Wrong arguments count");
    }
    return args[0].substring(args[1], args[2]);
  },
  INT: (...args: any[]) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    switch (typeof args[0]) {
      case "number":
        return args[0];
      case "string":
        let res = Number.parseInt(args[0]);
        if (!Number.isNaN(res)) {
          return res;
        }
    }
    return 0;
  },
  BOOL: (...args) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    if (typeof args[0] === "string") {
      return args[0].toLowerCase() === "true";
    } else if (typeof args[0] === "boolean") {
      return args[0];
    }
    return false;
  },
  STRING: (...args) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    if (typeof args[0] === "boolean") {
      return args[0].toString().toUpperCase();
    }
    return args[0].toString();
  },
  IS_BOOL: (...args) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return typeof args[0] === "boolean";
  },
  IS_INT: (...args) => {
    if (args.length > 1) {
      throw new Error("Too many arguments");
    }
    return typeof args[0] === "number";
  }
};

class CESQLVisitor extends AbstractParseTreeVisitor<any> implements CESQLParserVisitor<any> {
  event: CloudEvent;
  constructor(event: CloudEvent) {
    super();
    this.event = event;
  }
  protected defaultResult() {
    return true;
  }

  visitFunctionInvocationExpression(ctx: FunctionInvocationExpressionContext): boolean {
    let args = this.getChildrenResults(ctx);
    let fct = args.shift();
    return functions[fct](...args[0]);
  }

  visitUnaryLogicExpression(ctx: UnaryLogicExpressionContext): boolean {
    // @ts-ignore
    return !this.visit(ctx.children[1]);
  }

  visitUnaryNumericExpression(ctx: UnaryNumericExpressionContext): number {
    // @ts-ignore
    return -1 * this.visit(ctx.children[1]);
  }

  visitLikeExpression(ctx: LikeExpressionContext): boolean {
    this.debugContext(ctx, "likeExpression");
    let results = this.getChildrenResults(ctx);
    let regexp = RegexEscape(results.pop());
    regexp = regexp.replace(/([^\\])%/g, "$1.*").replace(/([^\\])_/g, "$1.?");
    // NOT LIKE
    if (ctx.childCount === 4) {
      return new RegExp(regexp).exec(results[0]) === null;
    }
    // LIKE
    return new RegExp(regexp).exec(results[0]) !== null;
  }

  visitExistsExpression(ctx: ExistsExpressionContext): boolean {
    let property = ctx.children?.pop();
    // @ts-ignore
    return this.event[property.text] !== undefined;
  }

  visitInExpression(ctx: InExpressionContext): boolean {
    let results = this.getChildrenResults(ctx);
    if (ctx.childCount === 4) {
      return !results[3].includes(results[0]);
    }
    return results[2].includes(results[0]);
  }

  visitBinaryMultiplicativeExpression(ctx: BinaryMultiplicativeExpressionContext): number {
    let results = this.getChildrenResults(ctx);
    // @ts-ignore0
    let operator = ctx.children[1].text;
    switch (operator) {
      case "*":
        return results[0] * results[2];
      case "/":
        return results[0] / results[2];
      case "%":
        return results[0] % results[2];
    }
    /* istanbul ignore next */
    throw new Error("Not implemented");
  }

  visitBinaryAdditiveExpression(ctx: BinaryAdditiveExpressionContext): number | boolean {
    // @ts-ignore
    const [left, op, right] = ctx.children;
    return this.visit(left) + this.visit(right) * (op.text === "+" ? 1 : -1);
  }

  /* istanbul ignore next */
  debugContext(ctx: any, topic: string) {
    console.log(
      topic,
      ctx.children?.map((c: any) => `${c.text}_${c.constructor.name}`)
    );
  }

  getChildrenResults(ctx: any) {
    return ctx.children.map((c: any) => this.visit(c));
  }

  visitBinaryComparisonExpression(ctx: BinaryComparisonExpressionContext): boolean {
    let results = this.getChildrenResults(ctx);
    // @ts-ignore
    let operator = ctx.children[1].text;
    switch (operator) {
      case ">":
        return results[0] > results[2];
      case "<":
        return results[0] < results[2];
      case ">=":
        return results[0] >= results[2];
      case "<=":
        return results[0] <= results[2];
      case "!=":
        return results[0] != results[2];
      case "=":
        return results[0] == results[2];
    }
    /* istanbul ignore next */
    throw new Error("Not implemented");
  }

  visitBinaryLogicExpression(ctx: BinaryLogicExpressionContext): boolean {
    let results = this.getChildrenResults(ctx);
    // @ts-ignore
    let operator = ctx.children[1].text;
    switch (operator) {
      case "OR":
        return results[0] || results[2];
      case "XOR":
        return results[0] ? !results[2] : results[2];
      case "AND":
        return results[0] && results[2];
    }
    /* istanbul ignore next */
    throw new Error("Not implemented");
  }

  aggregateResult(previous: any, current: any) {
    return previous && current;
  }

  visitIdentifier(ctx: IdentifierContext): any {
    return this.event[ctx.text] ?? "";
  }

  visitFunctionIdentifier(ctx: FunctionIdentifierContext): string {
    if (!functions[ctx.text]) {
      throw new Error(`Unknown function: '${ctx.text}'`);
    }
    return ctx.text;
  }

  visitBooleanLiteral(ctx: BooleanLiteralContext): boolean {
    return ctx.text === "TRUE";
  }

  visitStringLiteral(ctx: StringLiteralContext): string {
    // Remove quotes
    return ctx.text.substr(1, ctx.text.length - 2);
  }

  visitIntegerLiteral(ctx: IntegerLiteralContext): number {
    return Number(ctx.text);
  }

  visitFunctionParameterList(ctx: FunctionParameterListContext): any[] {
    // Only take the odd part LBRACKET exp1 COMMA exp2 RBRACKET
    return this.getChildrenResults(ctx).filter((_: any, i: number) => i % 2);
  }

  visitSetExpression(ctx: SetExpressionContext): any[] {
    // Only take the odd part LBRACKET exp1 COMMA exp2 RBRACKET
    return this.getChildrenResults(ctx).filter((_: any, i: number) => i % 2);
  }
}

export class SqlFilterImplementation extends FilterImplementation<SqlFilter> {
  lexer: CESQLParserLexer;
  tree: any;
  constructor(definition: SqlFilter) {
    super(definition);
    this.lexer = new CESQLParserLexer(new ANTLRInputStream(definition.sql));
    let tokenStream = new CommonTokenStream(this.lexer);
    let parser = new CESQLParserParser(tokenStream);

    // Parse the input, where `compilationUnit` is whatever entry point you defined
    this.tree = parser.cesql();

    // @ts-ignore
    //ParseTreeWalker.DEFAULT.walk(new CESQLListener(), tree);
  }

  match(event: CloudEvent): boolean {
    return new CESQLVisitor(event).visit(this.tree);
  }
}

/**
 * Filter Implementation registry
 */
const FilterImplementations: { [key: string]: FilterImplementationConstructor } = {
  exact: ExactFilterImplementation,
  prefix: PrefixFilterImplementation,
  suffix: SuffixFilterImplementation,
  all: AllFilterImplementation,
  any: AnyFilterImplementation,
  sql: SqlFilterImplementation
};

/**
 * Retrieve an FilterImplementation object based on the
 * definition
 */
export class FiltersHelper {
  static get(filter: Filter): FilterImplementation {
    let type = Object.keys(filter).pop();
    if (type === undefined || !FilterImplementations[type]) {
      throw new Error(`Unsupported filter type '${type}'`);
    }
    return new FilterImplementations[type](filter);
  }
}
