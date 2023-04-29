import cors from "cors"
import mysql from "mysql2"
import express from "express"

// const sqlConfig = { host: "localhost", port: 3366, user: "root", password: "root", database: "personal_web", } const db = mysql.createConnection( sqlConfig ) db.connect(); db.on('error', err =>{ console.log("lost connection"); connect.mysql.createConnection(sqlConfig) })

const app = express()

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "root",
    port: 3306,
    database: "personal_web",
})

db.connect(function(error){
    if(!!error) console.log(error);
     else console.log('SQL Database Connected!');
});
//if there is a auth problem
// ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'root';

app.use(express.json())
app.use(cors())

app.get("/", (req, res)=>{
    res.json("hello this is the backend")
})

app.get("/comment", (req, res)=>{
    const sql = "SELECT * FROM `Comment`"
    db.query(sql, (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.post("/comment", (req, res)=>{
    const sql = "INSERT INTO `Comment`(`user_id`, `content`, `create_time`, `update_time`) VALUES (?)"
    const values = [
        req.body.user_id,
        req.body.content,
        req.body.create_time,
        req.body.update_time,
    ]
 
    db.query(sql, [values], (err, data) => {
        if(err) return res.json(err)
        return res.json("Comment has been created successfully.")
    })
})

app.delete("/comment/:id", (req, res)=>{
    const commentId = req.params.id;
    const sql = "DELETE FROM `Comment` WHERE id = ?"

    db.query(sql, [commentId], (err, data) => {
        if(err) return res.json(err)
        return res.json("Comment has been delete successfully.")
    })
})

app.get("/comment/:id", (req, res)=>{
    const commentId = req.params.id;
    const sql = "SELECT * FROM `Comment` WHERE `id` = ?"
    db.query(sql, [commentId], (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.put("/comment/:id", (req, res)=>{
    const commentId = req.params.id;
    const sql = "UPDATE `Comment` SET `user_id` = ?,`content` = ?,`create_time` = ? WHERE `id` = ?"
    
    const values = [
        req.body.user_id,
        req.body.content,
        req.body.create_time,
        // req.body.update_time,
    ]

    db.query(sql, [...values, commentId], (err, data) => {
        if(err) return res.json(err)
        return res.json("Comment has been update successfully.")
    })
})

app.listen(5001, ()=>{
    console.log("Connect to backend!1")
})
