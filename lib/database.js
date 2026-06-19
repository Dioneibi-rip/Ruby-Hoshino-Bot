import Database from 'better-sqlite3'
import { existsSync, mkdirSync } from 'fs'
import path from 'path'

const USER_NUMERIC_FIELDS = ['coin','bank','exp','level','limit','health','warn','lastclaim','lastwork','lastadventure','lastmining','jobSince','jobXp']

function ensureDir(filename){ const dir=path.dirname(filename); if(dir&&dir!=='.'&&!existsSync(dir)) mkdirSync(dir,{recursive:true}) }
function now(){ return Date.now() }
function parseJSON(value, fallback={}){ if(value == null || value === '') return fallback; try { return JSON.parse(value) } catch { return fallback } }
function stringify(value){ return JSON.stringify(value ?? {}) }
function safeField(field){ if(!/^[A-Za-z_][A-Za-z0-9_]*$/.test(field)) throw new Error(`Campo inválido: ${field}`); return field }
function pickExtras(user={}){ const extras={...user}; delete extras.id; for(const f of USER_NUMERIC_FIELDS) delete extras[f]; delete extras.name; delete extras.registered; delete extras.job; return extras }

export class SQLiteDatabase {
  constructor(filename='./src/database/database.sqlite'){
    this.filename=filename; ensureDir(filename)
    this.sqlite=new Database(filename)
    this.sqlite.pragma('journal_mode = WAL')
    this.sqlite.pragma('synchronous = NORMAL')
    this.sqlite.pragma('busy_timeout = 10000')
    this.sqlite.pragma('foreign_keys = ON')
    this._prepareSchema(); this._prepareStatements(); this.data=this.snapshot()
  }
  _prepareSchema(){
    this.sqlite.exec(`
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, coin INTEGER NOT NULL DEFAULT 0, bank INTEGER NOT NULL DEFAULT 0, exp INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 0, limited INTEGER NOT NULL DEFAULT 0, health INTEGER NOT NULL DEFAULT 100, warn INTEGER NOT NULL DEFAULT 0, name TEXT, registered INTEGER NOT NULL DEFAULT 0, job TEXT, job_since INTEGER NOT NULL DEFAULT 0, job_xp INTEGER NOT NULL DEFAULT 0, last_claim INTEGER NOT NULL DEFAULT 0, last_work INTEGER NOT NULL DEFAULT 0, last_adventure INTEGER NOT NULL DEFAULT 0, last_mining INTEGER NOT NULL DEFAULT 0, extras TEXT NOT NULL DEFAULT '{}', updated_at INTEGER NOT NULL DEFAULT (unixepoch()));
CREATE TABLE IF NOT EXISTS harem (group_id TEXT NOT NULL, character_id TEXT NOT NULL, user_id TEXT NOT NULL, last_claim_time INTEGER NOT NULL, protection_json TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, character_id));
CREATE INDEX IF NOT EXISTS idx_harem_user ON harem(group_id, user_id);
CREATE TABLE IF NOT EXISTS marriages (group_id TEXT NOT NULL DEFAULT 'global', user_id TEXT NOT NULL, partner_id TEXT NOT NULL, married_at INTEGER NOT NULL, PRIMARY KEY(group_id, user_id));
CREATE TABLE IF NOT EXISTS character_favorites (user_id TEXT PRIMARY KEY, character_id TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS claim_config (user_id TEXT PRIMARY KEY, message TEXT NOT NULL, updated_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS waifus_venta (group_id TEXT NOT NULL, character_id TEXT NOT NULL, name TEXT NOT NULL, precio INTEGER NOT NULL DEFAULT 0, vendedor TEXT, created_at INTEGER NOT NULL, extra_json TEXT NOT NULL DEFAULT '{}', PRIMARY KEY(group_id, character_id));
CREATE TABLE IF NOT EXISTS json_records (section TEXT NOT NULL, id TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL DEFAULT (unixepoch()), PRIMARY KEY(section,id));
CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO metadata(key,value) VALUES('schema_version','3-relational') ON CONFLICT(key) DO UPDATE SET value=excluded.value;
`)
  }
  _prepareStatements(){ this.statements={ getJson:this.sqlite.prepare('SELECT value FROM json_records WHERE section=? AND id=?'), allJson:this.sqlite.prepare('SELECT id,value FROM json_records WHERE section=?'), upsertJson:this.sqlite.prepare('INSERT INTO json_records(section,id,value,updated_at) VALUES(?,?,?,unixepoch()) ON CONFLICT(section,id) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at') } }
  _rowToUser(r){ if(!r) return undefined; return { id:r.id, coin:r.coin, bank:r.bank, exp:r.exp, level:r.level, limit:r.limited, health:r.health, warn:r.warn, name:r.name, registered:!!r.registered, job:r.job, jobSince:r.job_since, jobXp:r.job_xp, lastclaim:r.last_claim, lastwork:r.last_work, lastadventure:r.last_adventure, lastmining:r.last_mining, ...parseJSON(r.extras,{}) } }
  getUser(id){ let u=this._rowToUser(this.sqlite.prepare('SELECT * FROM users WHERE id=?').get(id)); if(!u){ this.sqlite.prepare('INSERT INTO users(id) VALUES(?)').run(id); u=this._rowToUser(this.sqlite.prepare('SELECT * FROM users WHERE id=?').get(id)) } return u }
  updateUser(id, patch={}){ const current=this.getUser(id); const next={...current,...patch}; this.sqlite.prepare(`INSERT INTO users(id,coin,bank,exp,level,limited,health,warn,name,registered,job,job_since,job_xp,last_claim,last_work,last_adventure,last_mining,extras,updated_at) VALUES(@id,@coin,@bank,@exp,@level,@limit,@health,@warn,@name,@registered,@job,@jobSince,@jobXp,@lastclaim,@lastwork,@lastadventure,@lastmining,@extras,unixepoch()) ON CONFLICT(id) DO UPDATE SET coin=excluded.coin, bank=excluded.bank, exp=excluded.exp, level=excluded.level, limited=excluded.limited, health=excluded.health, warn=excluded.warn, name=excluded.name, registered=excluded.registered, job=excluded.job, job_since=excluded.job_since, job_xp=excluded.job_xp, last_claim=excluded.last_claim, last_work=excluded.last_work, last_adventure=excluded.last_adventure, last_mining=excluded.last_mining, extras=excluded.extras, updated_at=excluded.updated_at`).run({...next, registered:next.registered?1:0, extras:stringify(pickExtras(next))}); const saved=this.getUser(id); this.data.users ||= {}; this.data.users[id]=saved; return saved }
  addMoney(id, amount, field='coin'){ return this.incrementUserField(id, field, amount) }
  addEconomy(id, fieldOrAmount, maybeAmount){ return typeof fieldOrAmount==='string'?this.addMoney(id,maybeAmount,fieldOrAmount):this.addMoney(id,fieldOrAmount,maybeAmount||'coin') }
  incrementUserField(id, field, delta){ const key=field==='limit'?'limited':safeField(field); const allowed=['coin','bank','exp','level','limited','health','warn','job_xp']; if(!allowed.includes(key)) throw new Error(`Campo de usuario no soportado: ${field}`); this.getUser(id); this.sqlite.prepare(`UPDATE users SET ${key}=${key}+?, updated_at=unixepoch() WHERE id=?`).run(Number(delta)||0,id); return this.getUser(id) }
  setEconomy(id, field, value){ const key=field==='limit'?'limited':safeField(field); this.getUser(id); this.sqlite.prepare(`UPDATE users SET ${key}=?, updated_at=unixepoch() WHERE id=?`).run(Number(value)||0,id); return this.getUser(id) }
  getHarem(){ return this.sqlite.prepare('SELECT * FROM harem').all().map(r=>({groupId:r.group_id,characterId:r.character_id,userId:r.user_id,lastClaimTime:r.last_claim_time,protection:parseJSON(r.protection_json,{})})) }
  replaceHarem(list=[]){ const tx=this.sqlite.transaction(rows=>{ this.sqlite.prepare('DELETE FROM harem').run(); const st=this.sqlite.prepare('INSERT OR REPLACE INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?)'); for(const e of rows) st.run(e.groupId,e.characterId,e.userId,Number(e.lastClaimTime)||now(),stringify(e.protection||{})) }); tx(list) }
  upsertHaremClaim(e){ this.sqlite.prepare('INSERT INTO harem(group_id,character_id,user_id,last_claim_time,protection_json) VALUES(?,?,?,?,?) ON CONFLICT(group_id,character_id) DO UPDATE SET user_id=excluded.user_id,last_claim_time=excluded.last_claim_time,protection_json=excluded.protection_json').run(e.groupId,e.characterId,e.userId,Number(e.lastClaimTime)||now(),stringify(e.protection||{})) }
  getSection(section){ if(section==='users'){ const out={}; for(const r of this.sqlite.prepare('SELECT * FROM users').all()) out[r.id]=this._rowToUser(r); return out } if(section==='harem') return Object.fromEntries(this.getHarem().map(e=>[`${e.groupId}:${e.characterId}`,e])); if(section==='claim_config') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,message FROM claim_config').all().map(r=>[r.user_id,r.message])); if(section==='character_favorites') return Object.fromEntries(this.sqlite.prepare('SELECT user_id,character_id FROM character_favorites').all().map(r=>[r.user_id,r.character_id])); const out={}; for(const r of this.statements.allJson.all(section)) out[r.id]=parseJSON(r.value,{}); return out }
  replaceSection(section, values={}){ if(section==='harem') return this.replaceHarem(Object.values(values)); if(section==='claim_config'){ const tx=this.sqlite.transaction(obj=>{this.sqlite.prepare('DELETE FROM claim_config').run(); const st=this.sqlite.prepare('INSERT INTO claim_config(user_id,message,updated_at) VALUES(?,?,?)'); for(const [k,v] of Object.entries(obj)) st.run(k,String(v),now())}); return tx(values)} if(section==='character_favorites'){ const tx=this.sqlite.transaction(obj=>{this.sqlite.prepare('DELETE FROM character_favorites').run(); const st=this.sqlite.prepare('INSERT INTO character_favorites(user_id,character_id,updated_at) VALUES(?,?,?)'); for(const [k,v] of Object.entries(obj)) st.run(k,String(v),now())}); return tx(values)} const tx=this.sqlite.transaction(obj=>{this.sqlite.prepare('DELETE FROM json_records WHERE section=?').run(section); for(const [id,val] of Object.entries(obj||{})) this.statements.upsertJson.run(section,id,stringify(val))}); tx(values) }
  get(section,id){ if(section==='users') return this.getUser(id); return this.getSection(section)[id] }
  set(section,id,value){ if(section==='users') return this.updateUser(id,value); this.statements.upsertJson.run(section,id,stringify(value)); this.data[section] ||= {}; this.data[section][id]=value }
  has(section,id){ return this.get(section,id)!==undefined }
  delete(section,id){ if(section==='users') return this.sqlite.prepare('DELETE FROM users WHERE id=?').run(id); this.sqlite.prepare('DELETE FROM json_records WHERE section=? AND id=?').run(section,id) }
  async read(){ return this.data } async write(){} flush(){} close(){ this.sqlite.close() } snapshot(){ return { users:this.getSection('users'), harem:this.getSection('harem'), claim_config:this.getSection('claim_config'), character_favorites:this.getSection('character_favorites') } }
}
export default SQLiteDatabase
