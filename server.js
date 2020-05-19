/*
*@autor: Rio 3D Studios
*@description:  java script file that works as master udp server of the UDP Multiplayer Online Game
*for more information visit: https://nodejs.org/api/dgram.html
*@data: 22/05/18
*/
var express  = require('express');//import express NodeJS framework module
var app      = express();// create an object of the express module
var shortId 		= require('shortid');//import shortid lib
var dgram = require('dgram');//The dgram module provides an implementation of UDP Datagram sockets.
var socket = dgram.createSocket('udp4');//the dgram.Socket to listen for datagram messages on a named port
app.use(express.static(__dirname));

var clients	= [];//storage clients
var clientLookup = {};// cliends search engine

socket.on('message', function(message,rinfo) {

 //console.log('server got message: '+message+' from address# '+rinfo.address);
 
 var data = message.toString().split(':');//parse message to json format
	
	switch(data[0] )
	{

	    case "JOIN":
	    console.log('[INFO] JOIN received !!! ');
	  	 // fills out with the information emitted by the player in the unity
		currentUser = {
			       name:data[1],
                   position:data[2],
				   rotation:'',
			       id:shortId.generate(),
				   animation:"",
				   timeOut:0,
				   isDead:false,
				   port:rinfo.port,
			       address:rinfo.address 
				   };//new user  in clients list
					
		console.log('[INFO] data[2] '+data[2]);
		console.log('[INFO] player '+currentUser.name+': logged!');
		console.log('[INFO] currentUser.position '+currentUser.position);
		
	     //add currentUser in clients list
		 clients.push(currentUser);
		 
		 //add client in search engine
		 clientLookup[currentUser.id] = currentUser;
		 
		 console.log('[INFO] Total players: ' + clients.length);
		
		/*********************************************************************************************/		
		 var response = "JOIN_SUCCESS"+':'+currentUser.id+':'+currentUser.name+':'+currentUser.position;
		
		 console.log('send LOGIN_SUCCESS to port :'+  rinfo.port+' and address: '+ rinfo.address);
		 var msg = new Buffer.from(response);
	
		  socket.send(msg,
                 0,
                 msg.length,
                 rinfo.port,
                 rinfo.address);
	
		/*******************************************************************************************************************/		
	    
		/*******************************************************************************************************************/		
		var pack1 = "SPAWN_PLAYER"+':'+currentUser.id+':'+currentUser.name+':'+currentUser.position;
		 
		 var msg_currentUser = new Buffer.from(pack1);
		 
	     
		 // spawn currentUser udp client on clients in broadcast
         clients.forEach( function(i) {
		    if(i.id!=currentUser.id)
			{
		     // console.log('i.address: '+i.name);
	         // console.log('i.address: '+i.address);
		      socket.send(msg_currentUser,
                   0,
                   msg_currentUser.length,
                   i.port,
                   i.address);
		    }
	   
	     });//end_forEach

	  // spawn all clients in currentUser udp client
         clients.forEach( function(i) {
		  
		  if(i.id != currentUser.id)
		  {

		    var pack2 = "SPAWN_PLAYER"+':'+i.id+':'+i.name+':'+i.position;
		    var msg_client = new Buffer.from(pack2);

		    console.log('i.name: '+i.name);
		    console.log('i.port: '+i.port);
	        console.log('i.address: '+i.address);
		 
		      socket.send(msg_client,
                0,
                msg_client.length,
                currentUser.port,
                currentUser.address);
	        }//END_IF
	     });//end_forEach
		 
	  break;
	  case "POS_AND_ROT":
	   
	 	
		if(clientLookup[data[1]])
	   {
	     clientLookup[data[1]].timeOut = 0;
	     clientLookup[data[1]].position = data[2];
	  
	     clientLookup[data[1]].rotation = data[3];
		 
		 var pack = "UPDATE_POS_AND_ROT"+':'+clientLookup[data[1]].id+':'+clientLookup[data[1]].position+':'+clientLookup[data[1]].rotation;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
		 // send current user position in broadcast to all clients in game
         clients.forEach( function(i) {
		      
			if(i.id != clientLookup[data[1]].id)
		    {
		         socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
			}
	   });//END_forEach
	}
		 
	  break;
	  
	  case "ANIMATION":
	   
	     //console.log('user: '+clientLookup[data[1]].name+' new : '+ data[2]+' animation');
	     clientLookup[data[1]].animation = data[2];
	  
		 var pack = "UPDATE_PLAYER_ANIMATOR"+':'+clientLookup[data[1]].id+':'+clientLookup[data[1]].animation;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
		 // send current user animation in broadcast to all clients in game
         clients.forEach( function(i) {
		  
		    if(i.id != clientLookup[data[1]].id)
		    {
		      socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
		    }
	   });//END_forEach
	   
	   
	  break;
	  
	  case "disconnect":
	    if(clientLookup[data[1]].name)
		{
	     console.log('user: '+clientLookup[data[1]].name+' tring desconnect');
	   
		 var pack = "USER_DISCONNECTED"+':'+clientLookup[data[1]].id;
		 
		 var msg_currentUser = new Buffer.from(pack);
		
         clients.forEach( function(i) {
		       
			if(i.id != clientLookup[data[1]].id)
		    {
		      socket.send(msg_currentUser,
                0,
                msg_currentUser.length,
                i.port,
                i.address);
		    }
	   });//END_forEach
	   
	   for (var i = 0; i < clients.length; i++)
		  {
			if (clients[i].name == clientLookup[data[1]].name 
			          && clients[i].id == clientLookup[data[1]].id) 
			{

				console.log("User "+clients[i].name+" has disconnected");
				
				//remove the current client from the list
				clients.splice(i,1);

			};//END_IF
		  };//END_FOR
		  }
       break; 
	   
	}//END-SWITCH	
	
});//END_SOCKET.ON

//setup udp server port
var port = 3000;
var HOST = '127.0.0.1';
/* server listening 127.0.0.1:process.env.PORT or 127.0.0.1:port
 * socket.bind(PORT, HOST);
*/
socket.bind(process.env.PORT||port,HOST);

socket.on('listening',function(){

var address = socket.address();

console.log('UDP Server listening on '+ address.address+':'+address.port);

});//END_SOCKET.ON


console.log("------- server is running -------");