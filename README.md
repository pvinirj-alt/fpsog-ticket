# Ticket Bot

Bot de Discord que envia um painel com embed + menu dropdown de categorias (igual ao estilo do print: Suporte, Reset hwid, Parceria, Bugs), e cria um canal privado de ticket quando alguém escolhe uma opção.

## Configuração

1. Instale as dependências:
   ```bash
   npm install
   ```

2. Copie `.env.example` para `.env` e preencha:
   ```bash
   cp .env.example .env
   ```
   - `DISCORD_TOKEN`: token do bot (Discord Developer Portal > Bot).
   - `CLIENT_ID`: Application ID do bot.
   - `GUILD_ID`: ID do seu servidor (não usado no código por padrão, mas deixado para referência/expansão).
   - `TICKET_CATEGORY_ID`: ID da categoria do Discord onde os canais de ticket serão criados (opcional).
   - `STAFF_ROLE_ID`: ID do cargo de staff que terá acesso aos tickets.
   - `LOG_CHANNEL_ID`: ID do canal para onde vai o log de tickets fechados (opcional).

3. No Developer Portal, habilite em "Bot":
   - Server Members Intent (se for usar menções/validações de membro).
   - Permissões ao convidar o bot: `Manage Channels`, `Manage Roles` (ou dar permissão manual nas categorias), `Send Messages`, `Embed Links`, `Read Message History`.

4. Rode o bot:
   ```bash
   npm start
   ```

5. No servidor, use o comando `/ticket-painel` em um canal para enviar o painel. Clique no menu "Clique aqui para ver as opções" para abrir um ticket.

## Personalização

Todos os textos, categorias e cores estão em `config.js` — edite esse arquivo para mudar títulos, horários, categorias do menu, etc. Não precisa mexer em `index.js` para isso.

## Fechar tickets

Dentro de cada canal de ticket aparece um botão "Fechar Ticket". Ao clicar, o canal é deletado após 5 segundos (e, se configurado, um log é enviado para `LOG_CHANNEL_ID`).
