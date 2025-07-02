// Import necessary modules
const { Client, GatewayIntentBits, EmbedBuilder, Collection, REST, Routes, MessageFlags } = require('discord.js');
const { config } = require('dotenv'); // For loading environment variables
const fs = require('node:fs'); // For file system operations (giveaways.json)
const path = require('node:path'); // For resolving file paths

// Load environment variables from the .env file
config();

// --- Configuration ---
// Bot token loaded from environment variables
const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// The ID of the channel where the status message should be updated.
// Loaded from environment variables.
const ONLINE_STATUS_CHANNEL_ID = process.env.ONLINE_STATUS_CHANNEL_ID ? BigInt(process.env.ONLINE_STATUS_CHANNEL_ID) : null;

// The ID of the channel for bot logs.
// Loaded from environment variables.
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID ? BigInt(process.env.LOG_CHANNEL_ID) : null;

// Invite link for the support server loaded from environment variables
const OFFICIAL_SERVER_INVITE = process.env.OFFICIAL_SERVER_INVITE;

// Client ID for the bot loaded from environment variables (for the invite link)
const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;

// Filename for storing giveaways
const GIVEAWAYS_FILE = path.resolve(__dirname, 'giveaways.json');

// --- Bot Initialization ---
// Create a new Discord client instance with necessary intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, // Required for guild-related events (e.g., slash commands)
        GatewayIntentBits.GuildMessages, // Required for messages
        GatewayIntentBits.MessageContent, // Required for accessing message content (if needed, good practice for commands)
        GatewayIntentBits.GuildMessageReactions, // Required for reactions (giveaway entry)
        GatewayIntentBits.GuildMembers // Required for fetching member data (for winner selection)
    ],
});

// Create a collection to store bot commands
client.commands = new Collection();

// --- Helper Functions ---

/**
 * Logs a message to a specific Discord channel.
 * @param {string} title - The title of the log message.
 * @param {string} description - The description/content of the log message.
 * @param {number} color - The color of the embed (hexadecimal number).
 */
async function logToChannel(title, description, color) {
    if (!LOG_CHANNEL_ID) {
        console.warn("WARNING: LOG_CHANNEL_ID is not set. Cannot send logs to Discord channel.");
        return;
    }
    try {
        const logChannel = await client.channels.fetch(LOG_CHANNEL_ID.toString());
        if (logChannel && logChannel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();
            await logChannel.send({ embeds: [embed] });
        } else {
            console.warn(`WARNING: Log channel with ID ${LOG_CHANNEL_ID} not found or is not a text channel.`);
        }
    } catch (error) {
        console.error(`Error sending log to channel: ${error.message}`);
    }
}

/**
 * Reads giveaway data from the JSON file.
 * @returns {Object} The giveaway data.
 */
