export interface JadeModifier {
  name: string;
  description: string;
  hasParams: boolean;
  paramCount?: number;
  paramNames?: string[];
}

export const JADE_MODIFIERS: JadeModifier[] = [
  {
    name: "primaryKey",
    description: "Mark field as primary key",
    hasParams: false
  },
  {
    name: "autoIncrement",
    description: "Auto increment integer field",
    hasParams: false
  },
  {
    name: "notNull",
    description: "Field cannot be null",
    hasParams: false
  },
  {
    name: "unique",
    description: "Field must be unique",
    hasParams: false
  },
  {
    name: "nullable",
    description: "Field can be null",
    hasParams: false
  },
  {
    name: "default",
    description: "Set default value",
    hasParams: true,
    paramCount: 1,
    paramNames: ["value"]
  },
  {
    name: "foreignKey",
    description: "Define foreign key relationship",
    hasParams: true,
    paramCount: 2,
    paramNames: ["table", "column"]
  },
  {
    name: "inValues",
    description: "Restrict to specific values",
    hasParams: true,
    paramCount: 1,
    paramNames: ["values"]
  },
  {
    name: "defaultNow",
    description: "Set default to current timestamp",
    hasParams: false
  },
  {
    name: "encrypted",
    description: "Mark column for encryption",
    hasParams: false
  }
];

export const SHORTHAND_MODIFIERS = [
  {
    symbol: "!",
    description: "unique + notNull",
    expandsTo: [":unique()", ":notNull()"]
  },
  {
    symbol: "?",
    description: "nullable",
    expandsTo: [":nullable()"]
  }
];

export function getModifierByName(name: string): JadeModifier | undefined {
  return JADE_MODIFIERS.find(m => m.name === name);
}

export function getModifierNames(): string[] {
  return JADE_MODIFIERS.map(m => m.name);
}
