import { join } from 'path'
import { promises as fs } from 'fs'
import { promisify } from 'util'
import { google } from 'googleapis'
import { EventEmitter } from 'events'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']
const __dirname = dirname(fileURLToPath(import.meta.url))
const port = process.env.GDRIVE_OAUTH_PORT || 3000

const TOKEN_PATH = join(__dirname, '..', 'token.json')

class GoogleAuth extends EventEmitter {
  constructor() {
    super()
  }

  async authorize(credentials) {
    let token
    const { client_secret, client_id } = credentials
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, `http://localhost:${port}`)
    try {
      token = JSON.parse(await fs.readFile(TOKEN_PATH))
    } catch (e) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES
      })
      this.emit('auth', authUrl)
      let code = await promisify(this.once).bind(this)('token')
      token = await oAuth2Client.getToken(code)
      await fs.writeFile(TOKEN_PATH, JSON.stringify(token))
    } finally {
      await oAuth2Client.setCredentials(token)
    }
  }

  token(code) {
    this.emit('token', code)
  }
}

class GoogleDrive extends GoogleAuth {
  constructor() {
    super()
    this.path = '/drive/api'
  }

  async getFolderID(path) {

  }

  async infoFile(path) {

  }

  async folderList(path) {

  }

  async downloadFile(path) {

  }

  async uploadFile(path) {

  }
}

export { GoogleAuth, GoogleDrive }