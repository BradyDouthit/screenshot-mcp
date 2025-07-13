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
        description: 'Take a screenshot of a localhost URL with optional pre-screenshot interactions',
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
            actions: {
              type: 'array',
              description: 'Optional sequence of actions to perform before taking screenshot',
              items: {
                type: 'object',
                properties: {
                  type: {
                    type: 'string',
                    enum: ['click', 'type', 'wait', 'scroll', 'hover'],
                    description: 'Type of action to perform',
                  },
                  selector: {
                    type: 'string',
                    description: 'CSS selector, XPath (starts with //), or text selector (text=...)',
                  },
                  value: {
                    type: 'string',
                    description: 'Value for type actions or scroll amount',
                  },
                  timeout: {
                    type: 'number',
                    description: 'Timeout in milliseconds for wait actions (default: 1000)',
                    default: 1000,
                  },
                },
                required: ['type'],
              },
            },
          },
          required: ['url'],
        },
      },
    ],
  };
});

// Helper function to execute actions on a page
async function executeActions(page: any, actions: any[] = []) {
  for (const action of actions) {
    const { type, selector, value, timeout = 1000 } = action;

    try {
      switch (type) {
        case 'click':
          if (!selector) throw new Error('Click action requires a selector');
          if (selector.startsWith('//')) {
            await page.locator(`xpath=${selector}`).click();
          } else if (selector.startsWith('text=')) {
            await page.locator(selector).click();
          } else {
            await page.locator(selector).click();
          }
          break;

        case 'type':
          if (!selector || !value) throw new Error('Type action requires selector and value');
          if (selector.startsWith('//')) {
            await page.locator(`xpath=${selector}`).fill(value);
          } else {
            await page.locator(selector).fill(value);
          }
          break;

        case 'wait':
          await page.waitForTimeout(timeout);
          break;

        case 'scroll':
          if (selector) {
            if (selector.startsWith('//')) {
              await page.locator(`xpath=${selector}`).scrollIntoViewIfNeeded();
            } else {
              await page.locator(selector).scrollIntoViewIfNeeded();
            }
          } else if (value) {
            const scrollAmount = parseInt(value, 10);
            await page.evaluate((amount: number) => window.scrollBy(0, amount), scrollAmount);
          }
          break;

        case 'hover':
          if (!selector) throw new Error('Hover action requires a selector');
          if (selector.startsWith('//')) {
            await page.locator(`xpath=${selector}`).hover();
          } else {
            await page.locator(selector).hover();
          }
          break;

        default:
          throw new Error(`Unknown action type: ${type}`);
      }

      // Small delay between actions for stability
      await page.waitForTimeout(100);
    } catch (error) {
      throw new Error(`Failed to execute ${type} action: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'screenshot') {
    const { url, width = 1280, height = 720, fullPage = false, actions = [] } = args as {
      url: string;
      width?: number;
      height?: number;
      fullPage?: boolean;
      actions?: Array<{
        type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
        selector?: string;
        value?: string;
        timeout?: number;
      }>;
    };

    if (!url.startsWith('http://localhost:') && !url.startsWith('https://localhost:')) {
      throw new Error('Only localhost URLs are allowed for security reasons');
    }

    try {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      
      await page.setViewportSize({ width, height });
      await page.goto(url, { waitUntil: 'networkidle' });
      
      // Execute pre-screenshot actions
      if (actions.length > 0) {
        await executeActions(page, actions);
      }
      
      const screenshot = await page.screenshot({
        fullPage,
        type: 'png',
      });
      
      await browser.close();

      const actionsText = actions.length > 0 ? ` after ${actions.length} action${actions.length > 1 ? 's' : ''}` : '';
      return {
        content: [
          {
            type: 'text',
            text: `Screenshot captured from ${url} (${width}x${height}${fullPage ? ', full page' : ''})${actionsText}`,
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
