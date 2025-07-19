#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, Browser, Page } from 'playwright';

let browser: Browser | null = null;

interface ActionConfig {
  type: 'click' | 'type' | 'wait' | 'scroll' | 'hover';
  selector?: string;
  value?: string;
  timeout?: number;
}

interface ScreenshotConfig {
  url: string;
  width?: number;
  height?: number;
  fullPage?: boolean;
  actions?: ActionConfig[];
}

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
        description: 'Take a screenshot of a localhost URL with optional pre-screenshot interactions. All interactions must be included in a single tool call.',
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
              description: 'Optional sequence of actions to perform before taking screenshot.',
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
                    description: 'CSS selector or text selector (text=...)',
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



async function createPage(browser: Browser, width: number, height: number): Promise<Page> {
  const page = await browser.newPage();
  await page.setViewportSize({ width, height });
  return page;
}

function validateUrl(url: string): void {
  if (!url.startsWith('http://localhost:') && !url.startsWith('https://localhost:')) {
    throw new Error('Only localhost URLs are allowed for security reasons');
  }
}

async function getLocator(page: Page, selector: string) {
  try {
    const locator = page.locator(selector);
    if (await locator.isVisible()) {
      return locator;
    }
    throw new Error("The element is not visible. You may need to perform other actions to make it visible or try a different selector");
  } catch {
    throw new Error(`Element with selector "${selector}" not found. Stopping action sequence.`);
  }
}

async function executeClickAction(page: Page, selector: string): Promise<void> {
  if (!selector) throw new Error('Click action requires a selector');
  const locator = await getLocator(page, selector);
  await locator.click();
}

async function executeTypeAction(page: Page, selector: string, value: string): Promise<void> {
  if (!selector || !value) throw new Error('Type action requires selector and value');
  const locator = await getLocator(page, selector);
  await locator.fill(value);
}

async function executeWaitAction(page: Page, timeout: number): Promise<void> {
  await page.waitForTimeout(timeout);
}

async function executeScrollAction(page: Page, selector?: string, value?: string): Promise<void> {
  if (selector) {
    const locator = await getLocator(page, selector);
    await locator.scrollIntoViewIfNeeded();
  } else if (value) {
    const scrollAmount = parseInt(value, 10);
    await page.evaluate((amount: number) => window.scrollBy(0, amount), scrollAmount);
  }
}

async function executeHoverAction(page: Page, selector: string): Promise<void> {
  if (!selector) throw new Error('Hover action requires a selector');
  const locator = await getLocator(page, selector);
  await locator.hover();
}

async function executeAction(page: Page, action: ActionConfig): Promise<void> {
  const { type, selector, value, timeout = 1000 } = action;

  try {
    switch (type) {
      case 'click':
        await executeClickAction(page, selector!);
        break;
      case 'type':
        await executeTypeAction(page, selector!, value!);
        break;
      case 'wait':
        await executeWaitAction(page, timeout);
        break;
      case 'scroll':
        await executeScrollAction(page, selector, value);
        break;
      case 'hover':
        await executeHoverAction(page, selector!);
        break;
      default:
        throw new Error(`Unknown action type: ${type}`);
    }

    await page.waitForTimeout(100);
  } catch (error) {
    throw new Error(`Failed to execute ${type} action: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function executeActions(page: Page, actions: ActionConfig[] = []): Promise<void> {
  for (const action of actions) {
    await executeAction(page, action);
  }
}

async function takeScreenshot(page: Page, fullPage: boolean): Promise<Buffer> {
  return await page.screenshot({
    fullPage,
    type: 'png',
  });
}

async function handleScreenshotRequest(config: ScreenshotConfig) {
  const { url, width = 1280, height = 720, fullPage = false, actions = [] } = config;

  validateUrl(url);

  if (!browser) {
    throw new Error('Browser not initialized');
  }

  const page = await createPage(browser, width, height);
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    
    if (actions.length > 0) {
      await executeActions(page, actions);
    }
    
    const screenshot = await takeScreenshot(page, fullPage);
    
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
  } finally {
    await page.close();
  }
}

async function createBrowser(): Promise<Browser> {
  return await chromium.launch();
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'screenshot') {
    const config = args as unknown as ScreenshotConfig;
    try {
      return await handleScreenshotRequest(config);
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function main() {
  browser = await createBrowser();

  const transport = new StdioServerTransport();
  server.connect(transport).then(() => {
    console.error('Screenshot MCP server running on stdio');
  });

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
      console.error(`Received ${signal}, closing browser...`);
      if (browser) {
        await browser.close();
      }
      process.exit(0);
    });
  });
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
