// @type {import('@whiskeysockets/baileys')}
const { proto, generateWAMessage, areJidsSameUser } = (await import('@whiskeysockets/baileys')).default;

const regexEscape = (str) => str.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');

function resolveMessageId(message) {
  if (message.buttonsResponseMessage) return message.buttonsResponseMessage.selectedButtonId;
  if (message.templateButtonReplyMessage) return message.templateButtonReplyMessage.selectedId;
  if (message.listResponseMessage) return message.listResponseMessage.singleSelectReply?.selectedRowId;

  const paramsJson = message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
  if (!paramsJson) return '';

  try {
    return JSON.parse(paramsJson).id;
  } catch {
    return '';
  }
}

function hasInteractiveResponse(message) {
  return Boolean(
    message.buttonsResponseMessage ||
      message.templateButtonReplyMessage ||
      message.listResponseMessage ||
      message.interactiveResponseMessage,
  );
}

function matchesCommand(plugin, id, defaultPrefix) {
  const sourcePrefix = plugin.customPrefix || defaultPrefix || global.prefix;
  const prefixCandidates = Array.isArray(sourcePrefix) ? sourcePrefix : [sourcePrefix];

  let usedPrefix = '';
  for (const prefixCandidate of prefixCandidates) {
    const re = prefixCandidate instanceof RegExp ? prefixCandidate : new RegExp(regexEscape(prefixCandidate));
    const result = re.exec(id);
    if (!result?.[0]) continue;
    usedPrefix = result[0];
    break;
  }

  if (!usedPrefix) return false;

  const noPrefix = id.slice(usedPrefix.length).trim();
  const command = noPrefix.split(/\s+/, 1)[0]?.toLowerCase();
  if (!command) return false;

  if (plugin.command instanceof RegExp) return plugin.command.test(command);
  if (Array.isArray(plugin.command)) {
    return plugin.command.some((cmd) => (cmd instanceof RegExp ? cmd.test(command) : cmd === command));
  }
  return typeof plugin.command === 'string' && plugin.command === command;
}

export async function all(m, chatUpdate) {
  if (m.isBaileys || !m.message || !hasInteractiveResponse(m.message)) return;

  const id = resolveMessageId(m.message);
  if (!id) return;

  const text =
    m.message.buttonsResponseMessage?.selectedDisplayText ||
    m.message.templateButtonReplyMessage?.selectedDisplayText ||
    m.message.listResponseMessage?.title ||
    '';

  let isIdMessage = false;
  for (const plugin of Object.values(global.plugins)) {
    if (!plugin || plugin.disabled || typeof plugin !== 'function' || !plugin.command) continue;
    if (!opts.restrict && plugin.tags?.includes('admin')) continue;

    if (matchesCommand(plugin, id, this.prefix)) {
      isIdMessage = true;
      break;
    }
  }

  const messages = await generateWAMessage(
    m.chat,
    { text: isIdMessage ? id : text, mentions: m.mentionedJid },
    {
      userJid: this.user.id,
      quoted: m.quoted && m.quoted.fakeObj,
    },
  );

  messages.key.fromMe = areJidsSameUser(m.sender, this.user.id);
  messages.key.id = m.key.id;
  messages.pushName = m.name;
  if (m.isGroup) messages.key.participant = messages.participant = m.sender;

  const msg = {
    ...chatUpdate,
    messages: [proto.WebMessageInfo.fromObject(messages)].map((v) => ((v.conn = this), v)),
    type: 'append',
  };

  this.ev.emit('messages.upsert', msg);
}
