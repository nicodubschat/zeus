const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const rateLimits = new Map();
const bypassedUrls = new Map();
const autoBypassChannels = new Map();
const pendingBypassRequests = new Map();
const RATE_LIMIT_11_HOURS = 11 * 60 * 60 * 1000;
const RATE_LIMIT_25_SECONDS = 25 * 1000;
const MAX_USES_11_HOURS = 5;
const MAX_USES_25_SECONDS = 1;
let botStartTime = Date.now();
let totalBypassCount = 0;

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const INVITE_LINK = process.env.INVITE_LINK || 'https://discord.gg/zeus';
const EAS_API_KEY = process.env.EAS_API_KEY;

const RED_LOADING_EMOJI = process.env.RED_LOADING_EMOJI || '<a:red_loading:1436149376841154571>';
const VERIFIED_RED_EMOJI = process.env.VERIFIED_RED_EMOJI || '<a:verifiedred:1436149172603715624>';

const SUPPORTED_BYPASSES = [
    "Delta", "Krnl", "Pandadev", "Codex", "Trigon", "bit.do", "bit.ly", "blox-script",
    "boost-ink-and-bst-gg", "bstshrt", "cl.gy", "cuttlinks", "cuty-cuttlinks", "getpolsec",
    "goo.gl", "is.gd", "keyguardian", "ldnesfspublic", "link-hub.net", "link-unlock-complete",
    "link4m.com", "link4sub", "linkunlocker", "linkvertise", "lockr", "loot-links", "mboost",
    "mediafire", "nicuse-getkey", "overdrivehub", "paste-drop", "pastebin", "paster-so",
    "pastes_io", "quartyz", "rebrand.ly", "rekonise", "rinku-pro", "rkns.link",
    "shorteners-and-direct", "shorter.me", "socialwolvez", "sub2get", "sub2unlock",
    "sub4unlock.com", "subfinal", "t.co", "t.ly", "tiny.cc", "tinylink.onl", "tinyurl.com",
    "tpi.li key-system", "v.gd", "work-ink", "ytsubme"
];

function formatElapsedTime(startTime) {
    const elapsed = Date.now() - startTime;
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
        return `${days}d ${hours % 24}h ${minutes % 60}m`;
    } else if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

function updateBotStatus() {
    const elapsedTime = formatElapsedTime(botStartTime);
    client.user.setPresence({
        activities: [{
            name: `/help | Uptime: ${elapsedTime}`,
            type: 1,
            url: 'https://twitch.tv/discord'
        }],
        status: 'online'
    });
}

