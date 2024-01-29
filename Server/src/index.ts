import express from 'express'
import userRouters from './routes/users.routes'
import databaseServices from './services/database.services'
import { Request, Response, NextFunction } from 'express'
const app = express()
const port = 3000

app.use(express.json())

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  return res.status(400).json({ message: 'Error', error: error.message })
})

app.use('/users', userRouters)
databaseServices.connect()

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
