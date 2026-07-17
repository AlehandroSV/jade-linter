import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  InitializeResult,
  TextDocumentSyncKind,
  CompletionItem,
  Hover,
  TextEdit
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { SchemaAnalyzer } from "./analyzer";
import { CompletionProvider } from "./completion";
import { DiagnosticsProvider } from "./diagnostics";
import { HoverProvider } from "./hover";
import { FormattingProvider } from "./formatting";

// Create connection
const connection = createConnection(ProposedFeatures.all);

// Create document manager
const documents = new TextDocuments(TextDocument);

// Providers
let analyzer: SchemaAnalyzer;
let completionProvider: CompletionProvider;
let diagnosticsProvider: DiagnosticsProvider;
let hoverProvider: HoverProvider;
let formattingProvider: FormattingProvider;

// Initialize
connection.onInitialize((params: InitializeParams): InitializeResult => {
  connection.console.log("Jade LSP Server initializing...");

  return {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      completionProvider: {
        triggerCharacters: [".", "(", "'", '"']
      },
      hoverProvider: true,
      documentFormattingProvider: true
    }
  };
});

connection.onInitialized(() => {
  connection.console.log("Jade LSP Server initialized");
});

// Document events
documents.onDidChangeContent(change => {
  const document = change.document;
  analyzeDocument(document);
});

documents.onDidClose(change => {
  // Diagnostics are cleared automatically when document is closed
});

// Completion
connection.onCompletion((params): CompletionItem[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const content = document.getText();
  const lines = content.split("\n");
  const line = lines[params.position.line] || "";

  analyzer = new SchemaAnalyzer(content);
  completionProvider = new CompletionProvider(analyzer);

  return completionProvider.getCompletions(line, params.position.character);
});

// Hover
connection.onHover((params): Hover | null => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  const content = document.getText();
  const lines = content.split("\n");
  const line = lines[params.position.line] || "";

  analyzer = new SchemaAnalyzer(content);
  hoverProvider = new HoverProvider(analyzer);

  return hoverProvider.getHover(line, params.position.character);
});

// Formatting
connection.onDocumentFormatting((params): TextEdit[] => {
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return [];
  }

  const content = document.getText();
  formattingProvider = new FormattingProvider();

  return formattingProvider.format(content);
});

// Analyze document and send diagnostics
function analyzeDocument(document: TextDocument): void {
  const content = document.getText();
  analyzer = new SchemaAnalyzer(content);
  diagnosticsProvider = new DiagnosticsProvider(analyzer);

  const diagnostics = diagnosticsProvider.getDiagnostics(content);
  connection.sendDiagnostics({ uri: document.uri, diagnostics });
}

// Listen
documents.listen(connection);
connection.listen();