function readGiveaways() {
    try {
        if (fs.existsSync(GIVEAWAYS_FILE)) {
            const data = fs.readFileSync(GIVEAWAYS_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error(`Error reading giveaways file: ${error.message}`);
        logToChannel("🚨 File Read Error", `Failed to read \`giveaways.json\`: \`\`\`${error.message}\`\`\``, 0xFF0000);
    }
    return {};
}

/**
 * Writes giveaway data to the JSON file.
 * @param {Object} data - The giveaway data to write.
 */
function writeGiveaways(data) {
    try {
        fs.writeFileSync(GIVEAWAYS_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing giveaways file: ${error.message}`);
        logToChannel("🚨 File Write Error", `Failed to write to \`giveaways.json\`: \`\`\`${error.message}\`\`\``, 0xFF0000);
    }
}

/**
 * Saves a new giveaway to the JSON file.
 * @param {string} messageId - The ID of the Discord message for the giveaway.
 * @param {string} channelId - The ID of the Discord channel the giveaway is in.
 * @param {string} guildId - The ID of the Discord guild (server) the giveaway is in.
 * @param {string} prize - The prize for the giveaway.
 * @param {number} winners - The number of winners.
 * @param {number} endsAt - Timestamp when the giveaway ends.
 */
function saveGiveaway(messageId, channelId, guildId, prize, winners, endsAt) {
    const giveaways = readGiveaways();
    giveaways[messageId] = { channelId, guildId, prize, winners, endsAt };
    writeGiveaways(giveaways);
    logToChannel("📢 Giveaway Saved", `New giveaway for "${prize}" (ID: ${messageId}) saved. Ends at <t:${Math.floor(endsAt / 1000)}:F>.`, 0x00FF00); // Green
}

/**
 * Deletes a giveaway from the JSON file.
 * @param {string} messageId - The ID of the giveaway message.
 */
function deleteGiveaway(messageId) {
    const giveaways = readGiveaways();
    if (giveaways[messageId]) {
        delete giveaways[messageId];
        writeGiveaways(giveaways);
        logToChannel("🗑️ Giveaway Deleted", `Giveaway with ID ${messageId} removed from storage.`, 0xFFA500); // Orange
    }
}

/**
 * Handles the end of a giveaway.
 * @param {string} messageId - The ID of the giveaway message.
 * @param {string} channelId - The ID of the channel the giveaway is in.
 * @param {string} guildId - The ID of the guild (server) the giveaway is in.
 * @param {string} prize - The prize for the giveaway.
 * @param {number} winners - The number of winners.
 */
async function endGiveaway(messageId, channelId, guildId, prize, winners) {
    try {
        const guild = await client.guilds.fetch(guildId);
        const channel = await guild.channels.fetch(channelId);
        const message = await channel.messages.fetch(messageId);

        if (!message) {
            deleteGiveaway(messageId);
            logToChannel("⚠️ Giveaway Not Found", `Attempted to end giveaway ${messageId}, but message was not found. Removed from storage.`, 0xFFFF00); // Yellow
            return;
        }

        // Fetch reactions to get participants
        const reaction = message.reactions.cache.get('🎉');
        if (!reaction) {
            // No reactions means no participants
            const noWinnersEmbed = new EmbedBuilder()
                .setTitle(`🎉 Giveaway Ended! 🎉`)
                .setDescription(`No one entered the giveaway for **${prize}**. Better luck next time!`)
                .setColor(0xFF0000) // Red
                .setFooter({ text: `Giveaway ID: ${messageId}` });
            await message.edit({ embeds: [noWinnersEmbed] });
            deleteGiveaway(messageId);
            logToChannel("❌ No Participants", `Giveaway for "${prize}" (ID: ${messageId}) ended with no participants.`, 0xFF0000);
            return;
        }

        const users = await reaction.users.fetch();
        const participants = users.filter(user => !user.bot); // Exclude bots
        const participantArray = Array.from(participants.values());

        if (participantArray.length === 0) {
            const noWinnersEmbed = new EmbedBuilder()
                .setTitle(`🎉 Giveaway Ended! 🎉`)
                .setDescription(`No one entered the giveaway for **${prize}**. Better luck next time!`)
                .setColor(0xFF0000) // Red
                .setFooter({ text: `Giveaway ID: ${messageId}` });
            await message.edit({ embeds: [noWinnersEmbed] });
            deleteGiveaway(messageId);
            logToChannel("❌ No Participants", `Giveaway for "${prize}" (ID: ${messageId}) ended with no participants.`, 0xFF0000);
            return;
        }

        // Select winners
        const actualWinners = Math.min(winners, participantArray.length);
        const selectedWinners = [];
        for (let i = 0; i < actualWinners; i++) {
            const randomIndex = Math.floor(Math.random() * participantArray.length);
            selectedWinners.push(participantArray.splice(randomIndex, 1)[0]);
        }

        const winnerMentions = selectedWinners.map(w => `<@${w.id}>`).join(', ');

        const winnerEmbed = new EmbedBuilder()
            .setTitle(`🎉 Giveaway Ended! 🎉`)
            .setDescription(`Congratulations to ${winnerMentions}!\nYou won **${prize}**!`)
            .setColor(0x00FF00) // Green
            .setFooter({ text: `Giveaway ID: ${messageId}` });

        await message.edit({ embeds: [winnerEmbed] });
        await channel.send(`Congratulations ${winnerMentions}! You won the **${prize}**!`);

        deleteGiveaway(messageId);
        logToChannel("✅ Giveaway Concluded", `Giveaway for "${prize}" (ID: ${messageId}) concluded. Winners: ${selectedWinners.map(w => w.tag).join(', ')}.`, 0x00FF00); // Green

    } catch (error) {
        console.error(`Error ending giveaway ${messageId}: ${error.message}`);
        logToChannel("🚨 Giveaway End Error", `An error occurred while ending giveaway ${messageId} for "${prize}": \`\`\`${error.message}\`\`\``, 0xFF0000); // Red
        deleteGiveaway(messageId); // Attempt to remove even if error
    }
}

/**
 * Checks for ongoing giveaways and ends them if their time has expired.
 */
async function checkGiveaways() {
    const giveaways = readGiveaways();
    const now = Date.now();

    for (const messageId in giveaways) {
        const giveaway = giveaways[messageId];
        if (now >= giveaway.endsAt) {
            console.log(`Ending giveaway: ${messageId} for ${giveaway.prize}`);
            await endGiveaway(messageId, giveaway.channelId, giveaway.guildId, giveaway.prize, giveaway.winners);
        }
    }
}

// --- Bot Events ---

// When the client is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag} (${client.user.id}) ✨`);
    logToChannel("🚀 Bot Online", `Logged in as **${client.user.tag}** (ID: ${client.user.id})`, 0x0000FF); // Blue

    // Register slash commands
    const commands = [
        {
            name: 'giveaway',
            description: 'Manages giveaways.',
            options: [
                {
                    name: 'create',
                    description: 'Starts a new giveaway.',
                    type: 1, // Subcommand type
                    options: [
                        {
                            name: 'prize',
                            description: 'The prize for the giveaway.',
                            type: 3, // String type
                            required: true,
                        },
                        {
                            name: 'winners',
                            description: 'The number of winners for the giveaway.',
                            type: 4, // Integer type
                            required: true,
                            min_value: 1,
                        },
                        {
                            name: 'duration',
                            description: 'How long the giveaway will last (e.g., 1h, 30m, 2d).',
                            type: 3, // String type
                            required: true,
                        },
                        {
                            name: 'channel',
                            description: 'The channel to start the giveaway in.',
                            type: 7, // Channel type
                            channel_types: [0], // Text channels
                            required: false,
                        },
                    ],
                },
                // Add other giveaway subcommands here if needed (e.g., end, reroll)
            ],
        },
        {
            name: 'invite',
            description: 'Get the bot\'s invite link and support server invite.',
        },
    ];

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

    try {
        if (DISCORD_CLIENT_ID) {
            await rest.put(
                Routes.applicationCommands(DISCORD_CLIENT_ID),
                { body: commands },
            );
            console.log('✅ Commands Registered');
            logToChannel("✅ Commands Registered", "Successfully registered slash commands globally.", 0x00FF00); // Green
        } else {
            console.error("ERROR: DISCORD_CLIENT_ID is not set. Cannot register slash commands.");
            logToChannel("🚨 Command Registration Error", "DISCORD_CLIENT_ID is not set. Cannot register slash commands.", 0xFF0000); // Red
        }

    } catch (error) {
        console.error(`Error registering commands: ${error.message}`);
        logToChannel("🚨 Command Registration Error", `Failed to register slash commands: \`\`\`${error.message}\`\`\``, 0xFF0000); // Red
    }

    // Start checking for giveaways every 10 seconds
    setInterval(checkGiveaways, 10 * 1000);
    console.log("Started checking for ongoing giveaways.");

    // Initial status message update and scheduling
    await updateStatusMessage();
    setInterval(updateStatusMessage, 5 * 60 * 1000); // Update every 5 minutes
});

