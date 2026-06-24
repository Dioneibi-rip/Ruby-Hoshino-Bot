import { JOBS, normalizeJobInput, ensureJobFields, getJobData, getJobTenureDays } from '../../lib/rpg-jobs.js';

const jobEntries=Object.values(JOBS);
const jobActions=new Set(['elegir','set','escoger','seleccionar','tomar']);
const infoActions=new Set(['actual','status','info','ver']);
const listActions=new Set(['lista','list','jobs','empleos','menu']);

function getJobsListMessage(usedPrefix){
const lines=jobEntries.map((job,index)=>`*${index+1}.* ${job.emoji} *${job.name}* (${job.key})\n↳ ${job.description}`);
return `💼 *BOLSA DE TRABAJO*\n\n${lines.join('\n\n')}\n\n✦ Para tomar un empleo responde con:\n• *${usedPrefix}trabajo elegir <trabajo>*\n• *${usedPrefix}trabajo <número>*\n• *${usedPrefix}trabajo <trabajo>*\n\n✦ Usa *${usedPrefix}trabajar* para ganar ${global.db?.data?.settings?.[global.conn?.user?.jid]?.moneda||'Coins'}.`;
}

function resolveSelectedJob(input){
const normalizedInput=(input||'').trim();
const numericIndex=Number.parseInt(normalizedInput,10);
if(Number.isInteger(numericIndex)&&String(numericIndex)===normalizedInput&&numericIndex>=1&&numericIndex<=jobEntries.length)return jobEntries[numericIndex-1].key;
return normalizeJobInput(normalizedInput);
}

let handler=async(m,{conn,usedPrefix,args,participants})=>{
let primaryJid=m.sender;
if(primaryJid.endsWith('@lid')&&m.isGroup){
const p=participants.find(x=>x.lid===primaryJid);
if(p?.id)primaryJid=p.id;
}
const user=global.db.getUser(primaryJid);
ensureJobFields(user);
const action=(args[0]||'').toLowerCase();
if(!action||listActions.has(action))return conn.reply(m.chat,getJobsListMessage(usedPrefix),m);
if(infoActions.has(action)){
const current=getJobData(user);
if(!current)return conn.reply(m.chat,`💼 No tienes trabajo todavía.\nUsa *${usedPrefix}trabajo lista* y luego *${usedPrefix}trabajo elegir <trabajo>*.`,m);
const days=getJobTenureDays(user);
return conn.reply(m.chat,`💼 Tu trabajo actual: ${current.emoji} *${current.name}*\n✦ Antigüedad: *${days} día(s)*\n✦ XP laboral: *${(user.jobXp||0).toLocaleString()}*`,m);
}
const desiredInput=jobActions.has(action)?args.slice(1).join(' ').trim():args.join(' ').trim();
if(!desiredInput)return conn.reply(m.chat,`✦ Debes indicar un trabajo.\n> Ejemplo: *${usedPrefix}trabajo elegir programador*\n\n${getJobsListMessage(usedPrefix)}`,m);
const selectedJobKey=resolveSelectedJob(desiredInput);
if(!selectedJobKey)return conn.reply(m.chat,`✘ Trabajo inválido: *${desiredInput}*.\nUsa *${usedPrefix}trabajo lista* para ver opciones disponibles.`,m);
const selectedJob=JOBS[selectedJobKey];
if(user.job===selectedJobKey)return conn.reply(m.chat,`✅ Ya tienes ese trabajo: ${selectedJob.emoji} *${selectedJob.name}*.`,m);
global.db.updateUser(primaryJid,{job:selectedJobKey,jobSince:Date.now(),jobXp:user.jobXp||0});
await global.db.write?.();
return conn.reply(m.chat,`✅ Ahora tu trabajo es ${selectedJob.emoji} *${selectedJob.name}*.\n✦ Ya puedes usar *${usedPrefix}trabajar*, *${usedPrefix}crime* y *${usedPrefix}slut*.`,m);
};

handler.help=['trabajo lista','trabajo elegir <trabajo>','trabajo <número>','trabajo info'];
handler.tags=['economy'];
handler.command=['trabajo','job','empleo'];
handler.group=true;
handler.register=true;

export default handler;