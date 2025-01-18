const express = require('express')
const productsRoute = require('./routes/products')
const cartRoute = require('./routes/cart')

const app = express()

// Middleware order is important - parse JSON before routes
app.use(express.json())
app.use(express.static('./public'))
app.use((log))

// Routes
app.use('/products', productsRoute)
app.use('/cart', cartRoute)

app.listen(3000)

function log(req, res, next) {
    console.log('Path : ', req.path, " QS : ", req.query, ' Body', req.body)
    next()
}