const acorn = require("acorn");

const MAX_PLAYER_CONFIG_LENGTH = 2_000_000;
const UNSUPPORTED_VALUE = Symbol("unsupported-value");

const getStaticKey = (property) => {
  if (!property.computed && property.key.type === "Identifier") {
    return property.key.name;
  }

  if (property.key.type === "Literal") {
    return String(property.key.value);
  }

  return null;
};

const getStaticValue = (node) => {
  if (!node) return null;

  if (node.type === "Literal") {
    if (
      node.value === null ||
      ["string", "number", "boolean"].includes(typeof node.value)
    ) {
      return node.value;
    }

    return UNSUPPORTED_VALUE;
  }

  if (node.type === "TemplateLiteral" && node.expressions.length === 0) {
    return node.quasis[0].value.cooked;
  }

  if (
    node.type === "UnaryExpression" &&
    ["-", "+", "!"].includes(node.operator)
  ) {
    const value = getStaticValue(node.argument);

    if (typeof value === "number" && node.operator === "-") return -value;
    if (typeof value === "number" && node.operator === "+") return value;
    if (node.operator === "!") return !value;

    return UNSUPPORTED_VALUE;
  }

  if (node.type === "ArrayExpression") {
    return node.elements.map((element) => {
      const value = getStaticValue(element);
      return value === UNSUPPORTED_VALUE ? null : value;
    });
  }

  if (node.type === "ObjectExpression") {
    const result = Object.create(null);

    node.properties.forEach((property) => {
      if (property.type !== "Property" || property.kind !== "init") return;

      const key = getStaticKey(property);
      const value = getStaticValue(property.value);

      if (key && value !== UNSUPPORTED_VALUE) {
        result[key] = value;
      }
    });

    return result;
  }

  return UNSUPPORTED_VALUE;
};

const parsePlayerConfig = (configLiteral) => {
  try {
    if (!configLiteral || configLiteral.length > MAX_PLAYER_CONFIG_LENGTH) {
      return null;
    }

    const parsed = acorn.parse(`(${configLiteral})`, {
      ecmaVersion: "latest",
      sourceType: "script",
    });
    const expression = parsed.body[0]?.expression;

    if (expression?.type !== "ObjectExpression") return null;

    return getStaticValue(expression);
  } catch (err) {
    console.error("Failed to parse player config:", err.message);
    return null;
  }
};

module.exports = {
  parsePlayerConfig,
};
