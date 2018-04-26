const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const botRoutes = require('./routes/bot.route')
const PORT = process.env.PORT || 9999
/**
 * setup our parser to accept json and POST data.
 */
app.use(bodyParser.json({type: 'application/json'}))
app.use(bodyParser.urlencoded({extended: true}))

 /**
  * @middleware - bot
  * @routes /bot/:route
  */
app.use('/bot',botRoutes)


/**
 * main program loop.
 */
app.listen(PORT,(req,resp,next) => {
    console.log("Listening for connections....")
});
