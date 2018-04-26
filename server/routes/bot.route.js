const express = require('express');
const router = express.Router();
const TwitchBot = require('./../../libs/twitchbot.lib');

router.get('/', (req,resp,next) => {
    bot = new TwitchBot();
    bot.start();

    resp.json({
        success : true,
        code: 200,
        message: 'ok'
    })
})

module.exports = router;
