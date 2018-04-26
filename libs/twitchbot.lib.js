const IrcLite =  require('./irclite.lib');
const EventEmitter = require('events').EventEmitter;
const irccfg = require('../models/irc.config');
let self;

class TwitchBot extends EventEmitter {
    constructor() {
        super();
       irccfg['channels'] = ['#afallenhope'];

        this.irc = new IrcLite('irc.chat.twitch.tv', 6667,irccfg);
        this.irc.on('connected',    () => { self.irc_connected() });
        this.irc.on('end_motd',     () => { self.irc_motd() });
        this.irc.on('message',      (recipient,sender,message,raw,socket) => { self.irc_message(recipient,sender,message,raw,socket) });
        this.irc.on('data',         (data) => { self.irc_datareceived(data) });
        this.irc.on('error',        (error) => { self.irc_error(error) });
        this.irc.on('disconnected', (error) => { self.irc_disconnected(error) });;
        self = this;
    }


    /**
     * 
     */
    start () {
        console.log('TwitchBot::start() >',this);
        this.irc.connect();
    }

    stop(quitMessage ='') {
        console.log('TwitchBot::stop() >', this );
        this.irc.quit(quitMessage);
    }
    

    /**
     * 
     */
    irc_connected() {
        console.log('TwitchBot::irc_connected() >');
        console.log('Connected',this);
    }


    /**
     * 
     */
    irc_motd() {
        this.irc.reqCAP('twitch.tv/membership')
        this.irc.reqCAP('twitch.tv/tags')
        this.irc.reqCAP('twitch.tv/membership')
        if (this.irc.channels ) {
           this.irc.joinChannel(this.irc.channels.join(','));
        }
    }


    /**
     * 
     * @param {string} error 
     */
    irc_error(error) {
        console.warn('Error!', error);
    }


    /**
     * 
     * @param {boolean} had_error 
     */
    irc_disconnected(had_error) {
        console.log('Disconnected! ' , had_error)
    }
    

    /**
     * 
     * @param {string} buffer 
     */
    irc_datareceived(buffer) {
        console.log('Received', buffer);
    }

    /**
     * 
     * @param {string} recipient 
     * @param {Object} sender 
     * @param {string} message 
     * @param {string} raw 
     * @param {net.Socket} socket 
     */
    irc_message(recipient, sender, message, raw, socket) {
        
        console.log('[!] New Message\n %s %s: %s', 
                    recipient,
                    sender.username,
                    message);
    }
}

module.exports = TwitchBot;