// When a slash command is interacted with
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'giveaway') {
        const subcommand = options.getSubcommand();

        if (subcommand === 'create') {
            // Permissions check: Only allow users with Manage Guild to create giveaways
            if (!interaction.memberPermissions.has('ManageGuild')) {
                return interaction.reply({ content: 'You need the "Manage Server" permission to create giveaways.', ephemeral: true });
            }

            const prize = options.getString('prize');
            const winners = options.getInteger('winners');
            const durationString = options.getString('duration');
            const targetChannel = options.getChannel('channel') || interaction.channel;

            if (!targetChannel || !targetChannel.isTextBased()) {
                return interaction.reply({ content: 'I cannot send giveaways to that channel type. Please select a text channel.', ephemeral: true });
            }

            let durationMs;
            const matches = durationString.match(/(\d+)([smhd])/);
            if (matches) {
                const value = parseInt(matches[1]);
                const unit = matches[2];
                switch (unit) {
                    case 's': durationMs = value * 1000; break;
                    case 'm': durationMs = value * 60 * 1000; break;
                    case 'h': durationMs = value * 60 * 60 * 1000; break;
                    case 'd': durationMs = value * 24 * 60 * 60 * 1000; break;
                    default: durationMs = null;
                }
            }

            if (!durationMs || durationMs <= 0) {
                return interaction.reply({ content: 'Please provide a valid duration (e.g., `1h`, `30m`, `2d`).', ephemeral: true });
            }

            const endsAt = Date.now() + durationMs;

            const giveawayEmbed = new EmbedBuilder()
                .setTitle(`🎉 Giveaway: ${prize} 🎉`)
                .setDescription(`React with 🎉 to enter!\nWinners: **${winners}**\nEnds: <t:${Math.floor(endsAt / 1000)}:R> (<t:${Math.floor(endsAt / 1000)}:F>)`)
                .setColor(0x7289DA) // Discord purple color
                .setFooter({ text: `Giveaway hosted by ${interaction.user.tag}` })
                .setTimestamp(endsAt); // Set embed timestamp to giveaway end time

            try {
                const giveawayMessage = await targetChannel.send({ embeds: [giveawayEmbed] });
                await giveawayMessage.react('🎉');

                saveGiveaway(giveawayMessage.id, targetChannel.id, interaction.guildId, prize, winners, endsAt);

                await interaction.reply({ content: 'Giveaway created successfully!', ephemeral: true });
                logToChannel("✅ Giveaway Created", `User **${interaction.user.tag}** created a giveaway for "${prize}" in <#${targetChannel.id}>.`, 0x00FF00); // Green
            } catch (error) {
                console.error(`Error creating giveaway: ${error.message}`);
                logToChannel("🚨 Giveaway Creation Error", `Failed to create giveaway: \`\`\`${error.message}\`\`\``, 0xFF0000); // Red
                await interaction.reply({ content: `Failed to create giveaway: ${error.message}`, ephemeral: true });
            }
        }
    } else if (commandName === 'invite') {
        const botInviteLink = `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&permissions=268435456&scope=bot%20applications.commands`; // Minimal permissions for giveaway bot

        const inviteEmbed = new EmbedBuilder()
            .setTitle("🔗 Invite PrizePal-Bot & Join Support Server")
            .setDescription(`You can invite PrizePal-Bot to your server using this link:\n[**Invite Me!**](${botInviteLink})\n\nNeed help or want to suggest a feature? Join our official server:\n[**Support Server**](${OFFICIAL_SERVER_INVITE})`)
            .setColor(0x5865F2) // Discord Blurple
            .setFooter({ text: "Thank you for using PrizePal-Bot!" });

        await interaction.reply({ embeds: [inviteEmbed], ephemeral: false });
        logToChannel("🔗 Invite Command Used", `User **${interaction.user.tag}** used the invite command.`, 0xADD8E6); // Light Blue
    }
});


