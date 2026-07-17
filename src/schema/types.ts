export interface JadeType {
  name: string;
  description: string;
  sqlType: string;
  hasLength?: boolean;
  hasPrecision?: boolean;
  defaultLength?: number;
}

export const JADE_TYPES: JadeType[] = [
  {
    name: "Integer",
    description: "Integer column",
    sqlType: "INTEGER"
  },
  {
    name: "String",
    description: "VARCHAR column",
    sqlType: "VARCHAR",
    hasLength: true,
    defaultLength: 255
  },
  {
    name: "Text",
    description: "TEXT column",
    sqlType: "TEXT"
  },
  {
    name: "Boolean",
    description: "BOOLEAN column",
    sqlType: "BOOLEAN"
  },
  {
    name: "Timestamp",
    description: "TIMESTAMPTZ column",
    sqlType: "TIMESTAMPTZ"
  },
  {
    name: "Date",
    description: "DATE column",
    sqlType: "DATE"
  },
  {
    name: "UUID",
    description: "UUID column",
    sqlType: "UUID"
  },
  {
    name: "CUID",
    description: "CUID column (25 chars)",
    sqlType: "VARCHAR(25)"
  },
  {
    name: "NanoID",
    description: "NanoID column (21 chars)",
    sqlType: "VARCHAR(21)"
  },
  {
    name: "Float",
    description: "FLOAT column",
    sqlType: "FLOAT"
  },
  {
    name: "Decimal",
    description: "DECIMAL column",
    sqlType: "DECIMAL",
    hasPrecision: true
  }
];

export function getTypeByName(name: string): JadeType | undefined {
  return JADE_TYPES.find(t => t.name === name);
}

export function getTypeNames(): string[] {
  return JADE_TYPES.map(t => t.name);
}
