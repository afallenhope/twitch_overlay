const EventEmitter = require('events').EventEmitter;
const net = require('net');
const util = require('util');
const inherits = util.inherits;
const format = util.format;
const irc = require('./constants/constants').irc


class IrcLite extends EventEmitter
{

    /**
     * 
     * @param {string} server 
     * @param {number} port 
     * @param {Object} options 
     */
    constructor(server = 'irc.freenode.net', port = 6667, options = {} ) {
        super();
        this.servername = server;
        this.port = port;
        this.user = {};
        if (options.user) {
            this.user.username = (options.user.username) ? options.user.username : 'IrcLite' + Math.ceil(Math.random()*999);
            this.user.realname = (options.user.realname) ? options.user.realname : 'IrcLite User' + Math.ceil(Math.random()+1 * 999);
            this.user.hostname = (options.user.hostname) ? options.user.hostname  : server;
            this.user.password = (options.user.password) ? options.user.password : undefined;
        }
        this.perform = (options.perform) ? options.perform : {};
        this.connected = false;
        this.channels = (options.channels) ? options.channels : [];
    }

    
    /**
     * 
     * 
     * @param {string} [server='irc.freenode.net'] 
     * @param {number} [port=6667] 
     * @memberof IrcLite
     */
    connect(server = 'irc.freenode.net', port = 6667) {        
        const self = this;
        this.socket = new net.Socket();
        // this.socket.on('close',  (had_error) => { self.onDisconnected(had_error)} );
        this.socket.on('connect',() => { self.onConnected() });
        this.socket.on('data',   (buffer) => { self.onDataReceived(buffer) } );
        this.socket.on('end',    () => {self.onDisconnected()});
        this.socket.on('error',  (error) => { self.onError(error) });
        this.socket.on('timeout', () => {self.onTimeout()});

        this.socket.connect(
            this.port ? this.port : port ,
            this.servername ? this.servername : this.servername);
    }

    /**
     * 
     * @param {string} payload 
     */
    sendRaw(payload) {
        if (this.connected) {
            if( payload.indexOf("PASS") == -1) console.log('»',payload);
            this.socket.write(payload + "\n" );            
        }
    }

    /**
     * 
     * @param {string} cap 
     */
    reqCAP(cap) {
        this.sendRaw('CAP REQ :' + cap);
    }

    /**
     * 
     * @param {string} channelName 
     */
    joinChannel(channelName) {
        if (channelName.length>3) {
            this.sendRaw('JOIN ' + channelName);
            this.channels.push(channelName);

        }
    }

    /**
     * 
     * @param {string} channelName 
     * @param {string} partMsg 
     */
    partChannel(channelName, partMsg = '') {
        if (channelName.length>3) {
            this.sendRaw('PART :' + channelName + ' ' + partMsg);
            const index = this.channels.indexOf(channelName);
            if (index!==-1)this.channels.splice(index,1);

        }
    }

    /**
     * 
     * @param {string} quitMsg 
     */
    quit(quitMsg = '') {
        this.sendRaw('QUIT :' + quitMsg);
    }

    /**
     * 
     * @param {string} destination 
     */
    ping(destination) {
        this.sendRaw('PING :' + destination +  ' ' + Date.now );
    }

    /**
     * 
     * @param {string} ping 
     */
    pong(ping) {
        this.sendRaw('PONG :' + ping);
    }

    // ----------- EVENTS ----------------
    /**
     * @memberof Socket
     * upon succesful connection. 
     */
    onConnected() {
        this.connected = true;
        this.emit('connected',{ socket: this.socket}); 
        if (this.user.password) {
            // @see https://tools.ietf.org/html/rfc1459#section-4.1.1
            this.sendRaw('PASS ' + this.user.password);
        }

        // @see https://tools.ietf.org/html/rfc1459#section-4.1.3
        // <username> <hostname> <servername> <realname>
        this.sendRaw(format('USER %s %s %s %s', 
        this.user.username,
        this.user.hostname,
        this.servername,
        this.user.realname));

        // @see https://tools.ietf.org/html/rfc1459#section-4.1.2
        this.sendRaw(format('NICK %s', this.user.username.toLowerCase()));
    }

    /**
     * @memberof Socket
     * @param {string} buffer 
     */
    onDataReceived(buffer) {
        const bufferString = String(buffer);
        if (bufferString.startsWith('PING')) {
            this.pong(bufferString.substr(bufferString.indexOf(':'),bufferString.length+1));
            return;
        }

        if (bufferString.indexOf("\n") > -1) {
            const lines = bufferString.split(/\n/g);
            if(!lines || lines.length<=0) return;
            
            lines.map((line,index) => {

                const replyCodePtrn = /:([^ ]*)\s+(\d{3})?\s?([^ ]+)\s+(.*)/;
                const reply_matches = line.trim().match(replyCodePtrn)
                const replyCode = (reply_matches) ? reply_matches[2] : -1;
                if (line)
                switch ( parseInt( replyCode )) {
                    case irc.END_OF_MOTD:
                    case 376:
                        this.emit('end_motd');
                    break;
                    case irc.END_OF_NAMES:
                    case 366:
                        this.emit('end_names');
                    break;
                }
                if (line.length > 0 ){
                    this.emit('data', {socket: this.socket, raw: line});
                    console.log('« ' ,line);
                    this.__parsePacket(line);
                }
            });        
        } else {
            this.__parsePacket(bufferString);            
        }
    }

    __parsePacket(bufferString) {
        const payloadPtrn = /:([^ +]+)!([^ ]+)\s([^ ]+)\s([^ ]+)\s?:?(.*)/;
        const payload_matches = bufferString.trim().match(payloadPtrn);
        const sender = (payload_matches) ? {username: payload_matches[1] , hostname: payload_matches[2] }:{};            
        const command = (payload_matches) ? payload_matches[3] : null;            
        const recipient = (payload_matches) ? payload_matches[4] : null;            
        const message = (payload_matches) ? payload_matches[5] : null;            
        
        switch(command) {
            case 'PRIVMSG':
                this.emit('message',  recipient, sender, message, bufferString, this.socket)
            break;
            default:
                this.emit('data', {socket: this.socket, raw: bufferString});
        }
    }

    /**
     * @memberof Socket
     * @param {boolean} had_error 
     */
    onDisconnected(had_error) {
        this.connected = false;
        this.emit('disconnected' , {socket: this.socket, had_error : had_error});
    }

    /**
     * @memberof Socket
     * @param {string} error 
     */
    onError(error) {
        this.emit('error', {socket: this.socket, error : error});
    }


    onTimeout() {
        this.connected =false;
    }
}

module.exports = IrcLite;