// --- Status Update Logic ---
let statusMessage = null; // Store the message object for continuous updates

/**
 * Updates the bot's status message in the designated channel.
 */
async function updateStatusMessage() {
    if (!ONLINE_STATUS_CHANNEL_ID) {
        console.warn("WARNING: ONLINE_STATUS_CHANNEL_ID is not set. Cannot update status message.");
        return;
    }

    try {
        const statusChannel = await client.channels.fetch(ONLINE_STATUS_CHANNEL_ID.toString());
        if (!statusChannel || !statusChannel.isTextBased()) {
            console.warn(`WARNING: Status channel with ID ${ONLINE_STATUS_CHANNEL_ID} not found or is not a text channel.`);
            logToChannel("⚠️ Status Channel Error", `Status channel ID ${ONLINE_STATUS_CHANNEL_ID} is invalid or not a text channel.`, 0xFFA500); // Orange
            return;
        }

        // Try to fetch the existing status message if it's the first run or bot restarted
        if (!statusMessage) {
            const messages = await statusChannel.messages.fetch({ limit: 10 }); // Fetch last 10 messages
            statusMessage = messages.find(msg =>
                msg.author.id === client.user.id &&
                msg.embeds.some(embed => embed.title && embed.title.includes('PrizePal-Bot Status'))
            );
        }

        const ping = client.ws.ping; // Latency
        const guilds = client.guilds.cache.size; // Number of servers bot is in
        const users = client.users.cache.size; // Number of cached users (less reliable than guild member counts)

        // Calculate uptime
        let uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        uptime %= 86400;
        const hours = Math.floor(uptime / 3600);
        uptime %= 3600;
        const minutes = Math.floor(uptime / 60);
        const seconds = Math.floor(uptime % 60);

        const currentTime = new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit' });

        const updatedEmbed = new EmbedBuilder()
            .setTitle('🟢 PrizePal-Bot Status')
            .setDescription('I am online and ready to host amazing giveaways!')
            .setColor(0x00FF00) // Green color for online
            .addFields(
                { name: '📊 Ping', value: `${ping}ms`, inline: true },
                { name: '📈 Uptime', value: `${days}d ${hours}h ${minutes}m ${seconds}s`, inline: true },
                { name: '🏠 Servers', value: `${guilds}`, inline: true }
            )
            .setFooter({ text: `PrizePal - Giving Back, made Easy. ✨ • Today at ${currentTime}` });

        if (statusMessage) {
            // Edit existing message
            await statusMessage.edit({ embeds: [updatedEmbed] });
            console.log("🚀 Status Message Updated.");
        } else {
            // Send new message if no existing one is found
            statusMessage = await statusChannel.send({ embeds: [updatedEmbed] });
            console.log("Initial status message sent. 🚀");
            logToChannel("🚀 Status Message Sent", "Initial bot status message has been posted.", 0x00FF00); // Green
        }

    } catch (error) {
        console.error(`Error updating status message: ${error.message} 🐛`);
        logToChannel("🚨 Status Update Error", `An unexpected error occurred during status message update: \`\`\`${error.message}\`\`\``, 0xFF0000); // Red
    }
}


