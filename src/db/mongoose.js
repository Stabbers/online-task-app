const mongoose = require('mongoose')
// const validator = require('validator')


//Sets-up our connection to the Database
mongoose.connect( process.env.MONGODB_URL , {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false
})
