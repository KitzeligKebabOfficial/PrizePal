Here's the comprehensive README.md for your PrizePal-Bot, adapted with all the steps and explanations you requested, including the specific instructions for Bun initialization and detailed deployment guide for others:

PrizePal-Bot: Your Ultimate Discord Giveaway Manager
PrizePal-Bot is a powerful and easy-to-use Discord bot designed to automate and streamline the giveaway process on your server. From creating engaging giveaways to automatically picking winners and logging important events, PrizePal-Bot handles it all, allowing you to focus on your community.

Table of Contents
Features

Prerequisites

Setup Guide

Step 1: Project Initialization

Step 2: Install Dependencies

Step 3: Configure package.json for Running

Step 4: Test Your Bot Locally

Step 5: Prepare for GitHub

Step 6: Upload to GitHub

Deployment (Running 24/7 on a Server)

Step 7: Deploying Your Bot

Commands

Troubleshooting

Contributing

License

Features
Effortless Giveaway Creation: Start new giveaways with custom prizes, number of winners, and durations (e.g., 1h, 30m, 2d) using intuitive slash commands.

Simple Participation: Users join giveaways by simply reacting with a 🎉 emoji to the giveaway message.

Automated Winner Selection: The bot intelligently picks random winners from participants once the giveaway concludes.

Clear Announcements: Winners are announced directly in the channel, and the original giveaway message is updated.

Persistent Giveaways: Giveaway data is saved, allowing active giveaways to resume and conclude even if the bot restarts.

Real-time Bot Status: A dedicated channel displays your bot's live uptime, current latency (ping), and the number of servers it's active in.

Robust Logging System: Important events, errors, and warnings are sent to a private log channel, providing crucial insights into your bot's operations.

Easy Invite Sharing: A simple command provides an invite link for your bot and your support server.

Secure Configuration: All sensitive information is loaded securely from a .env file, keeping your tokens and IDs out of your public code.

Prerequisites
Before you begin, ensure you have the following installed and configured:

A Discord Bot Application:

Create a new application and bot user in the Discord Developer Portal.

From your bot's settings, you will need:

Bot Token: This is highly sensitive and gives full control over your bot. Keep it absolutely secret!

Client ID: Used to generate the bot's invite link.

Ensure you enable the necessary Gateway Intents for your bot under the "Bot" section in the Developer Portal. For this bot, ensure at least GUILDS, GUILD_MESSAGES, MESSAGE_CONTENT, and GUILD_MESSAGE_REACTIONS are enabled.

Discord Channel IDs:

Enable Developer Mode in your Discord client (User Settings -> Advanced -> Developer Mode).

Right-click on any channel and select "Copy ID" to get its numerical ID. You'll need IDs for:

Your Online Status Channel: The public channel where the bot will display its uptime and status.

Your Log Channel: A private channel where the bot sends error messages and important notifications.

A Discord Support Server Invite Link (Optional but Recommended):

If you have a Discord server for bot support, generate a permanent invite link. This link will be provided when users use the /invite command.

Node.js:

Download and install the latest LTS (Long Term Support) version from https://nodejs.org/. npm (Node Package Manager) comes bundled with Node.js.

Bun: (An alternative, faster JavaScript runtime if you prefer)

Download and install Bun using one of these commands in your terminal:

For Windows (PowerShell): powershell -c "irm bun.sh/install.ps1 | iex"

For Linux/macOS (Terminal): curl -fsSL https://bun.sh/install | bash

Git:

Download and install Git from https://git-scm.com/downloads/.

A GitHub Account:

Sign up or log in at https://github.com/.

A Text Editor or IDE:

We highly recommend Visual Studio Code for its excellent JavaScript/TypeScript support.

Setup Guide
Follow these steps to get your PrizePal-Bot ready on your local machine before deploying it.

Step 1: Project Initialization
Create Your Bot's Folder:
Open your terminal or command prompt and run:

Bash

mkdir PrizePal-Bot
cd PrizePal-Bot
This creates a new directory named PrizePal-Bot and navigates you into it.

Place Your Bot's Files:
Place the index.ts file and an empty giveaways.json (the bot will populate this) directly into the PrizePal-Bot directory.

Create Your .env File (Crucial for Security!):
In the PrizePal-Bot directory, create a new file named .env. This file will contain your sensitive information and must never be committed to GitHub.
Paste the following content into your .env file, replacing the YOUR_..._HERE placeholders with your actual bot credentials and IDs:

