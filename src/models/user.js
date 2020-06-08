const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const Token = require('jsonwebtoken')
const Task = require('./task.js')



const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        lowercase: true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid')
            }
        }
    },
    password: {
        type: String,
        required: true,
        minlength: 7,
        trim: true,
        validate(value) {
            if (value.toLowerCase().includes('word') || value.toLowerCase().includes('pass')) {
                throw new Error('Password cannot contain sections of "password"')
            }
        }
    },
    age: {
        type: Number,
        default: 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a postive number')
            }
        }
    },
    tokens: [{
        token: {
            type: String,
            required: true
        }

    }],
    avatar: {
        type: Buffer
    }
}, {
    timestamps: true
})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'owner'
})

//make Authentication token for logging in contains: SECRET KEY
userSchema.methods.generateAuthToken = async function () {
    const user = this
    const token = Token.sign({_id: user._id.toString()}, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({token})
    await user.save()

    return token
}

userSchema.methods.toJSON = function () {
    const userObject = this.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject
}


//Find user by Email for Login - Schema
userSchema.statics.findByCredentials = async function (email, textPW) {
    const user = await User.findOne({email})

    if (!user) {
        throw new Error('Unable to login')
    }

    const matching = await bcrypt.compare(textPW, user.password)

    if (!matching) {
        throw new Error('Unable to login')
    }

    return user
} 

//SAVE USER; Hash plaintext PW before saving
userSchema.pre('save', async function (next) {
    const user = this

    //console.log('Preparing user save')
    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8)
    }
    next()
})


//Delete user's Tasks when user is Deleted:
userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({owner: user._id})
    next()
})

const User = mongoose.model('User', userSchema)

module.exports = User