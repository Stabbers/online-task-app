const express = require('express')
require('./db/mongoose.js')
const userRouter = require('./routers/user.js')
const taskRouter = require('./routers/task.js')

//Environment and other Variables
const app = express()
const port = process.env.PORT


//Middleware to announce Server Requests TESTING
app.use((req, res, next) => {
    console.log('server command: ', req.method, req.path)
    next()
})

//awd


app.use(express.json())
app.use(userRouter)
app.use(taskRouter)

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~


app.listen(port, () => {
    console.log('Server running on port: ' + port)
})
