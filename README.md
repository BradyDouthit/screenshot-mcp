# Screenshot MCP Server

**Give your AI coding assistant eyes to see your UI changes in real-time.**

This MCP server bridges the gap between AI code generation and visual verification. Instead of describing what your UI looks like, your AI can actually see it by taking screenshots of your localhost development server.

## The Problem

When working with AI assistants on frontend code:
- You describe layout issues, AI guesses solutions
- AI makes changes, you manually check if they worked
- Endless back-and-forth describing visual problems
- AI can't understand spatial relationships from code alone

## The Solution

- **AI sees your UI directly** - Takes screenshots of localhost servers
- **Visual verification** - AI confirms changes worked as intended
- **Spatial awareness** - AI understands layout, alignment, and positioning
- **Faster iterations** - Immediate visual feedback reduces debugging cycles 

## Example (Claude Code)
Here's a basic example of me using Claude Code where I needed to center a button (LLM's don't do well at grasping spatial awareness from text only)!

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

This MCP server is completely generic and works with any MCP-compatible client including:

- **Claude Code** - Anthropic's official CLI tool
- **Gemini CLI** - Google's command line interface
- **Claude Desktop** - Anthropic's desktop application
- **Any other MCP client** - The server follows standard MCP protocol

### With Claude Code

Add the MCP server to Claude Code:

```bash
claude mcp add screenshot-mcp -- /path/to/screenshot-mcp/dist/index.js
```

*Note: The index.js file must be executable. If not, run `chmod +x /path/to/screenshot-mcp/dist/index.js`*


### Manual Testing

```bash
# Test with MCP inspector
npx @modelcontextprotocol/inspector node dist/index.js

# Test basic functionality
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node dist/index.js
```

## Screenshot Tool

The server provides a `screenshot` tool with the following parameters:

### Basic Parameters
- `url` (required): Localhost URL to capture (e.g., `http://localhost:3000`)
- `width` (optional): Viewport width in pixels (default: 1280)
- `height` (optional): Viewport height in pixels (default: 720)
- `fullPage` (optional): Capture full page scroll (default: false)

### Interactive Actions
- `actions` (optional): Array of actions to perform before taking the screenshot

#### Supported Actions

**Click Action**
```json
{
  "type": "click",
  "selector": "#submit-button",
  "timeout": 5000
}
```

**Type Action**
```json
{
  "type": "type",
  "selector": "input[name='email']",
  "value": "test@example.com",
  "timeout": 5000
}
```

**Wait Action**
```json
{
  "type": "wait",
  "timeout": 3000
}
```

**Scroll Action**
```json
{
  "type": "scroll",
  "selector": ".scroll-container",
  "timeout": 2000
}
```
Or scroll by amount:
```json
{
  "type": "scroll",
  "value": "500",
  "timeout": 2000
}
```

**Hover Action**
```json
{
  "type": "hover",
  "selector": ".menu-item",
  "timeout": 2000
}
```

#### Selector Types
- **CSS Selectors**: `#id`, `.class`, `[attribute]`, `tag`
- **Text Selectors**: `text=Click Me` (exact text match)

#### Example with Actions
```json
{
  "url": "http://localhost:3000",
  "width": 1920,
  "height": 1080,
  "actions": [
    {
      "type": "click",
      "selector": "#menu-toggle"
    },
    {
      "type": "wait",
      "timeout": 500
    },
    {
      "type": "type",
      "selector": "input[name='search']",
      "value": "test query"
    },
    {
      "type": "click",
      "selector": "text=Search"
    }
  ]
}
```

## Security

- Only localhost URLs are allowed for security
- No external network access
- Browser runs in sandboxed mode

## Requirements

- Node.js 18+
- Chromium (auto-installed via Playwright)

## License

MIT
