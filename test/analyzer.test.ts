import { describe, it, expect } from "vitest";
import { SchemaAnalyzer } from "../src/server/analyzer";

describe("SchemaAnalyzer", () => {
  describe("Type validation", () => {
    it("validates correct types", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  name = jade.String(120)
  active = jade.Boolean()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors).toHaveLength(0);
    });

    it("reports invalid types", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Foo()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Foo");
    });

    it("validates new types (BigInt, JSON, Enum)", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  big = jade.BigInt()
  data = jade.JSON()
  role = jade.Enum()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors).toHaveLength(0);
    });
  });

  describe("Modifier validation", () => {
    it("validates correct modifiers", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  name = jade.String(120):notNull():unique()
  email = jade.String(255):defaultNow()
  ssn = jade.String(11):encrypted()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors).toHaveLength(0);
    });

    it("reports invalid modifiers", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():foobar()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("foobar");
    });
  });

  describe("Smart created_at check", () => {
    it("warns when created_at lacks defaultNow", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  created_at = jade.Timestamp()
}
`);
      const result = analyzer.analyze();
      const warnings = result.diagnostics.filter(e =>
        e.severity === "warning" && e.message.includes("created_at")
      );
      expect(warnings).toHaveLength(1);
    });

    it("no warning when created_at has defaultNow", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  created_at = jade.Timestamp():defaultNow()
}
`);
      const result = analyzer.analyze();
      const warnings = result.diagnostics.filter(e =>
        e.severity === "warning" && e.message.includes("created_at")
      );
      expect(warnings).toHaveLength(0);
    });

    it("no warning when created_at has default", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():primaryKey()
  created_at = jade.Timestamp():default("now")
}
`);
      const result = analyzer.analyze();
      const warnings = result.diagnostics.filter(e =>
        e.severity === "warning" && e.message.includes("created_at")
      );
      expect(warnings).toHaveLength(0);
    });
  });

  describe("Diagnostic length", () => {
    it("includes length for type errors", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.FooBar()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors[0].length).toBe("FooBar".length);
    });

    it("includes length for modifier errors", () => {
      const analyzer = new SchemaAnalyzer(`
User = {
  id = jade.Integer():nonexistent()
}
`);
      const result = analyzer.analyze();
      const errors = result.diagnostics.filter(e => e.severity === "error");
      expect(errors[0].length).toBe("nonexistent".length);
    });
  });
});
