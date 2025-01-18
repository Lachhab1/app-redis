const express = require('express')
const { createClient } = require('redis')
const route = express.Router()
const axios = require('axios')

const redis = createClient();

// Reuse Redis connection
redis.on('error', err => console.error('Redis Error:', err));
redis.on('connect', () => console.log('Redis connected'));

(async function () {
    await redis.connect();
})();

// Cart routes using Redis
route.get('/', async (req, res) => {
    const cart = await redis.get('cart') || '[]'
    res.json(JSON.parse(cart))
})

route.post('/add', async (req, res) => {
    const { productId, quantity } = req.body
    let cart = JSON.parse(await redis.get('cart') || '[]')

    // Get product details from Redis cache
    const productKey = `https://dummyjson.com/products/${productId}`
    let productData = await redis.get(productKey)
    
    if (!productData) {
        // If product not in cache, fetch it
        const response = await axios.get(productKey)
        productData = JSON.stringify(response.data)
        await redis.set(productKey, productData)
        await redis.expire(productKey, 10)
    }

    const product = JSON.parse(productData)

    const existingItem = cart.find(item => item.productId === productId)
    
    if (existingItem) {
        existingItem.quantity += parseInt(quantity)
    } else {
        cart.push({
            productId,
            title: product.title || 'Product',
            price: product.price || 0,
            thumbnail: product.thumbnail || '',
            quantity: parseInt(quantity)
        })
    }
    
    await redis.set('cart', JSON.stringify(cart))
    res.json(cart)
})

    

route.delete('/remove/:productId', async (req, res) => {
    let cart = JSON.parse(await redis.get('cart') || '[]')
    
    if (cart.length === 0) {
        return res.status(404).json({ error: 'Cart is empty' })
    }

    const { productId } = req.params
    cart = cart.filter(item => item.productId !== productId)
    await redis.set('cart', JSON.stringify(cart))
    res.json(cart)
})

route.delete('/clear', async (req, res) => {
    await redis.del('cart')
    res.json({ message: 'Cart cleared' })
})

module.exports = route