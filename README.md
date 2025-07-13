# Screenshot MCP Server

A Model Context Protocol (MCP) server that provides screenshot capabilities for localhost development servers. This allows LLMs to see visual results of code changes during development.

## Features

- **Localhost-only**: Secure screenshot capture limited to localhost URLs
- **Flexible viewport**: Configurable width, height, and full-page capture
- **MCP integration**: Works with Claude Desktop and other MCP clients
- **Playwright-powered**: Reliable browser automation with Chromium

## Installation

```bash
git clone https://github.com/BradyDouthit/screenshot-mcp.git
cd screenshot-mcp
npm install
npm run build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop MCP configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

Replace `/path/to/screenshot-mcp` with the actual path to your cloned repository:

```json
{
  "mcpServers": {
    "screenshot": {
      "command": "node",
      "args": ["/path/to/screenshot-mcp/dist/index.js"]
    }
  }
}
```

### Manual Testing

```bash
# Test with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Test basic functionality
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Screenshot Tool

The server provides a `screenshot` tool with the following parameters:

- `url` (required): Localhost URL to capture (e.g., `http://localhost:3000`)
- `width` (optional): Viewport width in pixels (default: 1280)
- `height` (optional): Viewport height in pixels (default: 720)
- `fullPage` (optional): Capture full page scroll (default: false)

## Security

- Only localhost URLs are allowed for security
- No external network access
- Browser runs in sandboxed mode

## Requirements

- Node.js 18+
- Chromium (auto-installed via Playwright)

## License

MIT