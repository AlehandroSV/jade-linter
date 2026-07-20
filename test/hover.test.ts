import { describe, it, expect } from "vitest";
import { HoverProvider } from "../src/server/hover";
import { SchemaAnalyzer } from "../src/server/analyzer";
import { SchemaIndex } from "../src/server/schema-index";

describe("HoverProvider", () => {
  const index = new SchemaIndex();

  function getHover(line: string, char?: number) {
    const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  name = jade.String(120)
}
`, index);
    const provider = new HoverProvider(analyzer, index);
    return provider.getHover(line, char ?? Math.floor(line.length / 2));
  }

  describe("Type hover", () => {
    it("returns hover for Integer", () => {
      const hover = getHover("jade.Integer()");
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("jade.Integer()");
      expect(content).toContain("INTEGER");
    });

    it("returns hover for String", () => {
      const hover = getHover("jade.String(120)");
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("jade.String()");
      expect(content).toContain("VARCHAR");
    });

    it("returns hover for new types", () => {
      const hoverBigInt = getHover("jade.BigInt()");
      expect(hoverBigInt).not.toBeNull();

      const hoverJSON = getHover("jade.JSON()");
      expect(hoverJSON).not.toBeNull();

      const hoverEnum = getHover("jade.Enum()");
      expect(hoverEnum).not.toBeNull();
    });
  });

  describe("Modifier hover", () => {
    it("returns hover for defaultNow", () => {
      // Position cursor on "defaultNow" specifically
      const line = "jade.Timestamp():defaultNow()";
      const char = line.indexOf("defaultNow") + 5; // middle of "defaultNow"
      const hover = getHover(line, char);
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("defaultNow");
    });

    it("returns hover for encrypted", () => {
      // Position cursor on "encrypted" specifically
      const line = "jade.String():encrypted()";
      const char = line.indexOf("encrypted") + 5; // middle of "encrypted"
      const hover = getHover(line, char);
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("encrypted");
    });
  });

  describe("Relation type hover", () => {
    it("returns hover for hasManyThrough", () => {
      const line = 'type = "hasManyThrough"';
      const char = line.indexOf("hasManyThrough") + 5;
      const hover = getHover(line, char);
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("hasManyThrough");
    });

    it("returns hover for belongsTo", () => {
      const line = 'type = "belongsTo"';
      const char = line.indexOf("belongsTo") + 5;
      const hover = getHover(line, char);
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("belongsTo");
    });
  });

  describe("Shorthand hover", () => {
    it("returns hover for !", () => {
      const hover = getHover("jade.String()!");
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("unique");
      expect(content).toContain("notNull");
    });

    it("returns hover for ?", () => {
      const hover = getHover("jade.String()?");
      expect(hover).not.toBeNull();
      const content = (hover!.contents as any).value;
      expect(content).toContain("nullable");
    });
  });

  describe("No hover", () => {
    it("returns null for unknown words", () => {
      const hover = getHover("foobar");
      expect(hover).toBeNull();
    });
  });
});
