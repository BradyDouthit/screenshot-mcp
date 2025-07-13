# Screenshot MCP Server

A Model Context Protocol (MCP) server that provides screenshot capabilities for localhost development servers. This allows LLMs to see visual results of code changes during development which is particularly helpful when making UI changes. 

## Example (Claude Code)
Here's a basic example of me using Claude Code where I needed to center a button (LLM's don't do well at grasping this from text only)!

![2EBEB0E7-FF73-41BC-99FB-83C3BB0E846D](https://github.com/user-attachments/assets/e70b1be0-fc99-4a5b-96b5-31ea249cb076)

As you can see from the text, the model makes the changes then screenshots the page after the change to verify that it had the intended effect. This can drastically reduce manual effort when coding with LLM's.


## Features

- **Localhost-only**: Secure screenshot capture limited to localhost URLs
- **Flexible viewport**: Configurable width, height, and full-page capture
- **MCP integration**: Works with MCP clients like Claude Code and Claude Desktop
- **Playwright-powered**: Reliable browser automation with Chromium

## Installation

```bash
git clone https://github.com/BradyDouthit/screenshot-mcp.git
cd screenshot-mcp
npm install
npm run build
```

## Usage

### With Claude Code

Add the MCP server to Claude Code:

```bash
claude mcp add /path/to/screenshot-mcp/dist/index.js
```

*Note: The index.js file must be executable. If not, run `chmod +x /path/to/screenshot-mcp/dist/index.js`*

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
