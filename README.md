# Notion CLI

A comprehensive command-line interface for interacting with the Notion API.

## Installation

```bash
npm install
npm run build
npm link  # Makes the `notion` command available globally
```

## Quick Start

### 1. Create a Notion Integration

1. Go to [https://www.notion.so/my-integrations](https://www.notion.so/my-integrations)
2. Click "+ New integration"
3. Choose your workspace and give it a name
4. Copy the **Internal Integration Token**

### 2. Authenticate

```bash
notion auth login <your-token>
```

Or set it as an environment variable:

```bash
export NOTION_TOKEN=<your-token>
```

### 3. Share Pages/Databases

1. Open the page/database you want to access
2. Click the "..." menu → "Connect to"
3. Select your integration

## Commands

### Authentication

```bash
notion auth login <token>           # Configure API token
notion auth logout                  # Remove stored token
notion auth status                  # Check authentication status
notion auth set-version <version>   # Set API version (e.g., 2025-09-03)
notion auth verbose on              # Enable verbose/debug mode
notion auth verbose off             # Disable verbose mode
```

### Search

```bash
notion search                              # Search all content
notion search "meeting notes"              # Search with query
notion search -t database                  # Search only databases
notion search "project" -t page            # Search only pages
notion search -n 20                        # 20 results per page
notion search --start-cursor "abc123"      # Paginate results
notion search --json                       # Output as JSON
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
notion pages list <databaseId> --start-cursor "abc123"

# Archive (delete) a page
notion pages delete <pageId>

# Duplicate a page
notion pages duplicate <pageId>
notion pages duplicate <pageId> -p <newParentId> --title "New Title"
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
notion databases query <databaseId> --start-cursor "abc123"

# Query with filter
notion databases query <databaseId> -f '{"property":"Status","status":{"equals":"Done"}}'
notion databases query <databaseId> -f '{"property":"Name","text":{"contains":"meeting"}}'

# Query with sort
notion databases query <databaseId> -s '{"property":"Created","direction":"descending"}'

# Create a database
notion databases create -p <pageId> --title "Tasks" --properties '{"Name":{"title":{}},"Status":{"select":{"options":[{"name":"To Do"},{"name":"Done"}]}}}'
```

### Blocks

```bash
# Get a block
notion blocks get <blockId>
notion blocks get <blockId> --json

# List blocks in a page
notion blocks list <pageId>
notion blocks list <pageId> -n 50
notion blocks list <blockId> --json

# Append blocks
notion blocks append <pageId> -t paragraph --content "Hello World"
notion blocks append <pageId> -t heading_1 --content "Section Title"
notion blocks append <pageId> -t heading_2 --content "Subsection"
notion blocks append <pageId> -t bulleted_list_item --content "Item 1"
notion blocks append <pageId> -t numbered_list_item --content "Step 1"
notion blocks append <pageId> -t to_do --content "Task item"
notion blocks append <pageId> -t to_do --content "Completed" --checked
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
```

**Supported block types:**
- `paragraph`, `heading_1`, `heading_2`, `heading_3`
- `bulleted_list_item`, `numbered_list_item`, `to_do`
- `quote`, `callout`, `code`, `toggle`, `divider`
- `image`, `embed`, `bookmark`

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
notion users me --json
```

### Comments

```bash
# Create a comment on a page
notion comments create -p <pageId> --text "This is a comment"

# Reply to a discussion
notion comments create --discussion-id <id> --text "Reply text"

# List comments on a page or block
notion comments list <pageId>
notion comments list <blockId>
```

### Files

```bash
# Add a file block (external URL)
notion files upload -p <pageId> --url "https://example.com/file.pdf"
notion files upload -p <pageId> --url "https://example.com/image.png" --caption "My image"
```

### Batch Operations

```bash
# Run batch operations from a JSON file
notion batch run -f operations.json
notion batch run -f operations.json --dry-run    # Preview without executing
notion batch run -f operations.json --json       # Output results as JSON
notion batch run -f operations.json --quiet      # Minimal output
```

Batch file format (`operations.json`):
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
      "blocks": [{ "object": "block", "type": "paragraph", "paragraph": { "rich_text": [{ "text": { "content": "Hello" } }] } }]
    },
    {
      "action": "delete_page",
      "pageId": "PAGE_ID"
    },
    {
      "action": "create_comment",
      "parent": { "type": "page_id", "page_id": "PAGE_ID" },
      "rich_text": [{ "text": { "content": "Comment text" } }]
    }
  ]
}
```

Supported batch actions: `create_page`, `update_page`, `delete_page`, `get_page`, `append_block`, `delete_block`, `query_database`, `search`, `create_comment`

## Global Options

| Option | Description |
|--------|-------------|
| `--json` | Output results as JSON |
| `-q, --quiet` | Suppress non-essential output |
| `-n, --page-size` | Number of results per page |
| `--start-cursor` | Pagination cursor for next page |

## Property Types for Database Creation

When creating databases, use JSON for the `--properties` option:

```json
{
  "Name": { "title": {} },
  "Description": { "rich_text": {} },
  "Status": { "select": { "options": [{"name": "To Do"}, {"name": "Done"}] } },
  "Tags": { "multi_select": { "options": [{"name": "urgent"}, {"name": "low priority"}] } },
  "Due Date": { "date": {} },
  "Assignee": { "people": {} },
  "Priority": { "number": { "format": "number" } },
  "Complete": { "checkbox": {} },
  "Website": { "url": {} },
  "Email": { "email": {} }
}
```

## Configuration

Configuration is stored in `~/.notion-cli/config.json`.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NOTION_TOKEN` | Override the stored API token |
| `NOTION_VERBOSE` | Set to `true` to enable verbose logging |

### Config File Location

- **macOS/Linux**: `~/.notion-cli/config.json`
- **Windows**: `C:\Users\<username>\.notion-cli\config.json`

## API Version

The CLI uses Notion API version `2025-09-03` by default. To change it:

```bash
notion auth set-version 2022-06-28
```

## Examples

### Create a Task Database and Add Tasks

```bash
# Create the database
notion databases create \
  -p <pageId> \
  --title "Task Tracker" \
  --properties '{"Name":{"title":{}},"Status":{"select":{"options":[{"name":"To Do"},{"name":"In Progress"},{"name":"Done"}]}},"Due":{"date":{}}}'

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

### Batch Operations

```bash
# Archive multiple pages
for id in page1 page2 page3; do
  notion pages delete $id
done
```

## Development

```bash
npm run dev          # Run with ts-node (no build needed)
npm run build        # Compile to JavaScript
npm run start        # Run compiled version
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
npm run format       # Format with Prettier
npm run format:check # Check Prettier formatting
npm run typecheck    # Type check without emitting
```

## Testing

```bash
npm test             # Run all tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

### Test Coverage

The project includes a comprehensive test suite with **293 tests** covering:

- **Error handling** - Custom error classes and error extraction
- **Input validation** - ID, URL, email, date, and enum validators
- **API client** - Retry logic, rate limiting, metrics tracking
- **Configuration** - Token management, version settings
- **Output formatting** - JSON and human-readable output
- **Command structure** - All CLI commands and subcommands

**Coverage Summary:**
- **Overall:** ~60% statement coverage
- **Core modules:** 100% (config, errors, validation)
- **API client:** 52% (retry logic fully tested)

### Running Specific Tests

```bash
# Run tests matching a pattern
npx jest --testNamePattern="validation"

# Run a specific test file
npx jest src/__tests__/errors.test.ts

# Run tests with verbose output
npx jest --verbose
```

### Test Files

```
src/__tests__/
├── client.test.ts           # API client tests (retry, metrics)
├── config.test.ts           # Configuration management
├── errors.test.ts           # Error class hierarchy
├── validation.test.ts       # ID/URL validation
├── option-validation.test.ts # Input validators
├── output.test.ts           # Output formatting
├── commands.test.ts         # Command structure tests
├── pages.test.ts            # Pages command tests
├── databases.test.ts        # Databases command tests
├── blocks.test.ts           # Blocks command tests
└── auth.test.ts             # Auth command tests
```

## Troubleshooting

### "Token not found" error
- Run `notion auth login <token>` to configure your token
- Or set `export NOTION_TOKEN=<token>`

### "Could not find database" error
- Make sure you've shared the database with your integration
- Go to the database → "..." → "Connect to" → Select your integration

### "Unauthorized" error
- Your token may be invalid or revoked
- Run `notion auth status` to check connection
- Re-run `notion auth login <new-token>`

### "Rate limit exceeded" error
- Notion API limits requests to 3 requests/second
- The CLI automatically rate limits requests (350ms between calls)
- For batch operations, consider using `--dry-run` first to test

### "Invalid JSON" error
- Check your JSON syntax carefully
- Use a JSON validator like [jsonlint.com](https://jsonlint.com)
- Escape quotes properly in shell commands

### Verbose mode for debugging
- Enable with: `notion auth verbose on`
- Shows detailed API request/response information
- Disable with: `notion auth verbose off`

## License

ISC