Code-Snippet

# Discord Bot Token - Keep this private!
DISCORD_BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# The ID of the channel where the bot's online status message will be updated.
ONLINE_STATUS_CHANNEL_ID=YOUR_ONLINE_STATUS_CHANNEL_ID_HERE

# The ID of the channel for bot logs.
LOG_CHANNEL_ID=YOUR_LOG_CHANNEL_ID_HERE

# Invite link for the support server
OFFICIAL_SERVER_INVITE=YOUR_SUPPORT_SERVER_INVITE_LINK_HERE

# Client ID for the bot
DISCORD_CLIENT_ID=YOUR_BOT_CLIENT_ID_HERE
Ensure there are no spaces around the = signs and no quotes around your values.

Initialize Your Project:
This step creates the package.json file, which manages your project's dependencies and scripts. Choose the option based on your preferred runtime:

If you're using Node.js (with npm):

Bash

npm init -y
The -y flag answers "yes" to all prompts, creating a default package.json.

If you're using Bun:

Bash

bun init
When prompted "Initialize with a 'blank' project?", simply press Enter. This will set up a basic package.json for Bun.

Step 2: Install Dependencies
Now, install the necessary libraries for your bot: discord.js (for interacting with the Discord API) and dotenv (for loading your environment variables from the .env file).

If you're using Node.js (with npm):

Bash

npm install discord.js dotenv
If you're using Bun:

Bash

bun install discord.js dotenv
Bun typically installs dependencies significantly faster!

Step 3: Configure package.json for Running
Your bot's main file is index.ts. We need to define a "start" script in package.json to tell your chosen runtime how to execute this TypeScript file easily.

Option A: For Node.js (running TypeScript directly with ts-node)

If you want Node.js to directly run your .ts file without a separate compilation step, you'll need ts-node and typescript.

Install ts-node and typescript:

Bash

npm install -D ts-node typescript
The -D flag installs these as "development dependencies," meaning they're used during development but not strictly required when the bot is just running in a production environment.

Create a tsconfig.json file: This file configures how TypeScript compiles your code. In your project's root directory, create tsconfig.json with these minimal settings:

JSON

{
  "compilerOptions": {
    "target": "es2021",
    "module": "commonjs",
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "strict": true,
    "skipLibCheck": true
  }
}
Modify your package.json's scripts section:
Open package.json and adjust the "scripts" block to include a "start" command that uses ts-node:

JSON

{
  "name": "prizepal-bot",
  "version": "1.0.0",
  "description": "A Discord bot for managing giveaways.",
  "main": "index.ts",
  "scripts": {
    "start": "ts-node index.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "discord.js": "^14.x.x",
    "dotenv": "^16.x.x"
  },
  "devDependencies": {
    "ts-node": "^10.x.x",
    "typescript": "^5.x.x"
  }
}
(Note: The version numbers like ^14.x.x are ranges. Your actual package.json will show the specific versions installed by npm install.)

Option B: For Bun (native .ts execution)

Bun has native support for running TypeScript files directly, making this setup simpler.

Modify your package.json's scripts section:
Open package.json and adjust the "scripts" block to include a "start" command for Bun:

JSON

{
  "name": "prizepal-bot",
  "version": "1.0.0",
  "description": "A Discord bot for managing giveaways.",
  "main": "index.ts",
  "scripts": {
    "start": "bun run index.ts",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "discord.js": "^14.x.x",
    "dotenv": "^16.x.x"
  }
}
Your index.ts uses require (CommonJS syntax). Bun handles this well directly. If your code were to use import (ES Modules syntax), you might add "type": "module" to package.json, but for the current index.ts file, it's not necessary.

Step 4: Test Your Bot Locally
Before pushing your code to GitHub, it's crucial to test your bot on your own machine to ensure everything is working as expected.

Run the Bot:
In your terminal, within the PrizePal-Bot directory, execute the start script:

Bash

npm start # If you set up with Node.js/npm
# OR
bun start # If you set up with Bun
Check Console Output:
You should see messages in your terminal indicating that the bot has successfully logged in, its commands have been registered with Discord, and the initial status message has been sent.

Verify Discord Functionality:

Go to your Discord server and check the channel you designated for ONLINE_STATUS_CHANNEL_ID. You should see the bot's status message (uptime, ping, server count) updating periodically.

