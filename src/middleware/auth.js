//Middleware to Authenticate user Tokens
const Token = require('jsonwebtoken')
const User = require('../models/user.js')


const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '')
        //console.log(token)
        const decoded = Token.verify(token, process.env.JWT_SECRET)
        const user = await User.findOne({_id: decoded._id, 'tokens.token': token})

        if (!user) {
            throw new Error()
        }
        req.token = token
        req.user = user
        console.log('Authenticated: ', user.email)
        next()
    } catch (e) {
        res.status(401).send({error: 'Authentication Failed'})
    }
    
    //console.log('auth middleware Announcement')
}

module.exports = auth