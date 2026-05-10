import { promises as fs } from 'fs';

const groupVotesFilePath = './src/database/groupVotes.json';

export async function loadGroupVotes() {
  try {
    const data = await fs.readFile(groupVotesFilePath, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    if (error?.code === 'ENOENT') return {};
    throw new Error('No se pudo cargar el archivo groupVotes.json.');
  }
}

export async function saveGroupVotes(groupVotes) {
  try {
    await fs.writeFile(groupVotesFilePath, JSON.stringify(groupVotes, null, 2), 'utf-8');
  } catch (error) {
    throw new Error('No se pudo guardar el archivo groupVotes.json.');
  }
}

export const makeGroupCharacterKey = (groupId, characterId) => `${groupId}:${characterId}`;
