# Discord Bypasser Bot

## Overview
A high-performance Discord bot that bypasses URLs using three different APIs with a fallback system. The bot tries Ace Bypass first, then falls back to EAS-X, then Bypass.vip. It includes comprehensive rate limiting, beautiful embed responses, and user-friendly features.

## Recent Changes
- **November 7, 2025**: Initial project setup
  - Created Discord bot with /bypass command
  - Implemented fallback system: Ace Bypass (primary) → EAS-X → Bypass.vip
  - Added dual-tier rate limiting system
  - Created loading and result embeds with custom emojis
  - Set up workflow for bot execution
  - Added time formatting (seconds/minutes instead of milliseconds)
  - Fixed button custom ID length limit issue

## Features
- **Fallback System**: Tries APIs in order: Ace Bypass → EAS-X → Bypass.vip
- **Rate Limiting**: 
  - 5 bypasses per 5 hours per user
  - 2 bypasses per 20 seconds per user
- **Beautiful Embeds**: 
  - Loading state with custom animated red loading emoji
  - Result display with custom verified emoji
  - Shows API used and time taken (formatted as seconds/minutes)
  - Mobile-friendly formatting with backticks
- **Interactive Buttons**:
  - Join Server button (https://discord.gg/zeus - server-wide, visible to all)
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
2. **EAS_API_KEY**: Your EAS-X API key (optional, if not using EAS-X API)
3. **INVITE_LINK**: Your Discord server invite link (optional, defaults to placeholder)
4. **RED_LOADING_EMOJI**: Custom emoji for loading state (optional, format: `<a:red_loading:emoji_id>`)
5. **VERIFIED_RED_EMOJI**: Custom emoji for success state (optional, format: `<:verifiedred:emoji_id>`)

### How to Get Custom Emoji IDs:
1. In Discord, type `\:emoji_name:` to get the full emoji code with ID
2. Copy the emoji ID from the format `<:emoji_name:123456789>`
3. Add as environment variables or update the defaults in index.js

## API Keys (Hardcoded as per requirements)
- Ace Bypass: `h3vbEwBwyvvUybAP2012Cg`
- Bypass.vip: `c91a67e9-6945-4e93-96f5-e2f6eaf9c382`
- EAS-X: Needs to be configured

## Running the Bot
The bot runs automatically via the workflow. Make sure to set the required environment variables before starting.

## Commands
- `/bypass <url>` - Bypass a URL using multiple APIs with automatic fallback
