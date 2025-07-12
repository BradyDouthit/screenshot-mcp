#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium } from 'playwright';

const server = new Server(
  {
    name: 'screenshot-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'screenshot',
        description: 'Take a screenshot of a localhost URL',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'The localhost URL to screenshot (e.g., http://localhost:3000)',
            },
            width: {
              type: 'number',
              description: 'Viewport width (default: 1280)',
              default: 1280,
            },
            height: {
              type: 'number',
              description: 'Viewport height (default: 720)',
              default: 720,
            },
            fullPage: {
              type: 'boolean',
              description: 'Capture full page (default: false)',
              default: false,
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'screenshot') {
    const { url, width = 1280, height = 720, fullPage = false } = args as {
      url: string;
      width?: number;
      height?: number;
      fullPage?: boolean;
    };

    if (!url.startsWith('http://localhost:') && !url.startsWith('https://localhost:')) {
      throw new Error('Only localhost URLs are allowed for security reasons');
    }

    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      
      await page.setViewportSize({ width, height });
      await page.goto(url, { waitUntil: 'networkidle' });
      
      const screenshot = await page.screenshot({
        fullPage,
        type: 'png',
      });
      
      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: `Screenshot captured from ${url} (${width}x${height}${fullPage ? ', full page' : ''})`,
          },
          {
            type: 'image',
            data: screenshot.toString('base64'),
            mimeType: 'image/png',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Screenshot MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});