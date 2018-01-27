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
var pg                  = require('pg');
var pgp                 = require('pg-promise');

// Scheduler
var schedule            = require('node-schedule');

// DiscordBots API
const snekfetch         = require('snekfetch');

// HTTP request
var request             = require("request");

// Get the api keys
var keys                = JSON.parse(fs.readFileSync('keys.api','utf8'));


// Include API things
const Discord 		= require('discord.js');
const Client 		= require('coinbase').Client;

var didyoumean = require("didyoumean");


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

  client.user.setGame('.tbhelp');

  client.fetchUser("217327366102319106")
    .then(u => {
      u.send("Relay loaded.")
        .catch(console.log)
    })
    .catch(console.log);

});


// Event goes off every time a message is read.
client.on('message', message => {

  // Developer mode
  if(process.argv[2] === "-d" && message.author.id !== "217327366102319106")
    return;


  // Keep a counter of messages
  messageCount = (messageCount + 1) % 10000;
  if(messageCount === 0) referenceTime = Date.now();



  // Update every 100 messages
  if(Math.floor(Math.random() * 100) === 42){
    snekfetch.post(`https://discordbots.org/api/bots/${client.user.id}/stats`)
      .set('Authorization', keys['dbots'])
      .send({ server_count: client.guilds.size })
      .then(console.log('updated dbots.org status.'))
      .catch(e => console.warn('dbots.org down'))
  }



  // Check for perms (temporary)
  message.guild.fetchMember(message.author)
    .then(function(gm) {
      commands(message, gm.roles.some(r => { return r.name === 'TsukiBoter' }), config);
    })
    .catch(0);

})

/* -------------------------------------------------------

   This is the main method. It gets the current message
   and a boolean that states if the sender has a
   botAdmin role.

 ------------------------------------------------------- */


function commands(message, botAdmin, config){

  // Get the channel where the bot will answer.
  let channel = message.channel;

  // Split the message by spaces.

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