const API_CONFIGS = {
    aceBypass: {
        name: 'Ace Bypass',
        call: async (url) => {
            const response = await axios.get('http://ace-bypass.com/api/bypass', {
                params: {
                    url: url,
                    apikey: 'h3vbEwBwyvvUybAP2012Cg'
                },
                timeout: 30000
            });
            return response.data;
        }
    },
    bypassVip: {
        name: 'Bypass.vip',
        call: async (url) => {
            const response = await axios.get('https://api.bypass.vip/premium/bypass', {
                params: { url: url },
                headers: {
                    'x-api-key': 'c91a67e9-6945-4e93-96f5-e2f6eaf9c382'
                },
                timeout: 30000
            });
            return response.data;
        }
    },
    easX: {
        name: 'EAS-X',
        call: async (url) => {
            const response = await axios.post('https://api.eas-x.com/v3/bypass', {
                url: url
            }, {
                headers: {
                    'eas-api-key': EAS_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            });
            return response.data;
        }
    }
};

function checkRateLimit(userId) {
    const now = Date.now();
    
    if (!rateLimits.has(userId)) {
        rateLimits.set(userId, {
            uses11Hours: [],
            uses25Seconds: []
        });
    }
    
    const userLimits = rateLimits.get(userId);
    
    userLimits.uses11Hours = userLimits.uses11Hours.filter(time => now - time < RATE_LIMIT_11_HOURS);
    userLimits.uses25Seconds = userLimits.uses25Seconds.filter(time => now - time < RATE_LIMIT_25_SECONDS);
    
    if (userLimits.uses11Hours.length >= MAX_USES_11_HOURS) {
        const oldestUse = userLimits.uses11Hours[0];
        const timeLeft = RATE_LIMIT_11_HOURS - (now - oldestUse);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return { allowed: false, message: `⚠️ **Max limit reached!** You've used 5 bypasses in the last 11 hours. Please wait ${hoursLeft}h ${minutesLeft}m before trying again.` };
    }
    
    if (userLimits.uses25Seconds.length >= MAX_USES_25_SECONDS) {
        const oldestUse = userLimits.uses25Seconds[0];
        const timeLeft = RATE_LIMIT_25_SECONDS - (now - oldestUse);
        const secondsLeft = Math.ceil(timeLeft / 1000);
        return { allowed: false, message: `⏳ **Please wait!** You can only use 1 bypass every 25 seconds. Try again in ${secondsLeft} seconds.` };
    }
    
    userLimits.uses11Hours.push(now);
    userLimits.uses25Seconds.push(now);
    
    return { allowed: true };
}

async function bypassUrl(url) {
    const startTime = Date.now();
    totalBypassCount++;
    
    const apiOrder = [
        { key: 'aceBypass', config: API_CONFIGS.aceBypass },
        { key: 'easX', config: API_CONFIGS.easX },
        { key: 'bypassVip', config: API_CONFIGS.bypassVip }
    ];
    
    for (const { key, config } of apiOrder) {
        try {
            const result = await config.call(url);
            return {
                success: true,
                apiName: config.name,
                result: result,
                time: Date.now() - startTime
            };
        } catch (error) {
            console.log(`${config.name} failed:`, error.message);
            continue;
        }
    }
    
    return {
        success: false,
        apiName: 'All APIs',
        error: 'All bypass APIs failed. The link may not be supported.',
        time: Date.now() - startTime
    };
}

function extractBypassedUrl(apiResult, apiName) {
    if (!apiResult) return null;
    
    if (apiName === 'Ace Bypass') {
        return apiResult.destination || apiResult.url || apiResult.result;
    } else if (apiName === 'Bypass.vip') {
        return apiResult.destination || apiResult.result || apiResult.url;
    } else if (apiName === 'EAS-X') {
        return apiResult.url || apiResult.destination || apiResult.result;
    }
    
    if (typeof apiResult === 'string') return apiResult;
    if (apiResult.destination) return apiResult.destination;
    if (apiResult.url) return apiResult.url;
    if (apiResult.result) return apiResult.result;
    
    return null;
}

function normalizeErrorMessage(error) {
    const errorLower = error.toLowerCase();
    if (errorLower.includes('not supported') || errorLower.includes('unsupported') || /\d+/.test(error)) {
        return 'Link not supported';
    }
    return error;
}

function formatTime(milliseconds) {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
        return `${minutes}m ${remainingSeconds}s`;
    } else if (seconds > 0) {
        return `${seconds}s`;
    } else {
        return `${milliseconds}ms`;
    }
}

function extractUrls(text) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = text.match(urlRegex);
    return matches || [];
}

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    botStartTime = Date.now();
    
    updateBotStatus();
    setInterval(updateBotStatus, 30000);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('bypass')
            .setDescription('Bypass a URL using multiple APIs')
            .addStringOption(option =>
                option.setName('url')
                    .setDescription('The URL to bypass')
                    .setRequired(true)
            ),
        new SlashCommandBuilder()
            .setName('autobypass')
            .setDescription('Toggle automatic bypass mode for this channel'),
        new SlashCommandBuilder()
            .setName('help')
            .setDescription('Learn how to use the bypass bot'),
        new SlashCommandBuilder()
            .setName('panel')
            .setDescription('Send a bypass panel in this channel'),
        new SlashCommandBuilder()
            .setName('supported')
            .setDescription('View all supported bypass services'),
        new SlashCommandBuilder()
            .setName('info')
            .setDescription('View bot statistics')
    ];
    
    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    
    try {
        console.log('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(client.user.id),
            { body: commands }
        );
        console.log('Slash commands registered successfully!');
    } catch (error) {
        console.error('Error registering commands:', error);
    }
});

