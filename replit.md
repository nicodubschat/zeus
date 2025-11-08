# Discord Bypasser Bot

## Overview
A high-performance Discord bot that bypasses URLs using three different APIs with a fallback system. The bot tries Ace Bypass first, then falls back to EAS-X, then Bypass.vip. It includes comprehensive rate limiting, beautiful embed responses, and user-friendly features.

## Recent Changes
- **November 8, 2025**: Major feature update
  - Added streaming status showing "/help | Uptime: X" with auto-updates every 30 seconds
  - Created /help command with comprehensive usage guide
  - Created /panel command with interactive modal for bypassing links
  - Created /supported command showing all 55 bypass services organized
  - Created /info command showing server count and total bypasses
  - Updated rate limiting: 5 bypasses per 11 hours, 1 bypass per 25 seconds
  - Fixed autobypass to delete ALL messages instantly (not just links)
  - Added total bypass counter tracking
  - Removed hardcoded EAS-X API key for security
- **November 7, 2025**: Initial project setup
  - Created Discord bot with /bypass command
  - Implemented fallback system: Ace Bypass (primary) → EAS-X → Bypass.vip
  - Added dual-tier rate limiting system
  - Created loading and result embeds with custom emojis
  - Set up workflow for bot execution
  - Added time formatting (seconds/minutes instead of milliseconds)
  - Fixed button custom ID length limit issue

## Features
- **Streaming Status**: Shows "/help | Uptime: X" with live uptime updates every 30 seconds
- **Fallback System**: Tries APIs in order: Ace Bypass → EAS-X → Bypass.vip
- **Rate Limiting**: 
  - 5 bypasses per 11 hours per user
  - 1 bypass per 25 seconds per user
- **Auto-Bypass Mode**: Instantly deletes ALL messages in enabled channels, only bypasses if URLs detected
- **Beautiful Embeds**: 
  - Loading state with custom animated red loading emoji
  - Result display with custom verified emoji
  - Shows API used and time taken (formatted as seconds/minutes)
  - Mobile-friendly formatting with backticks
- **Interactive Buttons**:
  - Join Server button (https://discord.gg/zeus - server-wide, visible to all)
  - Copy button (sends ephemeral message to user only)
- **Panel Modal**: Interactive bypass panel with modal input for URLs
- **Statistics Tracking**: Tracks total bypasses and server count
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
2. **EAS_API_KEY**: Your EAS-X API key (required for EAS-X fallback)
3. **INVITE_LINK**: Your Discord server invite link (optional, defaults to https://discord.gg/zeus)
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
- `/autobypass` - Toggle automatic bypass mode for the current channel (deletes ALL messages)
- `/help` - View comprehensive guide on how to use the bot
- `/panel` - Send an interactive bypass panel with modal input
- `/supported` - View all 55 supported bypass services
- `/info` - View bot statistics (server count and total bypasses)