// --- Start the bot ---
// Perform basic environment variable checks before logging in
if (!BOT_TOKEN) {
    console.error("ERROR: 'DISCORD_BOT_TOKEN' is not set in the .env file. Please check your .env file. ❌");
    process.exit(1); // Exit if critical token is missing
} else if (!ONLINE_STATUS_CHANNEL_ID) {
    console.error("ERROR: 'ONLINE_STATUS_CHANNEL_ID' is not set in the .env file. Please check your .env file. ❌");
    process.exit(1);
} else if (!OFFICIAL_SERVER_INVITE) {
    console.error("ERROR: 'OFFICIAL_SERVER_INVITE' is not set in the .env file. Please check your .env file. ❌");
    process.exit(1);
} else if (!DISCORD_CLIENT_ID) {
    console.error("ERROR: 'DISCORD_CLIENT_ID' is not set in the .env file. Please check your .env file. ❌");
    process.exit(1);
} else if (!LOG_CHANNEL_ID) {
    console.error("ERROR: 'LOG_CHANNEL_ID' is not set in the .env file. Please check your .env file. ❌");
    process.exit(1);
} else {
    // If all critical environment variables are set, log in the bot
    client.login(BOT_TOKEN)
        .catch(err => {
            console.error(`Failed to log in to Discord: ${err.message} 🚫`);
            logToChannel("🚨 Login Error", `Failed to log in to Discord: \`\`\`${err.message}\`\`\`. Check your bot token and internet connection.`, 0xFF0000); // Red
            process.exit(1);
        });
}
