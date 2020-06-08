const express = require('express')
const auth = require('../middleware/auth.js')
const User = require('../models/user.js')
const router = new express.Router()
const sharp = require('sharp')

const {sendWelcomeEmail, sendFarewellEmail} = require('../emails/accounts.js')


//file upload setup, specifies file you can send to be an Image
const multer = require('multer')
const uploadAvatar = multer({
    //dest: 'avatars',
    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        //regular expressions come within /a set of/ those
        if (!file.originalname.match(/\.(jpg|jpeg|png|tiff|tif)$/)) {
            return cb(new Error('Must upload images only: (.jpg, .jpeg, .png, or .tiff) files'))
        }

        cb(undefined, true)

        // cb(new Error('Error Text')) // Named Error
        // cb(undefined, true) // Success
        // cb(undefined, false) //silently regect the upload
    }
})

//Get Avatar and display by ID
router.get('/users/:id/avatar', async (req, res) => {
    
    try {
        const user = await User.findById(req.params.id)

        if (!user) {
            throw new Error()
        }

        //detect filetype
        res.set('Content-Type', 'image/png')

        res.send(user.avatar)   
    } catch (e) {
        res.status(404).send()
    }
    
    
    
})


//REMOVE user's Profile Picture, set attribute = undefined removes it
router.delete('/users/me/avatar', auth, async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send(req.user)   
})

//Update/set user's Profile Picture,
router.post('/users/me/avatar', auth, uploadAvatar.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({width: 300, height: 300}).png().toBuffer()
    
    
    // without destination dicated above, we get access to req.file
    req.user.avatar = buffer

    await req.user.save()
    res.status(200).send()
}, (error, req, res, next) => {
    res.status(400).send({error: error.message})
})


//delete user; self
router.delete('/users/me', auth, async (req, res) => {
    sendFarewellEmail(req.user.email, req.user.name) //Does not need to be await-ed
    try {
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send()
    }
})

//delete user by ID ASYNC
router.delete('/users/:id', auth, async (req, res) => {

    try {
        const user = await User.findByIdAndDelete(req.params.id)

        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})

//Update user Info,
router.patch('/users/me', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const changeables = ['name', 'email' , 'age', 'password']
    const updateValidity = updates.every( (update) => changeables.includes(update))

    if (!updateValidity) {
        return res.status(400).send({error: 'Update contains elements not found in users'})
    }


    try {
        const user = req.user

        updates.forEach( (item) => {
            user[item] = req.body[item]
        })
        await user.save(updates)

        res.send(user)
    } catch (e) {
        res.status(400).send()
    }
})


//find user by ID, and replace data ASYNC; cannot change Password
router.patch('/users/:id', auth, async (req, res) => {
    const updates = Object.keys(req.body)
    const changeables = ['name', 'email' , 'age']
    const updateValidity = updates.every( (update) => changeables.includes(update))

    if (!updateValidity) {
        return res.status(400).send({error: 'Update contains elements not found in users'})
    }

    try {
        //old method
        //const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true} )
        
        const user = await User.findById(req.params.id)

        updates.forEach( (item) => {
            user[item] = req.body[item]
        })
        await user.save(updates)

        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(400).send()
    }
})

//CREATE user
router.post('/users', async (req, res) => {
    const user = new User(req.body)

    try {
        const token =  await user.generateAuthToken()
        await user.save()
        sendWelcomeEmail(user.email, user.name) //Does not need to be await-ed
        res.status(201).send({user, token})
    } catch (e) {
        res.status(400).send(e)
    }
})

//have user Login and check PWS, then create access TOKEN: JWT
router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.status(200).send({user, token})
    } catch (e) {
        res.status(400).send()
    }
})

//LOGOUT ALL of a user's sessions
router.post('/users/logoutALL', auth, async (req, res) => {
    try {
        req.user.tokens = []

        await req.user.save()

        res.status(200).send()
    } catch (e) {
        res.status(500).send()
    }
})

//LOGOUT Active user invalidating 1 token
router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.status(200).send()
    } catch (e) {
        res.status(500).send()
    }
})


//lists ME wits authenticaiton
router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

//grab a specific user by ID DEPRICATED
router.get('/users/:id', auth, async (req, res) => {
    const _id = req.params.id
    console.log('looking for ID: '+ _id)

    try {
        const user = await User.findById(_id)
        if (!user) {
            return res.status(404).send()
        }
        res.send(user)
    } catch (e) {
        res.status(500).send()
    }
})


//list all users, requires authentication 
router.get('/users', auth, async (req, res) => {

    try {
        const users = await User.find({})
        res.send(users)
    } catch (e) {
        res.status(500).send()
    }

})




module.exports = router