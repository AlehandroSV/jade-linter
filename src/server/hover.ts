import { Hover, MarkupContent, MarkupKind } from "vscode-languageserver";
import { SchemaAnalyzer } from "./analyzer";
import { getTypeByName } from "../schema/types";
import { getModifierByName, SHORTHAND_MODIFIERS } from "../schema/modifiers";

export class HoverProvider {
  private analyzer: SchemaAnalyzer;

  constructor(analyzer: SchemaAnalyzer) {
    this.analyzer = analyzer;
  }

  getHover(line: string, character: number): Hover | null {
    const word = this.getWordAtPosition(line, character);
    if (!word) {
      return null;
    }

    // Check if it's a Jade type
    const type = getTypeByName(word);
    if (type) {
      return this.createTypeHover(type);
    }

    // Check if it's a modifier (without :)
    const modifier = getModifierByName(word);
    if (modifier) {
      return this.createModifierHover(modifier);
    }

    // Check shorthand modifiers
    const shorthand = SHORTHAND_MODIFIERS.find(s => s.symbol === word);
    if (shorthand) {
      return this.createShorthandHover(shorthand);
    }

    return null;
  }

  private getWordAtPosition(line: string, character: number): string | null {
    const beforeCursor = line.substring(0, character);
    const afterCursor = line.substring(character);

    // Find word boundaries
    const beforeMatch = beforeCursor.match(/[\w]+$/);
    const afterMatch = afterCursor.match(/^[\w]+/);

    if (!beforeMatch && !afterMatch) {
      return null;
    }

    const before = beforeMatch ? beforeMatch[0] : "";
    const after = afterMatch ? afterMatch[0] : "";

    return before + after || null;
  }

  private createTypeHover(type: {
    name: string;
    description: string;
    sqlType: string;
    hasLength?: boolean;
    hasPrecision?: boolean;
  }): Hover {
    const content: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: [
        `**jade.${type.name}()**`,
        "",
        type.description,
        "",
        `SQL: \`${type.sqlType}\``,
        "",
        "Modifiers:",
        "- `!` = unique + notNull",
        "- `?` = nullable",
        "- `:default(value)` = default value",
        "- `:foreignKey(table, column)` = foreign key"
      ].join("\n")
    };

    return { contents: content };
  }

  private createModifierHover(modifier: {
    name: string;
    description: string;
    hasParams: boolean;
    paramNames?: string[];
  }): Hover {
    const params = modifier.hasParams && modifier.paramNames
      ? `(${modifier.paramNames.join(", ")})`
      : "()";

    const content: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: [
        `**:${modifier.name}${params}**`,
        "",
        modifier.description
      ].join("\n")
    };

    return { contents: content };
  }

  private createShorthandHover(shorthand: {
    symbol: string;
    description: string;
    expandsTo: string[];
  }): Hover {
    const content: MarkupContent = {
      kind: MarkupKind.Markdown,
      value: [
        `**${shorthand.symbol}**`,
        "",
        shorthand.description,
        "",
        "Expands to:",
        ...shorthand.expandsTo.map(e => `- \`${e}\``)
      ].join("\n")
    };

    return { contents: content };
  }
}
