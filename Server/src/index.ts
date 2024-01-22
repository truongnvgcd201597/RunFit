import express from 'express'
import userRouters from './routes/users.routes'
import databaseServices from './services/database.services'
const app = express()
const port = 3000

app.use(express.json()) // middleware
app.use('/users', userRouters)
databaseServices.connect()

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
