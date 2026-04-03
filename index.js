const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const TOKEN = process.env.TOKEN;

let queue = [];
let player = createAudioPlayer();
let connection;

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args.shift().toLowerCase();

  if (command === '!play') {
    const query = args.join(' ');
    if (!query) return message.reply('Type a song');

    const vc = message.member.voice.channel;
    if (!vc) return message.reply('Join voice channel');

    connection = joinVoiceChannel({
      channelId: vc.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator
    });

    queue.push(query);
    message.reply(`Added: ${query});

    if (queue.length === 1) playNext();
  }

  if (command === '!skip') {
    player.stop();
  }
});

async function playNext() {
  if (!queue.length) return;

  const song = queue[0];

  let stream;
  if (play.yt_validate(song) === 'video') {
    stream = await play.stream(song);
  } else {
    const res = await play.search(song, { limit: 1 });
    stream = await play.stream(res[0].url);
  }

  const resource = createAudioResource(stream.stream, {
    inputType: stream.type
  });

  player.play(resource);
  connection.subscribe(player);

  player.once(AudioPlayerStatus.Idle, () => {
    queue.shift();
    playNext();
  });
}

client.login(TOKEN);
