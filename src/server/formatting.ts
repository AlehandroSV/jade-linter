import { TextEdit, Range, Position } from "vscode-languageserver";

export class FormattingProvider {
  format(content: string): TextEdit[] {
    const lines = content.split("\n");
    const formattedLines: string[] = [];
    let indentLevel = 0;
    const indentSize = 4;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        formattedLines.push("");
        continue;
      }

      // Decrease indent for closing braces
      if (trimmed.startsWith("}")) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      // Format line with proper indent
      const indent = " ".repeat(indentLevel * indentSize);
      formattedLines.push(`${indent}${trimmed}`);

      // Increase indent for opening braces
      if (trimmed.endsWith("{")) {
        indentLevel++;
      }

      // Handle single-line decreases (like })
      if (trimmed.includes("}") && !trimmed.endsWith("{")) {
        // Don't increase if line ends with }
      }
    }

    // Create edit for entire document
    const lastLine = lines.length - 1;
    const lastChar = lines[lastLine]?.length || 0;

    return [
      TextEdit.replace(
        Range.create(Position.create(0, 0), Position.create(lastLine, lastChar)),
        formattedLines.join("\n")
      )
    ];
  }
}
