import Ember from 'ember';
//import nodeStatic from 'node-static';
//import http from 'http';
//import socket from 'socket.io';

export default Ember.Controller.extend({
	constraintsList: ['HD', 'VGA'],
	selectedConstraints: 'HD',
	constraints: null,

	getConstraints: function(){
		if (this.get('selectedConstraints') == 'HD') {
			return {
				video: {
		    		mandatory: {
						minWidth: 1280,
		      		  	minHeight: 720
		    		}
		  	  	},
				audio: true
			};
		} else if (this.get('selectedConstraints') == 'VGA')  {
			return {
				video: {
					mandatory: {
		      	  		maxWidth: 640,
		      	  		maxHeight: 360
		    		}
		  	  	},
				audio: true
			};
		}
	},

	//didConstraintsChanged: function(){
	//	this.setUserMedia();
	//}.observes('selectedConstraints'),
	
	setUserMedia: function(){
		
		var constraints = {
			video: { mandatory: { maxWidth: 640, maxHeight: 360 } },
			audio: true
		};
		
		this.runServer();

		var isInitiator;

		var room = prompt("Enter room name:");

		var socket = io.connect();

		if (room !== "") {
		  console.log('Joining room ' + room);
		  socket.emit('create or join', room);
		}

		socket.on('full', function (room){
		  console.log('Room ' + room + ' is full');
		});

		socket.on('empty', function (room){
		  isInitiator = true;
		  console.log('Room ' + room + ' is empty');
		});

		socket.on('join', function (room){
		  console.log('Making request to join room ' + room);
		  console.log('You are the initiator!');
		});

		socket.on('log', function (array){
		  console.log.apply(console, array);
		});
	},
	
	runServer: function() {
		let socket = this.get('websocket.socket');

		  // convenience function to log server messages on the client
			function log(){
				var array = [">>> Message from server: "];
			  for (var i = 0; i < arguments.length; i++) {
			  	array.push(arguments[i]);
			  }
			    socket.emit('log', array);
			}

			socket.on('message', function (message) {
				log('Got message:', message);
		    // for a real app, would be room only (not broadcast)
				socket.broadcast.emit('message', message);
			});

			socket.on('create or join', function (room) {
				var numClients = io.sockets.clients(room).length;

				log('Room ' + room + ' has ' + numClients + ' client(s)');
				log('Request to create or join room ' + room);

				if (numClients === 0){
					socket.join(room);
					socket.emit('created', room);
				} else if (numClients === 1) {
					io.sockets.in(room).emit('join', room);
					socket.join(room);
					socket.emit('joined', room);
				} else { // max two clients
					socket.emit('full', room);
				}
				socket.emit('emit(): client ' + socket.id + ' joined room ' + room);
				socket.broadcast.emit('broadcast(): client ' + socket.id + ' joined room ' + room);

			});


	},

	successCallback: function(localMediaStream){
		var video = document.querySelector('video');
		video.src = window.URL.createObjectURL(localMediaStream);
	},

	errorCallback: function(error){
		console.log('navigator.getUserMedia error: ', error);
	}

});