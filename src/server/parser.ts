export interface SchemaField {
  name: string;
  type: string;
  length?: number;
  modifiers: string[];
  foreignKey?: { table: string; column: string };
  line: number;
  character: number;
}

export interface SchemaRelation {
  type: string;
  model: string;
  foreignKey?: string;
  inferred?: boolean;
  line: number;
  character: number;
}

export interface SchemaModel {
  name: string;
  table?: string;
  fields: SchemaField[];
  relations: SchemaRelation[];
  line: number;
  character: number;
}

export interface ParsedSchema {
  models: SchemaModel[];
  errors: SchemaError[];
  isJadeFile: boolean;
}

export interface SchemaError {
  message: string;
  line: number;
  character: number;
  severity: "error" | "warning" | "information";
  length?: number;
}

function singularize(word: string): string {
  if (word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.endsWith("ses") || word.endsWith("xes") || word.endsWith("zes"))
    return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss"))
    return word.slice(0, -1);
  return word;
}

function pluralize(word: string): string {
  if (word.endsWith("y") && !/[aeiou]y$/.test(word))
    return word.slice(0, -1) + "ies";
  if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z"))
    return word + "es";
  return word + "s";
}

const FK_TYPES = ["Integer", "BigInt", "UUID", "CUID", "NanoID"];

export class SchemaParser {
  private content: string;
  private lines: string[];
  private models: SchemaModel[] = [];
  private errors: SchemaError[] = [];
  private braceDepth: number = 0;
  private currentModel: SchemaModel | null = null;
  private isJadeFile: boolean = false;

  constructor(content: string) {
    this.content = content;
    this.lines = content.split("\n");
  }

  parse(): ParsedSchema {
    this.models = [];
    this.errors = [];
    this.braceDepth = 0;
    this.currentModel = null;
    this.isJadeFile = false;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      this.parseLine(line, i);
    }

    // Post-process: detect _id convention for FK inference
    this.detectForeignKeyCandidates();

