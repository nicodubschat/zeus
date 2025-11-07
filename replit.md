# Discord Bypasser Bot

## Overview
A high-performance Discord bot that bypasses URLs using three different APIs concurrently. The bot returns the fastest successful result and includes comprehensive rate limiting, beautiful embed responses, and user-friendly features.

## Recent Changes
- **November 7, 2025**: Initial project setup
  - Created Discord bot with /bypass command
  - Implemented concurrent API calls to Ace Bypass, Bypass.vip, and EAS-X
  - Added dual-tier rate limiting system
  - Created loading and result embeds with buttons
  - Set up workflow for bot execution

## Features
- **Multi-API Bypass**: Queries 3 APIs simultaneously (Ace Bypass, Bypass.vip, EAS-X) and returns fastest result
- **Rate Limiting**: 
  - 5 bypasses per 5 hours per user
  - 2 bypasses per 20 seconds per user
- **Beautiful Embeds**: 
  - Loading state with red loading indicator
  - Result display with verified emoji
  - Shows API used and time taken
  - Mobile-friendly formatting with backticks
- **Interactive Buttons**:
  - Join Server button (server-wide, visible to all)
  - Copy button (sends ephemeral message to user only)
- **Smart Error Handling**: Normalizes "not supported" messages

## Project Architecture
```
discord-bypasser-bot/
├── index.js          # Main bot file with all logic
├── package.json      # Node.js dependencies
├── .gitignore        # Git ignore rules
└── replit.md         # This documentation file
```

## Configuration Required
1. **DISCORD_TOKEN**: Your Discord bot token (required)
2. **EAS_API_KEY**: Your EAS-X API key (needs to be added to index.js)
3. **INVITE_LINK**: Your Discord server invite link (optional, defaults to placeholder)

## API Keys (Hardcoded as per requirements)
- Ace Bypass: `h3vbEwBwyvvUybAP2012Cg`
- Bypass.vip: `c91a67e9-6945-4e93-96f5-e2f6eaf9c382`
- EAS-X: Needs to be configured

## Running the Bot
The bot runs automatically via the workflow. Make sure to set the required environment variables before starting.

## Commands
- `/bypass <url>` - Bypass a URL using multiple APIs with automatic fallback
