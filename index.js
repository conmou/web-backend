import cors from "cors"
import mysql from "mysql2"
import express, { Router } from "express"
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import session from "express-session"
import bodyparesr from 'body-parser'
import dotenv from 'dotenv'

dotenv.config();
const app = express()

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_ACCOUNT,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    database: process.env.SCHEMA_NAME,
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
    origin: [process.env.HOST+process.env.FRONTEND_PORT],
    // methods: ["GET", "POST"],
    credentials: true,
    })
);

/* Register */ 
app.post('/signup', async (req, res)=>{
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
    
        const sql = "INSERT INTO `User`(`name`, `email`, `password`, `is_anonymous`) VALUES (?, ?, ?, ?)";
        const values = [
          name,
          email,
          hashedPassword,
          0,
        ];
    
        db.query(sql, values, (err, data) => {
          if (err) {
            return res.json(err);
          }
          return res.json(data);
        });
      } catch (err) {
        return res.json(err);
      }
})

/* JWT */ 
const verifyJwt= (req, res, next)=>{
    const token = req.headers["access-token"];
    if(token === ''){
        return res.json("we need token please provide it for next time")
    }else{
        jwt.verify(token, "jwtSecretKey", (err, decoded)=>{
            if(err){
                res.json("Not Authenticated");
                // localStorage.removeItem('token');
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

app.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
  
      const sql = "SELECT * FROM `User` WHERE `email` = ? AND `is_anonymous` = 0";
      db.query(sql, [email], async (err, data) => {
        if (err) {
          return res.json(err);
        }
        if (data.length > 0) {
          const hashedPassword = data[0].password;
          const match = await bcrypt.compare(password, hashedPassword);
  
          if (match) {
            const id = data[0].id;
            const token = jwt.sign({ id }, "jwtSecretKey", { expiresIn: 3000 });
            // // 将Token存储到数据库中
            const updateSql = "UPDATE `User` SET `token` = ? WHERE `id` = ?";
            db.query(updateSql, [token, id], (updateErr, updateResult) => {
                if (updateErr) {
                    return res.json(updateErr);
                }
                return res.json({ Login: true, token, data });
            });
          } else {
            return res.json({ Message: "帳號或密碼錯誤" });
          }
        } else {
          return res.json({ Message: "帳號或密碼錯誤" });
        }
      });
    } catch (err) {
      return res.json(err);
    }
});

app.post('/logout/:id', async (req, res) => {
    const userId = req.params.id;
    const token = jwt.sign({ id }, "jwtSecretKey", { expiresIn: 3000 });
    const sql = "UPDATE `User` SET `token`= NULL WHERE `id` = ?";
    
    db.query(sql, [userId], (err, data) => {
        if (err) {
            return res.json(err);
        }
        return res.json({ Logout: true });
    });
});

app.post('/noauth/login', async (req, res) => {
    try {
        const sql = "SELECT * FROM `User` WHERE `name` = 'guest'";
        db.query(sql, (err, data) => {
          const id = data[0].id;
          const token = jwt.sign({ id }, "jwtSecretKey", { expiresIn: 300 });
          if (err) {
            return res.json(err);
          }
          return res.json({ is_anonymous_Login: true, token, data });
        //   return res.json(data);
        });
    } catch (err) {
        return res.json(err);
    }
});

/* User */
app.get("/user/:id", verifyJwt,(req, res)=>{
    const sql = "SELECT * FROM `User` WHERE id = ?"
    const userId = req.params.id;
    db.query(sql, userId, (err, data)=>{
        if(err) return res.json(err)
        return res.json(data)
    })
})

app.put("/user/:id", verifyJwt, (req, res)=>{
    const userId = req.params.id;
    const sql = "UPDATE `User` SET `name` = ?, `sex` = ?, `phone` = ?, `des` = ? WHERE `id` = ?"

    const values = [
        req.body.username,
        req.body.sex,
        req.body.phone,
        req.body.des,
    ]

    db.query(sql, [...values, userId], (err, data) => {
        if(err) return res.json(err)
        return res.json("User has been update successfully.")
    })
})

/* Comment */ 
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

app.post("/comment/search", (req, res)=>{
    // console.log(req.body)
    const sql = "SELECT * FROM `Comment` WHERE `content` LIKE ?"
    const values = req.body.content
    const queryValue = `%${values}%`

    db.query(sql, queryValue, (err, data) => {
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

app.listen(process.env.BACKEND_PORT, ()=>{
    console.log("Connect to backend!1")
})
