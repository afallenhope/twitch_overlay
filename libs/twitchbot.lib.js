const IrcLite =  require('./irclite.lib');
const EventEmitter = require('events').EventEmitter;
const irccfg = require('./../models/irc.config');
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
        const twitch_tags_ptrn = /@badges=(.*);color=(.*);display-name=(.*)emotes=.*;login=(.*);mod=(\d{1});msg-id=(.*);msg-param-(.*)=(.*);room-id=(\d+);subscriber=(\d{1});system-msg=(.*);.*;turbo=(\d{1});user-id=(\d+);user-type=([^ ]*)\s:([^ ]*)\s([^ ]*)\s([^ ]*)\s:(.*)/g
        const matches = buffer.match(twitch_tags_ptrn)
        if (matches) {
            twitch_tags = {
                badge : matches[1],
                color : matches[2],
                display_name : matches[3],
                sender :  matches[4],
                isMod : Boolean(matches[5]),
                msg_id : matches[6],
                param_msg_type : matches[7],
                param_msg_value : matches[8],
                recipient : matches[9],
                isSub : Boolean(matches[10]),
                sys_msg : matches[11],
                isTurbo : Boolean(matches[12]),
                user_id : matches[13],
                user_type : matches[14],
                nickname : matches[15],
                realname : matches[16],
                hostname : matches[17],
                msg_type : matches[18],
                payload : matches[19]
            }
            console.log(twitch_tags);
        }
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
        const twitch_tags_ptrn = /@badges=(.*);color=(.*);display-name=(.*)emotes=.*;mod=(\d{1});room-id=(\d+);subscriber=(\d{1});.*turbo=(\d{1});user-id=(\d+);user-type=\s:([^ ]*)\!([^ ]*)\@([^ ]*)\s([^ ]*)\s([^ ]*)\s:(.*)/
        const tags = raw.match(twitch_tags_ptrn);
        
        console.log('[!] New Message\n %s %s: %s',
                    tags, 
                    recipient,
                    sender.username,
                    message);
    }
}

module.exports = TwitchBot;
