const { JsonSchema, Schema, Instance } = require("@hyperjump/json-schema-core");
const { isObject } = require("../common");


const compile = async (schema, ast) => {
  let propertyNames;
  try {
    const properties = await Schema.sibling("properties", schema);
    propertyNames = Object.keys(Schema.value(properties));
  } catch (error) {
    propertyNames = [];
  }

  let propertyPatterns;
  try {
    const patternProperties = await Schema.sibling("patternProperties", schema);
    propertyPatterns = Object.keys(Schema.value(patternProperties))
      .map((pattern) => new RegExp(pattern));
  } catch (error) {
    propertyPatterns = [];
  }

  const value = Schema.value(schema);
  if (typeof value === "boolean") {
    return [propertyNames, propertyPatterns, value];
  } else {
    return [propertyNames, propertyPatterns, await JsonSchema.compileSchema(schema, ast)];
  }
};

const interpret = ([propertyNames, propertyPatterns, additionalProperties], instance, ast) => {
  const value = Instance.value(instance);

  if (!isObject(value)) {
    return true;
  }

  const properties = Instance.entries(instance)
    .filter(([propertyName]) => !propertyNames.includes(propertyName) && !propertyPatterns.some((pattern) => pattern.test(propertyName)));

  if (typeof additionalProperties === "string") {
    return properties.every(([, property]) => JsonSchema.interpretSchema(additionalProperties, property, ast));
  } else {
    return properties.length === 0 || additionalProperties;
  }
};

module.exports = { compile, interpret };