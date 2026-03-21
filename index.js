import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios"
import dotenv from "dotenv/config"

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static("public"))

let currentUser = 1;

const db = new pg.Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT
})
db.connect()
async function tmdbAPI(endpoint,param = {}){ //endpoint takes in string values
    const api_url = "https://api.themoviedb.org/3"
    const config  = {
        headers:{
            Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`
        },
        params: param
    }
    const response = await axios.get(`${api_url}/${endpoint}`,config)
    return response.data
}

app.get('/', async (req,res) => {
    try {
        const apiResponse = await tmdbAPI("discover/movie")
        res.render('index.ejs',{response:apiResponse.results})
    } catch (error) {
        res.status(500).send("TMDB request faild")
    }
})

app.post('/about', (req,res) => {
    const movieId = req.body.movieId
    res.redirect(`/about/${movieId}`)
})

app.get('/about/:Id', async (req,res) =>{
    const movieId = req.params.Id
    try {   
        const result = await tmdbAPI(`movie/${movieId}`)
        const userMetaData = await getUserMetaData(Number(movieId))
        console.log(userMetaData)
        res.render('about.ejs',{response:result, userMetaData:userMetaData})
    } catch (error) {
        console.error(`Could not fetch TMDB movie ${error}`)
    }
})

app.post('/comments', async (req,res) =>{
    const comment = req.body.comment
    const movieId = req.body.movieId
    await insertUserMetaData('tester', comment, movieId)
    res.redirect(`/about/${movieId}`)
})

async function insertUserMetaData(user,comment,movieId){
    try {
    const user_id = await db.query("SELECT user_id FROM users WHERE user_name = $1",[user])
    console.log(comment)
    await db.query("INSERT INTO users_media (users_id, notes, movie_id) VALUES ($1, $2, $3)", [user_id.rows[0].user_id, comment, Number(movieId)])
    console.log(user_id.rows[0].uswer_id)
    currentUser = user_id.rows[0].user_id
    }catch (error) {
        console.error(`Could not insert user ${error}`)
    }
    return
}

async function getUserMetaData(movieId){
    console.log(typeof movieId)
    const fetchUser = await db.query("SELECT notes, created_at FROM users_media um INNER JOIN users u ON u.user_id = um.users_id WHERE u.user_id = $1 AND um.movie_id = $2 ORDER BY created_at DESC", [currentUser, movieId])
    return fetchUser.rows[0] || null
}

app.listen(port, (req,res) =>{
    console.log(`listening on ${port}`)
})