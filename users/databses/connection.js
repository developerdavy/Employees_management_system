const express = require('express')
const mysql = require('mysql')



const connection = mysql.createConnection({
    host : 'localhost',
    user: 'root',
    password: '',
    database:  'employees'
})

connection.connect((err)=>{
    if(err){
        console.log("Error connectong to the database")
    } else {
        console.log("connected to the database")
    }
})

module.exports = {connection}