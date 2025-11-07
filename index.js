const { Client, GatewayIntentBits, SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const axios = require('axios');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages
    ]
});

const rateLimits = new Map();
const RATE_LIMIT_5_HOURS = 5 * 60 * 60 * 1000;
const RATE_LIMIT_20_SECONDS = 20 * 1000;
const MAX_USES_5_HOURS = 5;
const MAX_USES_20_SECONDS = 2;

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const INVITE_LINK = process.env.INVITE_LINK || 'https://discord.gg/yourserver';

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
                    'eas-api-key': 'YOUR_EAS_API_KEY_HERE',
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
            uses5Hours: [],
            uses20Seconds: []
        });
    }
    
    const userLimits = rateLimits.get(userId);
    
    userLimits.uses5Hours = userLimits.uses5Hours.filter(time => now - time < RATE_LIMIT_5_HOURS);
    userLimits.uses20Seconds = userLimits.uses20Seconds.filter(time => now - time < RATE_LIMIT_20_SECONDS);
    
    if (userLimits.uses5Hours.length >= MAX_USES_5_HOURS) {
        const oldestUse = userLimits.uses5Hours[0];
        const timeLeft = RATE_LIMIT_5_HOURS - (now - oldestUse);
        const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
        const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
        return { allowed: false, message: `Rate limit exceeded! You've used 5 bypasses in the last 5 hours. Try again in ${hoursLeft}h ${minutesLeft}m.` };
    }
    
    if (userLimits.uses20Seconds.length >= MAX_USES_20_SECONDS) {
        const oldestUse = userLimits.uses20Seconds[0];
        const timeLeft = RATE_LIMIT_20_SECONDS - (now - oldestUse);
        const secondsLeft = Math.ceil(timeLeft / 1000);
        return { allowed: false, message: `Slow down! You can only use 2 bypasses per 20 seconds. Try again in ${secondsLeft}s.` };
    }
    
    userLimits.uses5Hours.push(now);
    userLimits.uses20Seconds.push(now);
    
    return { allowed: true };
}

async function bypassUrl(url) {
    const startTime = Date.now();
    
    const apiCalls = Object.entries(API_CONFIGS).map(([key, config]) => {
        return config.call(url)
            .then(result => ({
                success: true,
                apiName: config.name,
                result: result,
                time: Date.now() - startTime
            }))
            .catch(error => ({
                success: false,
                apiName: config.name,
                error: error.message,
                time: Date.now() - startTime
            }));
    });
    
    const results = await Promise.all(apiCalls);
    
    const successfulResult = results.find(r => r.success);
    
    if (successfulResult) {
        return successfulResult;
    }
    
    return {
        success: false,
        apiName: 'All APIs',
        error: 'All APIs failed',
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

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);
    
    const commands = [
        new SlashCommandBuilder()
            .setName('bypass')
            .setDescription('Bypass a URL using multiple APIs')
            .addStringOption(option =>
                option.setName('url')
                    .setDescription('The URL to bypass')
                    .setRequired(true)
            )
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
                .setDescription('🔴 Processing your bypass request...')
                .setTimestamp();
            
            await interaction.reply({ embeds: [loadingEmbed] });
            
            try {
                const result = await bypassUrl(url);
                
                let resultEmbed;
                const buttons = new ActionRowBuilder();
                
                if (result.success) {
                    const bypassedUrl = extractBypassedUrl(result.result, result.apiName);
                    
                    resultEmbed = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle('✅ Bypass Successful')
                        .setDescription(`**Result:** \`${bypassedUrl}\``)
                        .addFields(
                            { name: 'API Used', value: result.apiName, inline: true },
                            { name: 'Time Taken', value: `${result.time}ms`, inline: true }
                        )
                        .setTimestamp();
                    
                    buttons.addComponents(
                        new ButtonBuilder()
                            .setLabel('Join Server')
                            .setStyle(ButtonStyle.Link)
                            .setURL(INVITE_LINK),
                        new ButtonBuilder()
                            .setCustomId(`copy_${bypassedUrl}`)
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
                            { name: 'Time Taken', value: `${result.time}ms`, inline: true }
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
                console.error('Error during bypass:', error);
                
                const errorEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('❌ Error')
                    .setDescription('An unexpected error occurred while processing your request.')
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [errorEmbed] });
            }
        }
    } else if (interaction.isButton()) {
        if (interaction.customId.startsWith('copy_')) {
            const url = interaction.customId.replace('copy_', '');
            
            await interaction.reply({
                content: url,
                ephemeral: true
            });
        }
    }
});

if (!DISCORD_TOKEN) {
    console.error('ERROR: DISCORD_TOKEN environment variable is not set!');
    console.log('Please add your Discord bot token as an environment secret named DISCORD_TOKEN');
    process.exit(1);
}

client.login(DISCORD_TOKEN);