client.on('interactionCreate', async (interaction) => {
    if (interaction.isCommand()) {
        if (interaction.commandName === 'bypass') {
            const url = interaction.options.getString('url');
            const userId = interaction.user.id;
            
            const rateLimitCheck = checkRateLimit(userId);
            if (!rateLimitCheck.allowed) {
                return interaction.reply({
                    content: rateLimitCheck.message,
                    ephemeral: true
                });
            }
            
            const loadingEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`${RED_LOADING_EMOJI} Processing your bypass request...`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [loadingEmbed] });
            
            try {
                const result = await bypassUrl(url);
                
                let resultEmbed;
                const buttons = new ActionRowBuilder();
                
                if (result.success) {
                    const bypassedUrl = extractBypassedUrl(result.result, result.apiName);
                    
                    const urlId = `${userId}_${Date.now()}`;
                    bypassedUrls.set(urlId, bypassedUrl);
                    
                    resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(`${VERIFIED_RED_EMOJI} Bypass Successful`)
                        .setDescription(`**Result:** \`${bypassedUrl}\``)
                        .addFields(
                            { name: 'API Used', value: result.apiName, inline: true },
                            { name: 'Time Taken', value: formatTime(result.time), inline: true }
                        )
                        .setTimestamp();
                    
                    buttons.addComponents(
                        new ButtonBuilder()
                            .setLabel('Join Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL(INVITE_LINK),
                        new ButtonBuilder()
                            .setCustomId(`copy_${urlId}`)
                            .setLabel('Copy')
                            .setStyle(ButtonStyle.Primary)
                    );
                } else {
                    const errorMsg = normalizeErrorMessage(result.error);
                    
                    resultEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Bypass Failed')
                        .setDescription(`**Result:** ${errorMsg}`)
                        .addFields(
                            { name: 'API Used', value: result.apiName, inline: true },
                            { name: 'Time Taken', value: formatTime(result.time), inline: true }
                        )
                        .setTimestamp();
                    
                    buttons.addComponents(
                        new ButtonBuilder()
                            .setLabel('Join Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL(INVITE_LINK)
                    );
                }
                
                await interaction.editReply({
                    embeds: [resultEmbed],
                    components: [buttons]
                });
                
            } catch (error) {
                console.error('Error during bypass:');
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
                console.error('Full error:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred while processing your request.')
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        } else if (interaction.commandName === 'autobypass') {
            const channelId = interaction.channelId;
            
            if (autoBypassChannels.has(channelId)) {
                autoBypassChannels.delete(channelId);
                await interaction.reply({
                    content: '✅ Auto-bypass mode has been **disabled** for this channel.',
                    ephemeral: true
                });
            } else {
                autoBypassChannels.set(channelId, true);
                await interaction.reply({
                    content: '✅ Auto-bypass mode has been **enabled** for this channel.\n\n📌 **How it works:**\n- Send any link and it will be automatically bypassed\n- All user messages (links or not) will be deleted\n- Only bot bypass results will remain in the channel',
                    ephemeral: true
                });
            }
        } else if (interaction.commandName === 'help') {
            const helpEmbed = new EmbedBuilder()
                .setColor('#0099FF')
                .setTitle('📖 Bypass Bot - Help Guide')
                .setDescription('Learn how to use the bypass bot to bypass various URL shorteners and key systems.')
                .addFields(
                    { 
                        name: '🔗 /bypass <url>', 
                        value: 'Bypass a single URL. The bot will attempt to bypass the link using multiple APIs.\n**Example:** `/bypass https://example.com/shortened-link`' 
                    },
                    { 
                        name: '🤖 /autobypass', 
                        value: 'Toggle auto-bypass mode in the current channel. When enabled, any message with a link will be automatically bypassed and deleted.\n**Note:** All messages in this channel will be deleted automatically.' 
                    },
                    { 
                        name: '📋 /panel', 
                        value: 'Send a bypass panel in the channel. Click the "Bypass Link" button to submit your link for bypassing.' 
                    },
                    { 
                        name: '📜 /supported', 
                        value: 'View a list of all supported bypass services and shorteners.' 
                    },
                    { 
                        name: '⚠️ Rate Limits', 
                        value: '• **5 bypasses** every **11 hours**\n• **1 bypass** every **25 seconds**' 
                    }
                )
                .setFooter({ text: 'Need more help? Join our server!' })
                .setTimestamp();
            
            const helpButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setLabel('Join Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL(INVITE_LINK)
                );
            
            await interaction.reply({ embeds: [helpEmbed], components: [helpButton], ephemeral: true });
            
        } else if (interaction.commandName === 'panel') {
            const panelEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔓 Bypass Panel')
                .setDescription('Click the button below to bypass your link!')
                .setTimestamp();
            
            const panelButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('bypass_panel_button')
                        .setLabel('Bypass Link')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🔗')
                );
            
            await interaction.reply({ embeds: [panelEmbed], components: [panelButton] });
            
        } else if (interaction.commandName === 'supported') {
            const column1 = SUPPORTED_BYPASSES.slice(0, 20);
            const column2 = SUPPORTED_BYPASSES.slice(20, 40);
            const column3 = SUPPORTED_BYPASSES.slice(40);
            
            const fields = [
                { 
                    name: '📌 Services 1-20', 
                    value: column1.map((service, i) => `\`${i + 1}.\` ${service}`).join('\n'), 
                    inline: false 
                }
            ];
            
            if (column2.length > 0) {
                fields.push({ 
                    name: '📌 Services 21-40', 
                    value: column2.map((service, i) => `\`${i + 21}.\` ${service}`).join('\n'), 
                    inline: false 
                });
            }
            
            if (column3.length > 0) {
                fields.push({ 
                    name: `📌 Services 41-${SUPPORTED_BYPASSES.length}`, 
                    value: column3.map((service, i) => `\`${i + 41}.\` ${service}`).join('\n'), 
                    inline: false 
                });
            }
            
            const supportedEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Supported Bypass Services')
                .setDescription(`**Total Services:** ${SUPPORTED_BYPASSES.length}\n\nOur bot supports bypassing the following services:`)
                .addFields(fields)
                .setFooter({ text: 'These services are supported by our bypass APIs' })
                .setTimestamp();
            
            await interaction.reply({ embeds: [supportedEmbed], ephemeral: true });
        } else if (interaction.commandName === 'info') {
            const serverCount = client.guilds.cache.size;
            
            const infoEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('📊 Bot Statistics')
                .addFields(
                    { name: '🌐 Server Count', value: `${serverCount}`, inline: true },
                    { name: '🔗 Total Bypasses', value: `${totalBypassCount}`, inline: true }
                )
                .setTimestamp();
            
            await interaction.reply({ embeds: [infoEmbed] });
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('copy_')) {
            const urlId = interaction.customId.replace('copy_', '');
            const url = bypassedUrls.get(urlId);
            
            if (url) {
                await interaction.reply({
                    content: url,
                    ephemeral: true
                });
            } else {
                await interaction.reply({
                    content: 'This link has expired. Please run /bypass again.',
                    ephemeral: true
                });
            }
        } else if (interaction.customId === 'bypass_panel_button') {
            const modal = new ModalBuilder()
                .setCustomId('bypass_modal')
                .setTitle('🔓 Bypass Your Link');
            
            const urlInput = new TextInputBuilder()
                .setCustomId('bypass_url_input')
                .setLabel('Enter the URL to bypass')
                .setPlaceholder('https://example.com/your-link')
                .setStyle(TextInputStyle.Short)
                .setRequired(true);
            
            const actionRow = new ActionRowBuilder().addComponents(urlInput);
            modal.addComponents(actionRow);
            
            await interaction.showModal(modal);
        }
    } else if (interaction.isModalSubmit()) {
        if (interaction.customId === 'bypass_modal') {
            const url = interaction.fields.getTextInputValue('bypass_url_input');
            const userId = interaction.user.id;
            
            const rateLimitCheck = checkRateLimit(userId);
            if (!rateLimitCheck.allowed) {
                return interaction.reply({
                    content: rateLimitCheck.message,
                    ephemeral: true
                });
            }
            
            const loadingEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setDescription(`${RED_LOADING_EMOJI} Processing your bypass request...`)
                .setTimestamp();
            
            await interaction.reply({ embeds: [loadingEmbed] });
            
            try {
                const result = await bypassUrl(url);
                
                let resultEmbed;
                const buttons = new ActionRowBuilder();
                
                if (result.success) {
                    const bypassedUrl = extractBypassedUrl(result.result, result.apiName);
                    
                    const urlId = `${userId}_${Date.now()}`;
                    bypassedUrls.set(urlId, bypassedUrl);
                    
                    resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(`${VERIFIED_RED_EMOJI} Bypass Successful`)
                        .setDescription(`**Result:** \`${bypassedUrl}\``)
                        .addFields(
                            { name: 'API Used', value: result.apiName, inline: true },
                            { name: 'Time Taken', value: formatTime(result.time), inline: true }
                        )
                        .setTimestamp();
                    
                    buttons.addComponents(
                        new ButtonBuilder()
                            .setLabel('Join Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL(INVITE_LINK),
                        new ButtonBuilder()
                            .setCustomId(`copy_${urlId}`)
                            .setLabel('Copy')
                            .setStyle(ButtonStyle.Primary)
                    );
                } else {
                    const errorMsg = normalizeErrorMessage(result.error);
                    
                    resultEmbed = new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle('❌ Bypass Failed')
                        .setDescription(`**Result:** ${errorMsg}`)
                        .addFields(
                            { name: 'API Used', value: result.apiName, inline: true },
                            { name: 'Time Taken', value: formatTime(result.time), inline: true }
                        )
                        .setTimestamp();
                    
                    buttons.addComponents(
                        new ButtonBuilder()
                            .setLabel('Join Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL(INVITE_LINK)
                    );
                }
                
                await interaction.editReply({
                    embeds: [resultEmbed],
                    components: [buttons]
                });
                
            } catch (error) {
                console.error('Error during panel bypass:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred while processing your request.')
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    }
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    
    const channelId = message.channelId;
    
    if (autoBypassChannels.has(channelId)) {
        try {
            await message.delete();
        } catch (error) {
            console.error('Error deleting message:', error);
        }
        
        const urls = extractUrls(message.content);
        
        if (urls.length === 0) {
            return;
        }
        
        const userId = message.author.id;
        
        const rateLimitCheck = checkRateLimit(userId);
        if (!rateLimitCheck.allowed) {
            const rateLimitMsg = await message.channel.send(rateLimitCheck.message);
            setTimeout(() => {
                rateLimitMsg.delete().catch(console.error);
            }, 10000);
            return;
        }
        
        const url = urls[0];
        
        const loadingEmbed = new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`${RED_LOADING_EMOJI} Processing bypass for <@${userId}>...`)
            .setTimestamp();
        
        const loadingMessage = await message.channel.send({ embeds: [loadingEmbed] });
        
        try {
            const result = await bypassUrl(url);
            
            let resultEmbed;
            const buttons = new ActionRowBuilder();
            
            if (result.success) {
                const bypassedUrl = extractBypassedUrl(result.result, result.apiName);
                
                const urlId = `${userId}_${Date.now()}`;
                bypassedUrls.set(urlId, bypassedUrl);
                
                resultEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(`${VERIFIED_RED_EMOJI} Bypass Successful`)
                    .setDescription(`**Result:** \`${bypassedUrl}\`\n**Requested by:** <@${userId}>`)
                    .addFields(
                        { name: 'API Used', value: result.apiName, inline: true },
                        { name: 'Time Taken', value: formatTime(result.time), inline: true }
                    )
                    .setTimestamp();
                
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel('Join Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL(INVITE_LINK),
                    new ButtonBuilder()
                        .setCustomId(`copy_${urlId}`)
                        .setLabel('Copy')
                        .setStyle(ButtonStyle.Primary)
                );
            } else {
                const errorMsg = normalizeErrorMessage(result.error);
                
                resultEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Bypass Failed')
                    .setDescription(`**Result:** ${errorMsg}\n**Requested by:** <@${userId}>`)
                    .addFields(
                        { name: 'API Used', value: result.apiName, inline: true },
                        { name: 'Time Taken', value: formatTime(result.time), inline: true }
                    )
                    .setTimestamp();
                
                buttons.addComponents(
                    new ButtonBuilder()
                        .setLabel('Join Server')
                        .setStyle(ButtonStyle.Link)
                        .setURL(INVITE_LINK)
                );
            }
            
            await loadingMessage.edit({
                embeds: [resultEmbed],
                components: [buttons]
            });
            
        } catch (error) {
            console.error('Error during auto-bypass:', error);
            
            const errorEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('❌ Error')
                .setDescription('An unexpected error occurred while processing your request.')
                .setTimestamp();
            
            await loadingMessage.edit({ embeds: [errorEmbed] });
        }
    }
});

if (!DISCORD_TOKEN) {
    console.error('ERROR: DISCORD_TOKEN environment variable is not set!');
    console.log('Please add your Discord bot token as an environment secret named DISCORD_TOKEN');
    process.exit(1);
}

client.login(DISCORD_TOKEN);
