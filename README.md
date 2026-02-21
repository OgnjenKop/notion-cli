# Notion CLI

[![npm version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://www.npmjs.com/package/notion-cli)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

A powerful, production-ready command-line interface for interacting with the [Notion API](https://developers.notion.com/). Automate your Notion workspace, manage pages and databases, and manipulate content—all from your terminal.

![Notion CLI Demo](https://img.shields.io/badge/Status-Production%20Ready-success)

## ✨ Features

- 🔐 **Secure Authentication** - Token management with environment variable support
- 📄 **Full CRUD Operations** - Create, read, update, delete pages, databases, and blocks
- 🔍 **Advanced Search** - Query your workspace with filters and pagination
- 🧱 **20+ Block Types** - Support for paragraphs, headings, tables, columns, code, and more
- 📊 **Database Management** - Query databases with filters, sorts, and pagination
- 📝 **Batch Operations** - Execute multiple operations from JSON files
- 📤 **Markdown Export** - Export pages and content to well-formatted markdown files
- 📥 **Batch Export** - Export all child pages from a parent page in one command
- 🚀 **Built-in Resilience** - Automatic retry logic and rate limiting
- 🛡️ **Robust Error Handling** - Standardized errors, exit codes, and JSON error mode
- 🔒 **Secret Redaction** - Sensitive tokens/credentials are masked in errors and verbose logs
- 📈 **Performance Metrics** - Track API call performance and errors
- 🎨 **Rich Output** - JSON, markdown, and human-readable summaries
- ⚡ **Auto Pagination** - Fetch all content with `--all` flag, no manual cursors

## 📦 Installation

### Prerequisites

- Node.js 14.0.0 or higher
- npm or yarn
- A Notion account

### Install from Source

```bash
# Clone the repository
git clone https://github.com/OgnjenKop/notion-cli.git
cd notion-cli

# Install dependencies
npm install

# Build the project
npm run build

# Make the `notion` command available globally
npm link
```

Verify installation:

```bash
notion --version
```

## 🚀 Quick Start

### 1. Create a Notion Integration

1. Visit [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click **"+ New integration"**
3. Select your workspace and give your integration a name
4. Copy the **Internal Integration Token**

### 2. Authenticate

```bash
notion auth login <your-token>
```

Or use an environment variable:

```bash
export NOTION_TOKEN=<your-token>
```

### 3. Connect Your Content

1. Open the page or database you want to access
2. Click **"..."** (More options) in the top right
3. Select **"Connect to"** and choose your integration

### 4. Start Using the CLI

```bash
# Search your workspace
notion search

# List all databases
notion databases list

# Create a new page
notion pages create -p <databaseId> -t database --title "My New Page"
```

## 📖 Command Reference

### Authentication

| Command | Description |
|---------|-------------|
| `notion auth login <token>` | Configure API token |
| `notion auth logout` | Remove stored token |
| `notion auth status` | Check authentication status |
| `notion auth set-version <version>` | Set API version (e.g., `2025-09-03`) |
| `notion auth verbose on/off` | Enable/disable debug mode |

### Search

```bash
# Search all content
notion search

# Search with query text
notion search "meeting notes"

# Filter by type
notion search -t database
notion search "project" -t page

# Pagination
notion search -n 20
notion search --start-cursor "abc123"

# JSON output
notion search --json
```

### Pages

```bash
# Get a page
notion pages get <pageId>
notion pages get <pageId> --json

# Create a page in a database
notion pages create -p <databaseId> -t database --title "New Page"
notion pages create -p <databaseId> -t database --title "Task" --content "Description"

# Create a child page
notion pages create -p <pageId> -t page --title "Child Page" --content "Content"

# Update a page
notion pages update <pageId> --title "New Title"
notion pages update <pageId> --archived
notion pages update <pageId> --icon "🎉"
notion pages update <pageId> --cover "https://example.com/image.jpg"

# List pages in a database
notion pages list <databaseId>
notion pages list <databaseId> -n 20

# Archive (delete) a page
notion pages delete <pageId>

# Duplicate a page
notion pages duplicate <pageId>
notion pages duplicate <pageId> -p <newParentId> --title "New Title"

# Export a page to markdown
notion pages export <pageId>
notion pages export <pageId> -o custom-name.md
notion pages export <pageId> -d ./output-directory

# Export all child pages from a parent page
notion pages batch-export <parentPageId>
notion pages batch-export <parentPageId> -o ./exports
```

### Databases

```bash
# Get database schema
notion databases get <databaseId>
notion databases get <databaseId> --json

# List all databases
notion databases list

# Query a database
notion databases query <databaseId>
notion databases query <databaseId> -n 20

# Query with filter
notion databases query <databaseId> \
  -f '{"property":"Status","status":{"equals":"Done"}}'

# Query with sort
notion databases query <databaseId> \
  -s '{"property":"Created","direction":"descending"}'

# Create a database
notion databases create \
  -p <pageId> \
  --title "Tasks" \
  --properties '{"Name":{"title":{}},"Status":{"select":{"options":[{"name":"To Do"},{"name":"Done"}]}}}'
```

### Blocks

```bash
# Get a block
notion blocks get <blockId>

# List blocks in a page
notion blocks list <pageId>
notion blocks list <pageId> -n 50

# Fetch ALL blocks with automatic pagination
notion blocks list <pageId> --all

# Output in different formats
notion blocks list <pageId> --format markdown
notion blocks list <pageId> --format json
notion blocks list <pageId> --format text

# Write markdown output to file
notion blocks list <pageId> --format markdown -o output.md

# Append blocks
notion blocks append <pageId> -t paragraph --content "Hello World"
notion blocks append <pageId> -t heading_1 --content "Section Title"
notion blocks append <pageId> -t bulleted_list_item --content "Item 1"
notion blocks append <pageId> -t to_do --content "Task item" --checked
notion blocks append <pageId> -t code --content "console.log('hi')" --language javascript
notion blocks append <pageId> -t quote --content "Inspiring quote"
notion blocks append <pageId> -t callout --content "💡 Important note"
notion blocks append <pageId> -t divider
notion blocks append <pageId> -t toggle --content "Hidden content"
notion blocks append <pageId> -t image --content "https://example.com/image.jpg"
notion blocks append <pageId> -t embed --content "https://example.com"
notion blocks append <pageId> -t bookmark --content "https://example.com"

# Block colors
notion blocks append <pageId> -t paragraph --content "Gray text" --color gray
notion blocks append <pageId> -t heading_1 --content "Red heading" --color red

# Update a block
notion blocks update <blockId> --content "Updated text"
notion blocks update <blockId> --checked
notion blocks update <blockId> --unchecked

# Delete a block
notion blocks delete <blockId>

# Create tables
notion blocks append <pageId> -t table --table-width 3 --header
notion blocks append <tableId> -t table_row --cells '["Cell 1","Cell 2","Cell 3"]'

# Create column layouts
notion blocks append <pageId> -t column_list
notion blocks append <columnListId> -t column
notion blocks append <columnId> -t paragraph --content "Left column"
```

**Supported Block Types:**
- Text: `paragraph`, `heading_1`, `heading_2`, `heading_3`, `bulleted_list_item`, `numbered_list_item`, `to_do`, `quote`, `callout`, `code`, `toggle`
- Media: `image`, `video`, `pdf`, `file`, `audio`, `embed`, `bookmark`
- Layout: `divider`, `table`, `table_row`, `column`, `column_list`, `synced_block`

**Colors:** `default`, `gray`, `brown`, `orange`, `yellow`, `green`, `blue`, `purple`, `pink`, `red`

### Users

```bash
# List users
notion users list
notion users list -n 20

# Get user info
notion users get <userId>
notion users get <userId> --json

# Get current bot info
notion users me
```

### Comments

```bash
# Create a comment on a page
notion comments create -p <pageId> --text "This is a comment"

# Reply to a discussion
notion comments create --discussion-id <id> --text "Reply text"

# List comments
notion comments list <pageId>
```

### Files

```bash
# Add a file block (external URL)
notion files upload -p <pageId> --url "https://example.com/file.pdf"
notion files upload -p <pageId> --url "https://example.com/image.png" --caption "My image"
```

### Export

Export your Notion content to markdown files for documentation, backups, or static site generation.

```bash
# Export a single page to markdown
notion pages export <pageId>

# Specify output file
notion pages export <pageId> -o my-document.md

# Specify output directory
notion pages export <pageId> -d ./docs

# Export all child pages from a parent page
notion pages batch-export <parentPageId>

# Specify output directory for batch export
notion pages batch-export <parentPageId> -o ./exports

# Export as JSON instead of markdown
notion pages export <pageId> --json
```

**Export Features:**
- Automatic pagination (fetches all content)
- Sanitized filenames (removes special characters)
- Proper markdown formatting (headings, lists, code blocks, etc.)
- Metadata included (URL, created/edited dates)
- Child pages and databases listed with icons

### Batch Operations

Execute multiple operations from a JSON file:

```bash
# Run batch operations
notion batch run -f operations.json

# Preview without executing
notion batch run -f operations.json --dry-run

# JSON output
notion batch run -f operations.json --json
```

`notion batch run` returns a non-zero exit code when one or more operations fail (even when execution continues for remaining operations).

**Example `operations.json`:**

```json
{
  "stopOnError": false,
  "operations": [
    {
      "action": "search",
      "query": "meeting"
    },
    {
      "action": "create_page",
      "parent": { "type": "database_id", "database_id": "YOUR_DB_ID" },
      "properties": { "Name": { "title": [{ "text": { "content": "New Page" } }] } }
    },
    {
      "action": "append_block",
      "blockId": "PAGE_ID",
      "blocks": [{ "type": "paragraph", "paragraph": { "rich_text": [{ "text": { "content": "Hello" } }] } }]
    }
  ]
}
```

Supported batch actions: `create_page`, `update_page`, `delete_page`, `get_page`, `append_block`, `delete_block`, `query_database`, `search`, `create_comment`

### Metrics

```bash
# Display API performance metrics
notion metrics show
notion metrics show --json

# Reset metrics
notion metrics reset
```

### Doctor

```bash
# Run end-to-end diagnostics
notion doctor

# JSON diagnostics output
notion doctor --json
```

## 🛠 Development

```bash
# Run with ts-node (no build needed)
npm run dev

# Build for production
npm run build

# Run tests
npm test
npm run test:watch
npm run test:coverage

# Code quality
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run typecheck
```

## 📊 Test Coverage

The project includes a comprehensive test suite with **300+ tests** covering:

- Error handling and custom error classes
- Input validation (ID, URL, email, date, enum)
- API client (retry logic, rate limiting, metrics)
- Configuration management
- Output formatting
- All CLI commands

**Coverage Summary:**
- **Overall:** ~60% statement coverage
- **Core modules:** 100% (config, errors, validation)
- **API client:** 52% (retry logic fully tested)

## 🔧 Configuration

### Config File Location

- **macOS/Linux:** `~/.notion-cli/config.json`
- **Windows:** `C:\Users\<username>\.notion-cli\config.json`

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NOTION_TOKEN` | Override the stored API token |
| `NOTION_VERBOSE` | Set to `true` to enable verbose logging |
| `NOTION_STRICT_CONFIG` | Set to `true` to fail fast when config file is unreadable/corrupt |

### Error Output Modes

Use standard human-readable errors by default, or JSON for machine consumers.

```bash
# Human-readable errors (default)
notion pages get bad-id

# Structured errors on stderr (for scripts/automation)
notion --json-errors pages get bad-id
```

Notes:
- `--help` and `--version` exit with code `0`.
- Command/usage/runtime failures exit non-zero.
- In `--json-errors` mode, errors are emitted as JSON on stderr.
- Sensitive values (tokens/credentials) are redacted from error output and verbose logs.

### API Version

The CLI uses Notion API version `2025-09-03` by default. To change it:

```bash
notion auth set-version 2022-06-28
```

## 📝 Examples

### Create a Task Database and Add Tasks

```bash
# Create the database
notion databases create \
  -p <pageId> \
  --title "Task Tracker" \
  --properties '{
    "Name": {"title": {}},
    "Status": {"select": {"options": [{"name": "To Do"}, {"name": "In Progress"}, {"name": "Done"}]}},
    "Due": {"date": {}}
  }'

# Add tasks
notion pages create -p <databaseId> -t database --title "Fix bug" --content "Critical bug in login"
notion pages create -p <databaseId> -t database --title "Write docs"
```

### Search and Export

```bash
# Export all pages as JSON
notion search --json > all_pages.json

# Find all databases
notion search -t database --json > databases.json
```

### Create a Meeting Notes Template

```bash
# Create a page with multiple blocks
notion pages create -p <pageId> -t page --title "Meeting Notes"

# Add content blocks
notion blocks append <pageId> -t heading_1 --content "Attendees"
notion blocks append <pageId> -t bulleted_list_item --content "John Doe"
notion blocks append <pageId> -t bulleted_list_item --content "Jane Smith"
notion blocks append <pageId> -t divider
notion blocks append <pageId> -t heading_1 --content "Discussion"
notion blocks append <pageId> -t to_do --content "Action item 1"
notion blocks append <pageId> -t to_do --content "Action item 2"
```

## ⚠️ Known Limitations

1. **Rate Limiting:** Notion API limits to 3 requests/second. The CLI automatically rate limits requests (350ms between calls).

2. **File Uploads:** Only external URLs are supported. Direct file uploads require multipart/form-data handling.

3. **Complex Properties:** Database properties with relations/rollups require manual JSON.

4. **Nested Blocks:** No recursive block fetching for deeply nested content.

5. **Missing Block Types:** `link_preview`, `breadcrumb`, and `equation` blocks are not yet supported.

## 🐛 Troubleshooting

### "Token not found" error

```bash
# Run auth login to configure your token
notion auth login <token>

# Or set the environment variable
export NOTION_TOKEN=<token>
```

### "Could not find database" error

Make sure you've shared the database with your integration:
1. Go to the database
2. Click **"..."** → **"Connect to"**
3. Select your integration

### "Unauthorized" error

Your token may be invalid or revoked:

```bash
# Check connection status
notion auth status

# Re-login with a new token
notion auth login <new-token>
```

### "Rate limit exceeded" error

The CLI automatically rate limits requests. For batch operations, consider using `--dry-run` first to test.

### Verbose mode for debugging

```bash
# Enable verbose logging
notion auth verbose on

# Disable verbose logging
notion auth verbose off
```

## 📄 License

ISC

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📬 Support

- **Issues:** [GitHub Issues](https://github.com/OgnjenKop/notion-cli/issues)
- **Notion API Docs:** [https://developers.notion.com](https://developers.notion.com)

---

Built with ❤️ using TypeScript and Commander.js
