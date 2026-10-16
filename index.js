require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionFlagsBits,
  ChannelType,
  Events,
} = require('discord.js');
const config = require('./config');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

// ---------- Helpers ----------

function buildPanelEmbed() {
  const { panel } = config;

  const rules = panel.rules.map((l) => `· ${l}`).join('\n');
  const schedule = panel.schedule.lines.map((l) => `· ${l}`).join('\n');
  const important = panel.important.lines.map((l) => `· ${l}`).join('\n');

  return new EmbedBuilder()
    .setColor(config.colors.embed)
    .setTitle(panel.title)
    .setDescription(
      `${panel.description}\n\n${rules}\n\n` +
      `**${panel.schedule.title}**\n\n${schedule}\n\n` +
      `**${panel.important.title}**\n\n${important}`
    );
}

function buildPanelComponents() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('ticket_category_select')
    .setPlaceholder(config.panel.selectPlaceholder)
    .addOptions(
      config.categories.map((cat) => ({
        label: cat.label,
        description: cat.description,
        value: cat.value,
        ...(cat.emoji ? { emoji: cat.emoji } : {}),
      }))
    );

  return [new ActionRowBuilder().addComponents(select)];
}

function buildCloseRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('Fechar Ticket')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🔒')
  );
}

function sanitizeName(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------- Slash command: /ticket-painel ----------

client.once(Events.ClientReady, async (c) => {
  console.log(`Bot online como ${c.user.tag}`);

  try {
    await client.application.commands.set([
      {
        name: 'ticket-painel',
        description: 'Envia o painel de abertura de tickets neste canal.',
        defaultMemberPermissions: PermissionFlagsBits.ManageGuild.toString(),
      },
    ]);
  } catch (err) {
    console.error('Falha ao registrar comandos:', err);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'ticket-painel') {
        await interaction.reply({
          embeds: [buildPanelEmbed()],
          components: buildPanelComponents(),
        });
      }
      return;
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category_select') {
      await handleTicketCreate(interaction);
      return;
    }

    if (interaction.isButton() && interaction.customId === 'ticket_close') {
      await handleTicketClose(interaction);
      return;
    }
  } catch (err) {
    console.error('Erro ao tratar interação:', err);
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocorreu um erro ao processar sua solicitação. Tente novamente.',
        ephemeral: true,
      }).catch(() => {});
    }
  }
});

// ---------- Criação de ticket ----------

async function handleTicketCreate(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const categoryValue = interaction.values[0];
  const category = config.categories.find((c) => c.value === categoryValue);
  if (!category) {
    return interaction.editReply({ content: 'Categoria inválida.' });
  }

  const guild = interaction.guild;
  const existing = guild.channels.cache.find(
    (ch) =>
      ch.type === ChannelType.GuildText &&
      ch.topic === `ticket-owner:${interaction.user.id}:${category.value}`
  );

  if (existing) {
    return interaction.editReply({
      content: `Você já tem um ticket aberto para **${category.label}**: ${existing}`,
    });
  }

  const staffRoleId = process.env.STAFF_ROLE_ID;
  const parentId = process.env.TICKET_CATEGORY_ID || undefined;

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  if (staffRoleId) {
    overwrites.push({
      id: staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
      ],
    });
  }

  const channelName = `${category.value}-${sanitizeName(interaction.user.username)}`.slice(0, 90);

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: parentId,
    topic: `ticket-owner:${interaction.user.id}:${category.value}`,
    permissionOverwrites: overwrites,
  });

  const embed = new EmbedBuilder()
    .setColor(config.colors.embed)
    .setTitle(`Ticket — ${category.label}`)
    .setDescription(config.ticketOpenedMessage(interaction.user, category))
    .setFooter({ text: `Aberto por ${interaction.user.tag}` })
    .setTimestamp();

  await channel.send({
    content: staffRoleId ? `<@${interaction.user.id}> <@&${staffRoleId}>` : `<@${interaction.user.id}>`,
    embeds: [embed],
    components: [buildCloseRow()],
  });

  await interaction.editReply({ content: `Ticket criado: ${channel}` });
}

// ---------- Fechamento de ticket ----------

async function handleTicketClose(interaction) {
  const channel = interaction.channel;

  await interaction.reply({ content: 'Fechando o ticket em 5 segundos...' });

  const logChannelId = process.env.LOG_CHANNEL_ID;
  if (logChannelId) {
    const logChannel = interaction.guild.channels.cache.get(logChannelId);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.embed)
            .setTitle('Ticket Fechado')
            .setDescription(`Canal: **#${channel.name}**\nFechado por: <@${interaction.user.id}>`)
            .setTimestamp(),
        ],
      }).catch(() => {});
    }
  }

  setTimeout(() => {
    channel.delete().catch((err) => console.error('Erro ao deletar canal:', err));
  }, 5000);
}

client.login(process.env.DISCORD_TOKEN);
