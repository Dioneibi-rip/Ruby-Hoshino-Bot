export async function loadGroupVotes() {
  return global.db?.getSection?.('group_votes') || {};
}

export async function saveGroupVotes(groupVotes) {
  if (!global.db?.replaceSection) throw new Error('SQLite no está inicializado para guardar votos de grupo.');
  global.db.replaceSection('group_votes', groupVotes || {});
  await global.db.write?.();
}

export const makeGroupCharacterKey = (groupId, characterId) => `${groupId}:${characterId}`;
