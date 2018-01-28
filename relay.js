/* --------------------------------------------------------------------

                        _____      _             
                       |  __ \    | |            
                       | |__) |___| | __ _ _   _ 
                       |  _  // _ \ |/ _` | | | |
                       | | \ \  __/ | (_| | |_| |
                       |_|  \_\___|_|\__,_|\__, |
                                            __/ |
                                           |___/ 


 * Author:      Oscar "Hiro Inu" Fonseca
 * Program:     Relay 

 * Discord bot that offers semi-anonymous chatting. 


 * If you like this service, consider donating
 * ETH to my address: 0xE2784BE97A7B993553F20c120c011274974EC505 



 * ------------------------------------------------------------------- */


// -------------------------------------------
// -------------------------------------------
//
//           SETUP AND DECLARATIONS
//
// -------------------------------------------
// -------------------------------------------

// File read for JSON and PostgreSQL
var fs                  = require('fs');
var schedule            = require('node-schedule');
const snekfetch         = require('snekfetch');
var request             = require("request");
var crypto              = require('crypto');

var keys                = JSON.parse(fs.readFileSync('keys.api','utf8'));
const Discord 		= require('discord.js');

//Toku Mei server text channel
const channelID         = "406876380819750913";
const msgLimit          = 20;

// ----------------------------------------------------------------------------------------------------------------

// Web3
const web3              = require('web3');
const Web3              = new web3(new web3.providers.HttpProvider('https://kovan.infura.io/' + keys['infura'] /*'http://localhost:8545'*/));

const abi               = [{"constant":true,"inputs":[],"name":"getRating","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"negative","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_vote","type":"bool"}],"name":"feedback","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"productName","outputs":[{"name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_newPrice","type":"uint256"}],"name":"setPrice","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"name":"_id","type":"string"}],"name":"checkPayment","outputs":[{"name":"","type":"bool"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"price","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"_id","type":"string"}],"name":"payment","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"positive","outputs":[{"name":"","type":"int256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"inputs":[{"name":"_price","type":"uint256"},{"name":"_productName","type":"string"},{"name":"_owner","type":"address"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"}];

var ProductRegister     = new Web3.eth.Contract(abi, "0x27659AB24B40461Bdc9DC3817683CC0508f74c42");

// ----------------------------------------------------------------------------------------------------------------


// Declare channels and message counter
var channelName         = 'general';
var messageCount        = 0;
var referenceTime       = Date.now();

// User Data
var users               = {};

// Message Queue
var messageQueue        = [];

var watchRole;

// -------------------------------------------
// -------------------------------------------
//
//              DISCORD FUNCTIONS
//
// -------------------------------------------
// -------------------------------------------

// Create a client and a token
const client = new Discord.Client();
const token = keys['discord'];


// Wait for the client to be ready.
client.on('ready', () => {

  if(process.argv[2] === "-d"){
    console.log('dev mode');
  }

  watchRole = client.guilds.get('406876380299788288').roles.get('406876519982432256');
  client.channels.get(channelID).bulkDelete(msgLimit*2)
});


client.on('guildMemberAdd', member => {
  member.createDM()
    .then(chn => {
      chn.send('Welcome to Relay.');
    })
    .catch(console.log);

  member.addRole(watchRole);
});

// Event goes off every time a message is read.
client.on('message', message => {

  // Developer mode
  if(process.argv[2] === "-d" && message.author.id !== "217327366102319106")
    return;

  // Ignore bot messages
  if(message.author.id === '406880377077104640')
    return;

  // Ignore users created 7 days ago or less
  if(message.author.createdTimestamp + 86400000*7 > Date.now())
    return;

  // Keep a counter of messages
  messageCount = (messageCount + 1) % 10000;
  if(messageCount === 0) referenceTime = Date.now();


  /*
    // Update every 100 messages
  if(Math.floor(Math.random() * 100) === 42){
    snekfetch.post(`https://discordbots.org/api/bots/${client.user.id}/stats`)
      .set('Authorization', keys['dbots'])
      .send({ server_count: client.guilds.size })
      .then(console.log('updated dbots.org status.'))
      .catch(e => console.warn('dbots.org down'))
  }
  */


  let uid       = message.author.id;
  let msg       = message.content;
  let author    = crypto.createHash('sha256').update(message.author.id + Math.floor(Date.now() / 1000 / 60 / 60 / 24)).digest('hex');


  if(message.channel.type === 'dm'){
    if(!users[uid]){
      users[uid] = { hash: author, stake: 100, remainingStake: 100, time: Date.now() };
      message.channel.send('Welcome to Relay. You have 100 Okane stakes remaining. Each relayed message uses one Okane and the stake is refreshed every 24 hours.');
    }
    
    if(users[uid].time + 86400000 < Date.now()){
      users[uid].time = Date.now();
      users[uid].remainingStake = users[uid].stake;
    } 
    
    if(users[uid].remainingStake > 0){
      msg = msg.replace(/[^\w\s\.\,\?\!<>]/g,'');

      if(msg.length > 0){
        msg = ('`' + 
          author.slice(-8) +
          ' '.repeat(1) + 
          ':` ') + msg;

        client.channels.get(channelID).send(msg)
          .then(function(m){
            messageQueue.push(m);
            users[uid].remainingStake -= 1;

            if(messageQueue.length > msgLimit){
              messageQueue.shift().delete().catch(console.log);
            }
          })
          .catch(0);

      }
    } else {
      message.channel.send('Out of Okane.');
    }
  }


})

/* -------------------------------------------------------

   This is the main method. It gets the current message
   and a boolean that states if the sender has a
   botAdmin role.

 ------------------------------------------------------- */


function commands(message, botAdmin, config){

  // Get the channel where the bot will answer.
  let channel = message.channel;

  // Get DiscordID via DM
  if(command === 'id'){
    message.author.send("Your ID is `" + message.author.id + "`.");

  } else if( /pa[\+\-\*]?/.test(scommand)){
    // ----------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------
    if(message.author.id !== client.user.id)
      ProductRegister.methods.checkPayment(message.author.id).call()
        .then(function(paid) {
          if(paid){
            getCoinArray(message.author.id, channel, '', scommand[2] || '-');
          } else {
            channel.send("Please pay (free KETH) for this service. Visit https://www.tsukibot.com on the Kovan Network.")
          }
        })
        .catch(console.log);
    // ----------------------------------------------------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------------------

  }
}


// Jack in, Megaman. Execute.
client.login(token);
