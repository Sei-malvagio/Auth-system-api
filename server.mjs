import express from 'express'
import fs from 'fs'
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import jwt from 'jsonwebtoken'
import cors from 'cors'

import * as clr from './colors/colors.mjs'

const app = express()
const PORT = 3000
const SECRET_KEY = 'irsanged123@'

//cross-origin resource sharing
app.use(cors())

//buat parse body jsonnya
app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

//untuk render profile
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'profile'))

//join ke dir db
const dimanaDB = path.join(__dirname, 'userdb', 'db.json')

//fungsi untuk read data dari db
const readDB = () => {
  const readData = fs.readFileSync(dimanaDB, 'utf8')
  return JSON.parse(readData)
}

//fungsi kebalikan dari read yaitu write
const writeDB = (data) => {
   fs.writeFileSync(dimanaDB, JSON.stringify(data, null, 2, 'utf8'))
}

app.post('/api/signup', async(req, res) => {
   const { nama_lengkap, email, password, pekerjaan, gender, path } = req.body
   const db = readDB()

   //apakah si user itu exist?
   const isExistingUser = db.users.find(u => u.email === email)
   if(isExistingUser) {
     return res.status(400).json({ message: 'Pengguna sudah ada' })   
   }

   let id = randomId()
   
   while(db.users.find(u => u.id === id)) {
     id = randomId()
   }

   const new_user = { 
     id: id, 
     nama_lengkap: nama_lengkap,
     email: email,
     password: password,
     pekerjaan: pekerjaan,
     gender: gender,
     path
   }

   db.users.push(new_user)
   writeDB(db)
   console.log(`\n[✓] ${clr.bg.blue}[+] NEW USER SIGNUP:\n${clr.colors.end}[/] Nama lengkap: ${clr.colors.green}${nama_lengkap}${clr.colors.end}\n[/] Email: ${clr.colors.green}${email}${clr.colors.end}\n[/] Password: ${clr.colors.green}${password}${clr.colors.end}`)

   return res.status(201).json({ message: 'Akun berhasil dibuat' })
})

app.post('/api/login', async(req, res) => {
   const { nama_lengkap, email, password, pekerjaan, gender } = req.body
   const db = readDB()

   //apakah si user itu ada?
   const orang = db.users.find(u => u.email === email)
   let noIdFound = ''

   if(!orang || !orang.password) {
       console.log(`\n[LOGIN FAILED]\nEmail: ${email}\nPassword: ${password}`)
       console.log(`\n${clr.colors.red}[!]${clr.colors.end} The user try to log, but the password is wrong`)
       return res.status(400).json({ message: 'Email atau Password salah!' })
     }
    
    const token = jwt.sign({ id: orang.id}, SECRET_KEY, { expiresIn: '1h' })

    res.json({ message: 'Login berhasil', token: token })
    console.log(`\n${clr.bg.green}[+] NEW USER LOGIN:${clr.colors.end}\n[/] Email: ${clr.colors.cyan}${email}${clr.colors.end}\n[/] Password: ${clr.colors.cyan}${password}${clr.colors.end}`)
})

//middleware
const autentikasiToken = (req, res, next) => {
   const header = req.headers['authorization']
   const token = header && header.split(' ')[1]

   if(!token) return res.status(401).json({ status: 401, message: 'Unauthorized' })

   jwt.verify(token, SECRET_KEY, (err, decoded) => {
     if(err) return res.status(403).json({ status: 403, message: 'Akses dilarang' })
      req.user = decoded
      next() 
   })
}

app.get('/api/protected', autentikasiToken, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

app.get('/api', (req, res) => {
    res.status(200).json({ author: 'Jafar', message: 'server up, db manual', status:200 })
    if(res.ok)
    console.log(`[✓] ${clr.bg.green}GET${clr.colors.end} \'/\', status: ${clr.colors.green}Good${clr.colors.end}`)
})

app.get('/api/profile', autentikasiToken, (req, res) => {
    const users = req.user
    const db = readDB()

    const user = db.users.find(u => u.id === users.id)
  
    console.log(req.user)
    
    res.render('profile', { user })
})

const randomId = () => {
   const rand = Math.floor(Math.random() * (500 - 1 + 1) + 1)
   return rand
}

app.listen(PORT, () => {
  console.log(`${clr.bold}${clr.bg.magenta}[√] Server up, listen on port ${PORT}${clr.colors.end}`)
}) 

export default app