    return {
      models: this.models,
      errors: this.errors,
      isJadeFile: this.isJadeFile
    };
  }

  private parseLine(line: string, lineIndex: number): void {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("--")) {
      return;
    }

    // Detect require("jade") to identify Jade files
    if (/require\s*\(\s*["']jade["']\s*\)/.test(trimmed) ||
        /require\s*\(\s*["']jade\.init["']\s*\)/.test(trimmed)) {
      this.isJadeFile = true;
    }

    // Track brace depth for model scope closing
    for (const ch of trimmed) {
      if (ch === '{') this.braceDepth++;
      if (ch === '}') {
        this.braceDepth--;
        // Close model scope when we return to depth 0 or below
        if (this.braceDepth <= 0 && this.currentModel) {
          this.currentModel = null;
          this.braceDepth = 0;
        }
      }
    }

    // Detect Entity("table_name", { ... }) pattern
    const entityMatch = trimmed.match(/Entity\s*\(\s*["'](\w+)["']\s*,\s*\{/);
    if (entityMatch) {
      const tableName = entityMatch[1];
      // Derive model name from table name (singularize roughly)
      const modelName = singularize(tableName).charAt(0).toUpperCase() + singularize(tableName).slice(1);
      const model: SchemaModel = {
        name: modelName,
        table: tableName,
        fields: [],
        relations: [],
        line: lineIndex,
        character: line.indexOf("Entity")
      };
      this.models.push(model);
      this.currentModel = model;
      // Reset brace depth relative to this Entity block
      this.braceDepth = 1;
      return;
    }

    // Detect model definition: ModelName = {
    const modelMatch = trimmed.match(/^(\w+)\s*=\s*\{/);
    if (modelMatch) {
      const modelName = modelMatch[1];
      const model: SchemaModel = {
        name: modelName,
        fields: [],
        relations: [],
        line: lineIndex,
        character: line.indexOf(modelName)
      };
      this.models.push(model);
      this.currentModel = model;
      this.braceDepth = 1;
      return;
    }

    // Detect field/relation definition in current model
    if (this.currentModel) {
      // Detect table assignment
      const tableMatch = trimmed.match(/^table\s*=\s*["'](\w+)["']/);
      if (tableMatch) {
        this.currentModel.table = tableMatch[1];
        return;
      }

      // Detect field: fieldName = jade.Type(...)
      const fieldMatch = trimmed.match(/^(\w+)\s*=\s*jade\.(\w+)\s*\(([^)]*)\)(.*)/);
      if (fieldMatch) {
        const fieldName = fieldMatch[1];
        const fieldType = fieldMatch[2];
        const fieldArgs = fieldMatch[3];
        const modifierText = fieldMatch[4];
        const { modifiers, foreignKey } = this.parseModifiers(modifierText);

        const field: SchemaField = {
          name: fieldName,
          type: fieldType,
          length: fieldArgs ? parseInt(fieldArgs) : undefined,
          modifiers,
          foreignKey,
          line: lineIndex,
          character: line.indexOf(fieldName)
        };

        this.currentModel.fields.push(field);

        // Auto-infer belongsTo from explicit :foreignKey()
        if (field.foreignKey) {
          const targetTable = field.foreignKey.table;
          const targetName = singularize(targetTable);
          const modelName = targetName.charAt(0).toUpperCase() + targetName.slice(1);

          // Avoid duplicate relations
          const exists = this.currentModel.relations.some(
            r => r.type === "belongsTo" && r.foreignKey === field.name
          );
          if (!exists) {
            this.currentModel.relations.push({
              type: "belongsTo",
              model: modelName,
              foreignKey: field.name,
              inferred: true,
              line: lineIndex,
              character: field.character,
            });
          }
        }

        return;
      }

      // Detect relation: { type = "belongsTo", model = "User" }
      const relationMatch = trimmed.match(/\{\s*type\s*=\s*["'](\w+)["']\s*,\s*model\s*=\s*["'](\w+)["']/);
      if (relationMatch) {
        const relation: SchemaRelation = {
          type: relationMatch[1],
          model: relationMatch[2],
          line: lineIndex,
          character: line.indexOf("{")
        };
        this.currentModel.relations.push(relation);
        return;
      }
    }
  }

  private parseModifiers(text: string): { modifiers: string[]; foreignKey?: { table: string; column: string } } {
    const modifiers: string[] = [];
    let foreignKey: { table: string; column: string } | undefined;

    // Match :foreignKey("table", "column") specifically
    const fkMatch = text.match(/:foreignKey\s*\(\s*["'](\w+)["']\s*,\s*["'](\w+)["']\s*\)/);
    if (fkMatch) {
      foreignKey = { table: fkMatch[1], column: fkMatch[2] };
      modifiers.push("foreignKey");
    }

    // Match :modifier() patterns
    const modifierRegex = /:(\w+)\s*\([^)]*\)/g;
    let match;
    while ((match = modifierRegex.exec(text)) !== null) {
      if (!modifiers.includes(match[1])) {
        modifiers.push(match[1]);
      }
    }

    // Match shorthand modifiers
    if (text.includes("!")) {
      modifiers.push("unique");
      modifiers.push("notNull");
    }
    if (text.includes("?")) {
      modifiers.push("nullable");
    }

    return { modifiers, foreignKey };
  }

  /**
   * Detect fields ending in _id that reference existing tables.
   * Called after all lines are parsed.
   */
  private detectForeignKeyCandidates(): void {
    for (const model of this.models) {
      for (const field of model.fields) {
        // Skip if already has explicit :foreignKey
        if (field.foreignKey) continue;
        // Must end with _id
        if (!field.name.endsWith("_id")) continue;
        // Must be a FK-compatible type
        if (!FK_TYPES.includes(field.type)) continue;

        // Infer table: "user_id" -> "users" or model "User"
        const base = field.name.slice(0, -3);
        const tableName = pluralize(base);
        const modelName = base.charAt(0).toUpperCase() + base.slice(1);

        // Check if target exists by table name or model name
        const targetModel = this.models.find(m => m.table === tableName)
          || this.models.find(m => m.name === modelName);
        if (!targetModel) continue;

        // Avoid duplicate relations
        const exists = model.relations.some(
          r => r.type === "belongsTo" && r.foreignKey === field.name
        );
        if (exists) continue;

        model.relations.push({
          type: "belongsTo",
          model: targetModel.name,
          foreignKey: field.name,
          inferred: true,
          line: field.line,
          character: field.character,
        });
      }
    }
  }

  getModelAtLine(line: number): SchemaModel | undefined {
    return this.models.find(
      m => m.line === line
    );
  }

  getFieldAtLine(line: number): { model: SchemaModel; field: SchemaField } | undefined {
    for (const model of this.models) {
      const field = model.fields.find(f => f.line === line);
      if (field) {
        return { model, field };
      }
    }
    return undefined;
  }

  findModelByName(name: string): SchemaModel | undefined {
    return this.models.find(m => m.name === name);
  }

  findModelByTable(table: string): SchemaModel | undefined {
    return this.models.find(m => m.table === table);
  }
}
