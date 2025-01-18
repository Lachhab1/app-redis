const express = require('express')
const axios = require('axios')
const qs = require('querystring')
const { createClient } = require('redis')

const route = express.Router()
const redis = createClient();

// Gestion des événements Redis
redis.on('error', err => console.error('Erreur Redis:', err));
redis.on('connect', () => console.log('Redis connecté'));

// Connexion à Redis de manière asynchrone
(async function () {
    await redis.connect();
})();

const URL = "https://dummyjson.com/products"
route.get('/', async (req, res) => {
    const q = qs.encode(req.query)
    const url = `${URL}?${q}`
    const response = await get(url)
    res.json(response)
})
route.get('/:id', async (req, res) => {
    const url = `${URL}/${req.params.id}`
    const response = await get(url)
    res.json(response.data)

})

module.exports = route

function get(url) {
    return new Promise(async (resolve, reject) => {
        const response = await redis.get(url)
        if (!response) {
            console.log('MISS')
            const r = await axios.get(url)
            await redis.set(url, JSON.stringify(r.data))
            // Le cache expire après 10 secondes.
            await redis.expire(url, 10)
            return resolve(r.data)
        } else {
            console.log('HIT')
            return resolve(JSON.parse(response))
        }
    })
}