Check your LOG_CHANNEL_ID for a "Bot Online" message and any other informational or error logs.

Invite the bot to a channel (if it's not already there) and try using the /giveaway create slash command. Ensure the bot responds correctly and creates a giveaway message.

Stop the Bot:
Once you've confirmed everything is working, press Ctrl + C in your terminal to stop the bot's process.

Step 5: Prepare for GitHub
To manage your bot's code efficiently with Git and GitHub, you need a .gitignore file. This file tells Git which files and folders to ignore when you upload your code, preventing sensitive data (like your .env file) and unnecessary files (like node_modules which can be re-installed later) from being included in your public repository.

Create .gitignore file:
In your PrizePal-Bot directory, create a new file named .gitignore.

Add content to .gitignore:
Paste the following lines into the .gitignore file:

Code-Snippet

# Environment variables - NEVER upload your .env file containing sensitive tokens!
.env

# Node modules - These are installed fresh on any deployment environment
node_modules/

# Bun's lock file - Bun will generate this on installation
bun.lockb
Important Note: The giveaways.json file is not included in this .gitignore. This is deliberate, as you likely want your active giveaway data to persist across deployments on a continuous hosting environment.

Step 6: Upload Your Code to GitHub
Now, let's get your bot's code onto GitHub, where you can share it, track changes, and easily deploy it to a server.

Initialize Git Repository:
Open your terminal in the PrizePal-Bot directory and run:

Bash

git init
This command initializes a new, empty Git repository in your current directory. A hidden .git folder will be created.

Add Files to Staging:

Bash

git add .
This command stages all changes in your current directory (excluding those listed in .gitignore), preparing them for a commit.

Commit Your Changes:

Bash

git commit -m "Initial commit: PrizePal Discord Bot code"
This command saves your staged changes to your local Git history with a descriptive message.

Create a Repository on GitHub:

Go to https://github.com/.

Log in to your account.

Click the green "New" button (or the "+" sign in the top right corner and select "New repository").

Name your repository (e.g., PrizePal-Bot).

Choose whether it should be Public (anyone can see it) or Private (only you and collaborators can see it).

Crucial: Do NOT check "Add a README file," "Add .gitignore," or "Choose a license." You've already created these locally.

Click the "Create repository" button.

Link Local to Remote Repository and Push:
GitHub will provide you with commands to link your local repository to the new remote one. Copy and paste these into your terminal. They will look similar to this (remember to replace YOUR_GITHUB_USERNAME and PrizePal-Bot with your actual GitHub username and repository name):

Bash

git remote add origin https://github.com/YOUR_GITHUB_USERNAME/PrizePal-Bot.git
git branch -M main
git push -u origin main
You will likely be prompted to enter your GitHub username and password (or a Personal Access Token if you have two-factor authentication enabled, which is recommended for security).

Your bot's code is now safely stored on GitHub!

Deployment (Running 24/7 on a Server)
To ensure your PrizePal-Bot runs continuously without needing your local machine to be on, you'll need to deploy it to a server. This could be a Virtual Private Server (VPS), a cloud hosting platform (like AWS, Google Cloud, Azure), or specialized bot hosting services. The following steps provide a general guide for deploying to a Linux-based VPS, which is a common and flexible choice for Discord bots.

Step 7: Deploying Your Bot
Connect to Your Server:
Use SSH (Secure Shell) from your local terminal to connect to your server.

Bash

ssh username@your_server_ip
Replace username with your server's username (often root for new VPS, but it's better practice to create a dedicated user) and your_server_ip with the server's IP address or domain name.

Install Node.js or Bun on the Server:
Just like on your local machine, your server needs a JavaScript runtime. Follow the official installation guides for your chosen runtime, specific to your server's operating system (e.g., Ubuntu, Debian, CentOS).

Node.js Installation Guides: https://nodejs.org/en/download/package-manager

Bun Installation Guides: https://bun.sh/docs/installation

Clone Your Repository on the Server:
Navigate to the directory where you want to store your bot's code on the server (e.g., /home/your_username/ or /opt/). Then clone your repository:

Bash

git clone https://github.com/YOUR_GITHUB_USERNAME/PrizePal-Bot.git
cd PrizePal-Bot
Create .env File on the Server:
This is a critical security step: Since you did not (and should not!) commit your local .env file to GitHub, you need to recreate it directly on your server.

