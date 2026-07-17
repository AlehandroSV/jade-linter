import { CompletionItem, CompletionItemKind, InsertTextFormat } from "vscode-languageserver";
import { SchemaAnalyzer } from "./analyzer";
import { JADE_TYPES, getTypeNames } from "../schema/types";
import { JADE_MODIFIERS, SHORTHAND_MODIFIERS } from "../schema/modifiers";

export class CompletionProvider {
  private analyzer: SchemaAnalyzer;

  constructor(analyzer: SchemaAnalyzer) {
    this.analyzer = analyzer;
  }

  getCompletions(line: string, character: number): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Check context
    if (this.isAfterJade(line, character)) {
      items.push(...this.getTypeCompletions());
    } else if (this.isAfterType(line, character)) {
      items.push(...this.getModifierCompletions());
    } else if (this.isInForeignKey(line, character)) {
      items.push(...this.getModelNameCompletions());
    } else if (this.isInRelations(line, character)) {
      items.push(...this.getRelationTypeCompletions());
    } else {
      items.push(...this.getGeneralCompletions());
    }

    return items;
  }

  private isAfterJade(line: string, character: number): boolean {
    const beforeCursor = line.substring(0, character);
    return /jade\.$/.test(beforeCursor);
  }

  private isAfterType(line: string, character: number): boolean {
    const beforeCursor = line.substring(0, character);
    return /jade\.\w+\(\)\s*\./.test(beforeCursor);
  }

  private isInForeignKey(line: string, character: number): boolean {
    const beforeCursor = line.substring(0, character);
    return /foreignKey\(\s*["']/.test(beforeCursor);
  }

  private isInRelations(line: string, character: number): boolean {
    const beforeCursor = line.substring(0, character);
    return /type\s*=\s*["']$/.test(beforeCursor);
  }

  private getTypeCompletions(): CompletionItem[] {
    return JADE_TYPES.map(type => {
      const item: CompletionItem = {
        label: type.name,
        kind: CompletionItemKind.Class,
        detail: type.description,
        documentation: `SQL: ${type.sqlType}`
      };

      if (type.hasLength) {
        item.insertText = `${type.name}(\${1:${type.defaultLength || 255}})`;
        item.insertTextFormat = InsertTextFormat.Snippet;
      } else {
        item.insertText = `${type.name}()`;
        item.insertTextFormat = InsertTextFormat.Snippet;
      }

      return item;
    });
  }

  private getModifierCompletions(): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Add shorthand modifiers
    SHORTHAND_MODIFIERS.forEach(shorthand => {
      items.push({
        label: shorthand.symbol,
        kind: CompletionItemKind.Operator,
        detail: shorthand.description,
        documentation: `Expands to: ${shorthand.expandsTo.join(", ")}`
      });
    });

    // Add full modifiers
    JADE_MODIFIERS.forEach(modifier => {
      const item: CompletionItem = {
        label: `:${modifier.name}`,
        kind: CompletionItemKind.Method,
        detail: modifier.description
      };

      if (modifier.hasParams && modifier.paramNames) {
        const params = modifier.paramNames
          .map((p, i) => `\${${i + 1}:${p}}`)
          .join(", ");
        item.insertText = `:${modifier.name}(${params})`;
        item.insertTextFormat = InsertTextFormat.Snippet;
      } else {
        item.insertText = `:${modifier.name}()`;
        item.insertTextFormat = InsertTextFormat.Snippet;
      }

      items.push(item);
    });

    return items;
  }

  private getModelNameCompletions(): CompletionItem[] {
    const models = this.analyzer.getAllModels();

    return models.map(model => ({
      label: model.name,
      kind: CompletionItemKind.Enum,
      detail: `Model ${model.name}`,
      documentation: model.table ? `Table: ${model.table}` : undefined
    }));
  }

  private getRelationTypeCompletions(): CompletionItem[] {
    const relationTypes = ["belongsTo", "hasMany", "hasOne", "hasAndBelongsToMany"];

    return relationTypes.map(type => ({
      label: type,
      kind: CompletionItemKind.Enum,
      detail: `Relation type: ${type}`
    }));
  }

  private getGeneralCompletions(): CompletionItem[] {
    const items: CompletionItem[] = [];

    // Add jade keyword
    items.push({
      label: "jade",
      kind: CompletionItemKind.Module,
      detail: "Jade ORM module"
    });

    // Add common patterns
    items.push({
      label: "Schema",
      kind: CompletionItemKind.Class,
      detail: "Jade Schema definition",
      insertText: "Schema({\n\tmodels: {\n\t\t${1:ModelName}: {\n\t\t\tfields: {\n\t\t\t\t${2:id} = jade.Integer(),\n\t\t\t}\n\t\t}\n\t}\n})",
      insertTextFormat: InsertTextFormat.Snippet
    });

    items.push({
      label: "Entity",
      kind: CompletionItemKind.Class,
      detail: "Jade Entity definition",
      insertText: 'Entity("${1:table_name}", {\n\t${2:id} = jade.Integer():primaryKey(),\n})',
      insertTextFormat: InsertTextFormat.Snippet
    });

    return items;
  }
}
