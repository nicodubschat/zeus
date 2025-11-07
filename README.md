# Discord Bypasser Bot

A high-performance Discord bot that bypasses URLs using three APIs concurrently and returns the fastest result.

## Features

✨ **Multi-API Support**: Queries Ace Bypass, Bypass.vip, and EAS-X simultaneously  
⚡ **Speed Optimized**: Returns the fastest successful result  
🛡️ **Rate Limited**: Prevents abuse with dual-tier rate limiting  
🎨 **Beautiful Embeds**: Custom loading and success states with emojis  
📱 **Mobile Friendly**: Results formatted with backticks for easy copying  
🔘 **Interactive Buttons**: Join server and copy result functionality  

## Setup Instructions

### 1. Create a Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section and click "Add Bot"
4. Enable these Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token (you'll need this for step 3)

### 2. Invite the Bot to Your Server

1. Go to OAuth2 → URL Generator in the Developer Portal
2. Select scopes: `bot` and `applications.commands`
3. Select bot permissions: `Send Messages`, `Embed Links`, `Use Slash Commands`
4. Copy the generated URL and open it to invite the bot

### 3. Configure Environment Secrets

Add these secrets in Replit (Tools → Secrets):

- **DISCORD_TOKEN** (required): Your bot token from step 1
- **EAS_API_KEY** (optional): Your EAS-X API key if you have one
- **INVITE_LINK** (optional): Your Discord server invite link for the "Join Server" button
- **RED_LOADING_EMOJI** (optional): Custom loading emoji (format: `<a:red_loading:emoji_id>`)
- **VERIFIED_RED_EMOJI** (optional): Custom success emoji (format: `<:verifiedred:emoji_id>`)

### 4. Run the Bot

The bot will start automatically. Look for the "Logged in as..." message in the console.

## Commands

- `/bypass <url>` - Bypass a URL using multiple APIs

## Rate Limits

- **5 bypasses per 5 hours** per user
- **2 bypasses per 20 seconds** per user

## How It Works

1. User runs `/bypass` command with a URL
2. Bot shows loading embed with animated emoji
3. Bot queries all 3 APIs simultaneously
4. Bot returns the **fastest successful** result
5. Result includes:
   - The bypassed URL (with backticks for mobile)
   - API that succeeded
   - Time taken in milliseconds
   - Join Server button (visible to everyone)
   - Copy button (sends ephemeral message to user only)

## API Keys (Hardcoded)

- **Ace Bypass**: `h3vbEwBwyvvUybAP2012Cg`
- **Bypass.vip**: `c91a67e9-6945-4e93-96f5-e2f6eaf9c382`
- **EAS-X**: Configure via environment variable

## Troubleshooting

**Bot doesn't respond to commands:**
- Make sure the bot is online (check console)
- Verify DISCORD_TOKEN is set correctly
- Wait a few minutes for commands to register globally

**Emojis show as text:**
- The custom emojis need to exist in your server
- Update the emoji IDs in environment variables
- Or use default Unicode emojis by not setting the variables

**All APIs fail:**
- Check if the URLs are supported by the bypass services
- Verify API keys are correct
- Check internet connectivity

## Support

For issues or questions, join the support server using the "Join Server" button on any bypass result!
