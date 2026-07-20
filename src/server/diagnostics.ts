import { Diagnostic, DiagnosticSeverity, Range, Position } from "vscode-languageserver";
import { SchemaAnalyzer, AnalysisResult } from "./analyzer";

export class DiagnosticsProvider {
  private analyzer: SchemaAnalyzer;

  constructor(analyzer: SchemaAnalyzer) {
    this.analyzer = analyzer;
  }

  getDiagnostics(content: string): Diagnostic[] {
    this.analyzer = new SchemaAnalyzer(content);
    const result = this.analyzer.analyze();

    return result.diagnostics.map(error => this.convertToDiagnostic(error));
  }

  private convertToDiagnostic(error: {
    message: string;
    line: number;
    character: number;
    severity: "error" | "warning" | "information";
    length?: number;
  }): Diagnostic {
    const tokenLength = error.length || 10;
    const range: Range = {
      start: Position.create(error.line, error.character),
      end: Position.create(error.line, error.character + tokenLength)
    };

    let severity: DiagnosticSeverity;
    switch (error.severity) {
      case "error":
        severity = DiagnosticSeverity.Error;
        break;
      case "warning":
        severity = DiagnosticSeverity.Warning;
        break;
      case "information":
        severity = DiagnosticSeverity.Information;
        break;
      default:
        severity = DiagnosticSeverity.Warning;
    }

    return {
      severity,
      range,
      message: error.message,
      source: "jade"
    };
  }
}
