import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import axios from "axios"
import dotenv from "dotenv/config"

const app = express();
const port = 3000;

app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))

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
        console.log(apiResponse.results)
        res.render('index.ejs',{response:apiResponse.results})
    } catch (error) {
        res.status(500).send("TMDB request faild")
    }
})

app.listen(port, (req,res) =>{
    console.log(`listening on ${port}`)
})