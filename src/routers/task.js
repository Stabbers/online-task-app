const express = require('express')
const auth = require('../middleware/auth.js')
const Task = require('../models/task.js')
const router = new express.Router()


//Make a new Task via REST API, testing with PostmanAsynhronously
router.post('/tasks', auth, async (req, res) => {
    //const task = new Task(req.body)

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        await task.save()
        res.status(201).send(task)
    } catch (e) {
        res.status(400).send(e)
    }
})

//list all tasks
router.get('/tasksALL', auth , async (req, res) => {
    try {
        const tasks = await Task.find({})
        res.send(tasks)
    } catch (e) {
        res.status(500).send()
    }
})


//Pagination support: with limit (how many to show), and Skip (at what point you show them)
// GET /tasks/?limit=3&skip=0
// sorting: gets a sort paradigm, and then orders the items before they are displayed
//format: GET /tasks?sortBy=attribute:label
//callback format sort: {attribute: +-1} 1 for ascending, and -1 for descending
//get tasks you have made, returns the NOT completed entries for any present query=/=true
//format:P GET /tasks?completed=false
router.get('/tasks', auth , async (req, res) => {
    const match = {}
    const sort = {}
    
    if (req.query.completed) {
        match.completed = req.query.completed === 'true'
    }
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':')
        //this is WICKED COOL formatting
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1
    }

    try {
        //const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    } catch (e) {
        res.status(500).send()
    }
})

//grab a specific task by TaskID
router.get('/tasks/:id', auth , async (req, res) => {
    const _id = req.params.id
    console.log('looking for ID: '+ _id)
    try {
        //const task = await Task.findById(_id)
        const task = await Task.findOne({_id, owner: req.user._id})
        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

//Update Task Data only yours
router.patch('/tasks/:id', auth , async (req, res) => {
    const updates = Object.keys(req.body)
    const changeables = ['description', 'completed']
    const updateValidity = updates.every( (update) => changeables.includes(update))

    if (!updateValidity) {
        return res.status(400).send({error: 'Update contains bad element'})
    }
    try {
        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})
        
        updates.forEach( (item) => {
            task[item] = req.body[item]
        })
        await task.save()

        if (!task) {
            return res.status(404).send()
        }

        res.send(task)
    } catch (e) {
        res.status(400).send()
    }
})

//delete task by ID ASYNC
router.delete('/tasks/:id', auth , async (req, res) => {
    try {
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})

        if (!task) {
            return res.status(404).send()
        }
        res.send(task)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router