# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

This is an MCP (Model Context Protocol) server that provides screenshot capabilities for localhost development servers. The server uses Playwright (or similar) to capture screenshots of web applications, allowing LLMs to see visual results of code changes during development.

**Core Use Case**: Enable LLMs to provide visual feedback on frontend changes by taking screenshots of localhost servers and including them as context.

## Technology Stack

- **Runtime**: Node.js with TypeScript
- **MCP Framework**: @modelcontextprotocol/sdk
- **Screenshot Engine**: Playwright
- **Target**: Localhost development servers

## Development Commands

*To be established once project structure is created*

## Architecture Overview

The MCP server will expose tools/resources that allow:
1. **Screenshot Tool**: Capture screenshots of specified localhost URLs
2. **Page Analysis**: Extract visual information from rendered pages
3. **Comparison Tools**: Compare before/after screenshots of changes

**Core Components**:
- MCP server implementation
- Playwright browser automation
- Screenshot capture and processing
- URL validation and localhost targeting

## Development Notes

- Focus on localhost servers only for security
- Handle different viewport sizes and device types
- Consider screenshot caching and cleanup
- Implement proper error handling for unreachable URLs
- Support multiple browser engines through Playwright
- Try not to use external dependencies unless they solve a substantial problem. Always ask if the tradeoff is worth it before choosing a new dependency.