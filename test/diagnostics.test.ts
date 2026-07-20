import { describe, it, expect } from "vitest";
import { DiagnosticsProvider } from "../src/server/diagnostics";

describe("DiagnosticsProvider", () => {
  function getDiagnostics(content: string) {
    const provider = new DiagnosticsProvider(null as any);
    return provider.getDiagnostics(content);
  }

  describe("Diagnostic range", () => {
    it("uses token length for type errors", () => {
      const diagnostics = getDiagnostics(`
User = {
  id = jade.FooBar()
}
`);
      const errors = diagnostics.filter(d => d.severity === 1); // Error
      expect(errors).toHaveLength(1);
      const range = errors[0].range;
      expect(range.end.character - range.start.character).toBe("FooBar".length);
    });

    it("uses token length for modifier errors", () => {
      const diagnostics = getDiagnostics(`
User = {
  id = jade.Integer():nonexistent()
}
`);
      const errors = diagnostics.filter(d => d.severity === 1);
      expect(errors).toHaveLength(1);
      const range = errors[0].range;
      expect(range.end.character - range.start.character).toBe("nonexistent".length);
    });
  });

  describe("Severity mapping", () => {
    it("maps error severity correctly", () => {
      const diagnostics = getDiagnostics(`
User = {
  id = jade.FooBar()
}
`);
      const errors = diagnostics.filter(d => d.severity === 1);
      expect(errors).toHaveLength(1);
    });

    it("maps warning severity correctly", () => {
      const diagnostics = getDiagnostics(`
User = {
  id = jade.Integer():primaryKey()
  created_at = jade.Timestamp()
}
`);
      const warnings = diagnostics.filter(d => d.severity === 2);
      expect(warnings.length).toBeGreaterThan(0);
    });

    it("maps information severity correctly", () => {
      const diagnostics = getDiagnostics(`
User = {
  id = jade.Integer():primaryKey()
}
`);
      const infos = diagnostics.filter(d => d.severity === 3);
      expect(infos.length).toBeGreaterThan(0);
    });
  });

  describe("Source field", () => {
    it("sets source to jade", () => {
      const diagnostics = getDiagnostics(`
User = {
  id = jade.FooBar()
}
`);
      expect(diagnostics[0].source).toBe("jade");
    });
  });
});