Bash

nano .env # Or use `vim .env` if you prefer that editor
Paste the exact contents of your local .env file (with your actual bot token, channel IDs, etc.) into this new file on the server. Save and exit the editor (for nano, it's Ctrl+X, then Y to confirm, then Enter to save).

Install Dependencies on the Server:
Once inside the PrizePal-Bot directory on your server:

If you're using Node.js:

Bash

npm install
If you're using Bun:

Bash

bun install
Run the Bot Using a Process Manager (Recommended: PM2):
To ensure your bot keeps running continuously even if you close your SSH connection, and to easily manage its process (start, stop, restart, view logs), it's highly recommended to use a process manager like pm2.

Install pm2 globally on your server:

Bash

npm install -g pm2 # It's common to use npm for global CLI tools like pm2
(While Bun has bun install -g, npm install -g is often preferred for global CLI tools like PM2 for broader compatibility.)

Start your bot with pm2:
Navigate back to your PrizePal-Bot directory on the server, then run:

If you set up with Node.js:

Bash

pm2 start npm --name "PrizePal" -- start
This command tells pm2 to run the npm start script defined in your package.json and names the running process "PrizePal."

If you set up with Bun:

Bash

pm2 start bun --name "PrizePal" -- run start
This tells pm2 to execute your bun run start command.

Monitor and Manage Your Bot with pm2:

Check bot status:

Bash

pm2 list
View bot logs (real-time):

Bash

pm2 logs PrizePal
Stop the bot:

Bash

pm2 stop PrizePal
Restart the bot:

Bash

pm2 restart PrizePal
Save PM2 processes (so they restart automatically on server reboot):

Bash

pm2 save
You might also need to run pm2 startup to generate a command that configures PM2 to start automatically when your server boots up. Follow the instructions provided by pm2 startup.

Your PrizePal-Bot should now be operational and running continuously on your server, ready to empower your Discord community with exciting giveaways!

Commands
Here are the main commands your PrizePal-Bot supports:

/giveaway create: Starts a new giveaway. You will be prompted for:

prize: What is being given away? (e.g., "Nitro Classic", "10 EUR Steam Gift Card")

winners: How many winners will there be? (e.g., 1, 5)

duration: How long should the giveaway last? (e.g., 1h for 1 hour, 30m for 30 minutes, 2d for 2 days)

channel (optional): The channel where the giveaway message will be posted. If omitted, it will be posted in the current channel.

/invite: Provides invite links for the bot and the official support server.

Troubleshooting
Bot not coming online?

Double-check your DISCORD_BOT_TOKEN in the .env file. A single typo will prevent the bot from logging in.

Check your terminal or pm2 logs PrizePal for error messages.

Ensure your internet connection on the server is stable.

Commands not showing up?

The bot registers commands on startup. Give it a few minutes after the bot comes online for commands to propagate across Discord.

Ensure the bot has the application.commands scope enabled in its invite link and is invited to the server with that scope.

Bot not sending messages or reacting?

Verify that your bot has the necessary Discord permissions in the channels it's operating in (e.g., Send Messages, Read Message History, Add Reactions, Manage Messages if it needs to remove reactions).

Check your ONLINE_STATUS_CHANNEL_ID and LOG_CHANNEL_ID in the .env file – ensure they are correct and the bot has permissions there.

Error messages in logs about missing environment variables?

Carefully review your .env file. Ensure all required variables (DISCORD_BOT_TOKEN, ONLINE_STATUS_CHANNEL_ID, LOG_CHANNEL_ID, OFFICIAL_SERVER_INVITE, DISCORD_CLIENT_ID) are present and correctly spelled. There should be no spaces around the = signs.

Giveaways not persisting after bot restart?

Ensure giveaways.json is not in your .gitignore file, and that your server environment allows the bot to write to this file in its directory.

Contributing
We welcome contributions to enhance PrizePal-Bot! If you have ideas for new features, bug fixes, or improvements, feel free to:

Fork this repository.

Create a new branch (git checkout -b feature/YourFeatureName or bugfix/YourBugFixName).

Make your changes.

Commit your changes (git commit -m 'feat: Add new feature').

Push to your branch (git push origin feature/YourFeatureName).

Open a Pull Request to the main branch of this repository.

Please ensure your code adheres to existing style and includes relevant tests if applicable.
