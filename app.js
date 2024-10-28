const { router } = require("./users/routes/routes") 
const express = require("express")
const env = require('dotenv')
const path = require('path')
const axios = require('axios')
const app = express()
const session = require('express-session')

// Load environment variables
env.config()

// Use session for the login
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        maxAge:20*60*60*1000,
        secure: false
     } 
    
}))

// Set up EJS and static files
app.use(express.static(path.join(__dirname, 'users/assets')))
app.use(express.static(path.join(__dirname, 'admin')))
app.set('views', path.join(__dirname, 'users/views'))
app.set('view engine', 'ejs')

// Parse form data and JSON
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

// Use the router for employees routes
app.use('/employees', router)

const port = process.env.PORT || 3000

// Start the server
app.listen(port, () => {
    console.log(`The server listens on port: ${port}`)
})
