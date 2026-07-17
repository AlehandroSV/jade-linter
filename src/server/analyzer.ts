import { SchemaParser, ParsedSchema, SchemaModel, SchemaField, SchemaError } from "./parser";
import { getTypeByName } from "../schema/types";
import { getModifierByName } from "../schema/modifiers";

export interface AnalysisResult {
  schema: ParsedSchema;
  diagnostics: SchemaError[];
}

export class SchemaAnalyzer {
  private parser: SchemaParser;

  constructor(content: string) {
    this.parser = new SchemaParser(content);
  }

  analyze(): AnalysisResult {
    const schema = this.parser.parse();
    const diagnostics: SchemaError[] = [...schema.errors];

    // Validate each model
    for (const model of schema.models) {
      this.validateModel(model, schema, diagnostics);
    }

    return { schema, diagnostics };
  }

  private validateModel(
    model: SchemaModel,
    schema: ParsedSchema,
    diagnostics: SchemaError[]
  ): void {
    // Validate fields
    for (const field of model.fields) {
      this.validateField(field, model, schema, diagnostics);
    }

    // Validate relations
    for (const relation of model.relations) {
      this.validateRelation(relation, model, schema, diagnostics);
    }
  }

  private validateField(
    field: SchemaField,
    model: SchemaModel,
    schema: ParsedSchema,
    diagnostics: SchemaError[]
  ): void {
    // Check if type exists
    const type = getTypeByName(field.type);
    if (!type) {
      diagnostics.push({
        message: `Tipo '${field.type}' não existe. Tipos válidos: Integer, String, Text, Boolean, Timestamp, Date, UUID, CUID, NanoID, Float, Decimal`,
        line: field.line,
        character: field.character,
        severity: "error"
      });
      return;
    }

    // Check if String has length
    if (field.type === "String" && !field.length) {
      diagnostics.push({
        message: "String deve ter tamanho especificado. Ex: jade.String(120)",
        line: field.line,
        character: field.character,
        severity: "warning"
      });
    }

    // Check modifiers
    for (const modifier of field.modifiers) {
      const mod = getModifierByName(modifier);
      if (!mod) {
        diagnostics.push({
          message: `Modificador '${modifier}' não existe`,
          line: field.line,
          character: field.character,
          severity: "error"
        });
      }
    }

    // Info: Primary key auto
    if (field.name === "id" && field.type === "Integer") {
      diagnostics.push({
        message: "Campo 'id' é Primary Key automático",
        line: field.line,
        character: field.character,
        severity: "information"
      });
    }

    // Warning: created_at without defaultNow
    if (field.name === "created_at" && field.type === "Timestamp") {
      if (!field.modifiers.includes("default")) {
        diagnostics.push({
          message: "Campo 'created_at' deveria ter defaultNow()",
          line: field.line,
          character: field.character,
          severity: "warning"
        });
      }
    }
  }

  private validateRelation(
    relation: SchemaRelation,
    model: SchemaModel,
    schema: ParsedSchema,
    diagnostics: SchemaError[]
  ): void {
    // Check if referenced model exists
    const referencedModel = schema.models.find(m => m.name === relation.model);
    if (!referencedModel) {
      diagnostics.push({
        message: `Model '${relation.model}' não existe`,
        line: relation.line,
        character: relation.character,
        severity: "error"
      });
    }

    // Check relation type
    const validRelationTypes = ["belongsTo", "hasMany", "hasOne", "hasAndBelongsToMany"];
    if (!validRelationTypes.includes(relation.type)) {
      diagnostics.push({
        message: `Tipo de relation '${relation.type}' não existe. Tipos válidos: belongsTo, hasMany, hasOne, hasAndBelongsToMany`,
        line: relation.line,
        character: relation.character,
        severity: "error"
      });
    }
  }

  getModelAtLine(line: number): SchemaModel | undefined {
    return this.parser.getModelAtLine(line);
  }

  getFieldAtLine(line: number): { model: SchemaModel; field: SchemaField } | undefined {
    return this.parser.getFieldAtLine(line);
  }

  findModelByName(name: string): SchemaModel | undefined {
    return this.parser.findModelByName(name);
  }

  findModelByTable(table: string): SchemaModel | undefined {
    return this.parser.findModelByTable(table);
  }

  getAllModels(): SchemaModel[] {
    return this.parser.parse().models;
  }
}

interface SchemaRelation {
  type: string;
  model: string;
  foreignKey?: string;
  line: number;
  character: number;
}
