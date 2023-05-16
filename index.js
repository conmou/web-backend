import cors from "cors"
import mysql from "mysql2"
import express, { Router } from "express"
import jwt from 'jsonwebtoken'
import session from "express-session"
import bodyparesr from 'body-parser'

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
// app.use(cors())
app.use(
    cors({
    origin: ["http://localhost:3000"],
    // methods: ["GET", "POST"],
    credentials: true,
    })
);

// app.use(
//     session({
//       secret: 'googleAuth'
//     })
//   )
  
  //不放這個由axios發出的post 拿到的req.body會無法解析
app.use(bodyparesr.json())

// app.post('/auth/google', async (req, res) => {
 
//     //引入官方的套件
//     const { OAuth2Client } = require('google-auth-library')
//     const CLIENT_ID = '913223523927-2v1r4bfrprcvcbtvnpv52h844en879e8.apps.googleusercontent.com'
//     const client = new OAuth2Client(CLIENT_ID)
//     const token = req.body.id_token
    
//     //將token和client_Id放入參數一起去做驗證
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: CLIENT_ID
//     })
    
//     //拿到的ticket就是換回來的使用者資料
//     console.log(ticket)
    
//     //以下就個人需求看要拿資料做哪些使用
//     //ex 使用者資訊存入資料庫，把資料存到 session內 等等
// })

app.post('/signup', (req, res)=>{
    const sql = "INSERT INTO `User`(`name`, `email`, `password`) VALUES (?)"
    const values = [
        req.body.name,
        req.body.email,
        req.body.password,
    ]
    db.query(sql, [values], (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

const verifyJwt= (req, res, next)=>{
    const token = req.headers["access-token"];
    if(token === ''){
        return res.json("we need token please provide it for next time")
    }else{
        jwt.verify(token, "jwtSecretKey", (err, decoded)=>{
            if(err){
                res.json("Not Authenticated");
            }else{
                req.id = decoded.id;
                next();
            }
        })
    }
}

app.get("/", verifyJwt, (req, res)=>{
    res.json({Status: "Success"})
})

app.post('/login', (req, res)=>{
    const sql = "SELECT * FROM `User` WHERE `email` = ? AND `password` = ?"
    db.query(sql, [req.body.email, req.body.password], (err, data)=>{
        if(err) return res.json(err)
        if(data.length > 0){
            const id = data[0].id
            const token = jwt.sign({id}, "jwtSecretKey", {expiresIn: 3000})
            return res.json({Login: true, token, data})
        }else{
            return res.json({Message: "帳號或密碼錯誤"})
        }
    })
})

app.get("/comment", (req, res)=>{
    const sql = "SELECT Comment.*, User.name FROM `Comment`,`User` WHERE Comment.user_id = User.id"
    db.query(sql, (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.get("/comment/count", (req, res)=>{
    const sql = "SELECT COUNT(*) AS count FROM `Comment`"
    db.query(sql, (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.post("/comment", verifyJwt, (req, res)=>{
    const sql = "INSERT INTO `Comment`(`user_id`, `content`) VALUES (?)"
    const values = [
        req.body.user_id,
        req.body.content,
    ]
 
    db.query(sql, [values], (err, data) => {
        if(err) return res.json(err)
        return res.json("Comment has been created successfully.")
    })
})

app.post("/comment/search", (req, res)=>{
    console.log(req.body)
    const sql = "SELECT * FROM `Comment` WHERE `content` LIKE ?"
    const values = req.body.content
    const queryValue = `%${values}%`

    db.query(sql, queryValue, (err, data) => {
        if(err) return res.json(err)
        return res.json(data)
    })
})
// app.post("/comment/search", (req, res)=>{
//     console.log(req.body)
//     const sql = "SELECT * FROM `Comment` WHERE `content` LIKE '%?%'"
//     const values = [
//         req.body.content,
//     ]
//     db.query(sql, [values], (err, data) => {
//         if(err) return res.json(err)
//         return res.json(data)
//     })
// })


app.delete("/comment/:id", verifyJwt, (req, res)=>{
    const commentId = req.params.id;
    const sql = "DELETE FROM `Comment` WHERE id = ?"

    db.query(sql, [commentId], (err, data) => {
        if(err) return res.json(err)
        return res.json("Comment has been delete successfully.")
    })
})

app.get("/comment/:id", verifyJwt, (req, res)=>{
    const commentId = req.params.id;
    const sql = "SELECT * FROM `Comment` WHERE `id` = ?"
    db.query(sql, [commentId], (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.put("/comment/:id", verifyJwt, (req, res)=>{
    const commentId = req.params.id;
    const sql = "UPDATE `Comment` SET `content` = ? WHERE `id` = ?"

    const values = [
        req.body.content,
    ]

    db.query(sql, [...values, commentId], (err, data) => {
        if(err) return res.json(err)
        return res.json("Comment has been update successfully.")
    })
})

app.listen(5001, ()=>{
    console.log("Connect to backend!1")
})
