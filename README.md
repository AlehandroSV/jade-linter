# Jade - Linter for VS Code

Linter and IDE support for Jade ORM schema files.

## Features

- **Syntax Highlighting** - Highlighting for Jade types and modifiers
- **Auto-Completion** - Suggestions for Jade types, modifiers, and models
- **Linting** - Real-time error detection
- **Hover** - Documentation on hover
- **Snippets** - Common code templates
- **Formatting** - Auto-format schema files

## Installation

1. Open VS Code
2. Press `Ctrl+Shift+X` to open Extensions
3. Search for "Jade"
4. Click Install

## Usage

Open any `.lua` file containing Jade schema code:

```lua
local jade = require("jade")

return jade.Schema({
    models = {
        User = {
            fields = {
                id = jade.Integer(),
                name = jade.String(120),
                email = jade.String(255)!
            }
        }
    }
})
```

## Snippets

| Prefix | Description |
|--------|-------------|
| `jade-schema` | Complete schema structure |
| `jade-model` | Model definition |
| `jade-field` | Field definition |
| `jade-relation` | Relation definition |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `jade.schema.path` | `schema/init.lua` | Path to schema file |
| `jade.linting.enabled` | `true` | Enable linting |
| `jade.completion.enabled` | `true` | Enable auto-completion |
| `jade.formatting.enabled` | `true` | Enable formatting |
| `jade.formatting.formatOnSave` | `false` | Format on save |

## License

MIT
