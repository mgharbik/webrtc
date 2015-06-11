import Ember from 'ember';

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
		// PeerJS server location
	    var SERVER_IP = '192.168.1.160';
	    var SERVER_PORT = 9000;

	    // DOM elements manipulated as user interacts with the app
	    var messageBox = document.querySelector('#messages');
		var messages = $('#messages');
	    var dialBtn = document.querySelector('#dial');
		var sendBtn = document.querySelector('#send-button');
		var messageInput = document.querySelector('#message-input');
		var fileInput = document.querySelector('#file-input');
			
	    var miniVideo = document.querySelector('#mini-video');
	    var remoteVideo = document.querySelector('#remote-video');
	    var localVideo = document.querySelector('#local-video');
	    var videos = document.querySelector('#videos');
		videos.classList.add('active');
		
	    var icons = document.querySelector('#icons');
		icons.classList.add('active');
		icons.classList.remove('hidden');


	    // the ID set for this client
	    var callerId = '055675177431a720ef243f6ed48f104e';
		var recipientId = '7';

	    // PeerJS object, instantiated when this client connects with its caller ID
	    var peer = null;

	    // the local video stream captured with getUserMedia()
	    var localStream = null;
		
	    // DOM utilities
	    var makePara = function (text) {
	      var p = document.createElement('p');
	      p.innerText = text;
	      return p;
	    };

	    var addMessage = function (para) {
	      if (messageBox.firstChild) {
	        messageBox.insertBefore(para, messageBox.firstChild);
	      }
	      else {
	        messageBox.appendChild(para);
	      }
	    };

	    var logError = function (text) {
	      var p = makePara('ERROR: ' + text);
	      p.style.color = 'red';
	      addMessage(p);
	    };

	    var logMessage = function (text) {
	      addMessage(makePara(text));
	    };

	    // get the local video and audio stream and show preview in the "LOCAL" video element
	    // successCb: has the signature successCb(stream); receives the local video stream as an argument
	    var getLocalStream = function (successCb) {
	      if (localStream && successCb) {
	        successCb(localStream);
	      }
	      else {
	        navigator.webkitGetUserMedia(
	          {
	            audio: true,
	            video: true
	          },

	          function (stream) {
	            localStream = stream;

	            localVideo.src = window.URL.createObjectURL(stream);

	            if (successCb) {
	              successCb(stream);
	            }
	          },

	          function (err) {
	            logError('failed to access local camera');
	            logError(err.message);
	          }
	        );
	      }
	    };

	    // set the "REMOTE" video element source
	    var showRemoteStream = function (stream) {
	      remoteVideo.src = window.URL.createObjectURL(stream);
	    };

	    // set caller ID and connect to the PeerJS server
	    var connect = function () {
		  console.log('Connecting to server as Remote...');

	      if (!callerId) {
	        logError('please set caller ID first');
	        return;
	      }

	      try {
	        // create connection to the ID server
	        peer = new Peer(callerId, {host: SERVER_IP, port: SERVER_PORT});

	        // hack to get around the fact that if a server connection cannot
	        // be established, the peer and its socket property both still have
	        // open === true; instead, listen to the wrapped WebSocket
	        // and show an error if its readyState becomes CLOSED
	        peer.socket._socket.onclose = function () {
	          logError('no connection to server');
	          peer = null;
	        };

	        // get local stream ready for incoming calls once the wrapped
	        // WebSocket is open
	        peer.socket._socket.onopen = function () {
	          getLocalStream();
	        };

	        // handle events representing incoming calls
	        peer.on('call', answer);

	        // handle events representing incoming messages or files			
			peer.on('connection', connectChat);
			
			peer.on('open', function(id){
			  logMessage('You\'re connected to chat.');	
			});
	      }
	      catch (e) {
	        peer = null;
	        logError('error while connecting to server');
	      }
	    };

	    // make an outgoing call
	    var dial = function () {
			console.log('Calling...');
			
	      if (!peer) {
	        logError('please connect first');
	        return;
	      }

	      if (!localStream) {
	        logError('could not start call as there is no local camera');
	        return;
	      }

	      if (!recipientId) {
	        logError('could not start call as no recipient ID is set');
	        return;
	      }

	      getLocalStream(function (stream) {
	        // logMessage('outgoing call initiated');

	        var call = peer.call(recipientId, stream);

	        call.on('stream', showRemoteStream);
			
			miniVideo.src = localVideo.src;

			remoteVideo.classList.add('active');
			miniVideo.classList.add('active');
			localVideo.src = '';
					
	        call.on('error', function (e) {
	          logError('error with call');
	          logError(e.message);
	        });
	      });
		  
		  dialBtn.disabled = true;
	    };

	    // answer an incoming call
	    var answer = function (call) {
	      if (!peer) {
	        logError('cannot answer a call without a connection');
	        return;
	      }

	      if (!localStream) {
	        logError('could not answer call as there is no localStream ready');
	        return;
	      }

	      messages.append('<div><span class="peer">Customer has joined the chat.</span></div>');

	      call.on('stream', showRemoteStream);

	      call.answer(localStream);
	    };
		
		var connectChat = function(c) {
		  if (c.label === 'chat') {
		    c.on('data', function(data){
			  messages.append('<div><span class="peer">Customer</span>: ' + data + '</div>');  
			});
		    c.on('close', function(){
		      messages.append('<div><span class="peer">Customer has left the chat.</span></div>');
			  delete peer.connections[recipientId];
		    });
		  }	else if (c.label === 'file') {
		    c.on('data', function(data){
			  if (data.constructor === ArrayBuffer) {
			    var dataView = new Uint8Array(data);
				var dataBlob = new Blob([dataView]);
				var url = window.URL.createObjectURL(dataBlob);
				messages.append('<div><span class="file">Customer has sent you a <a download="' + url + '" href="' + url + '">file</a></span></div>');
			  }
			});
		  }
		};
		
		var send = function(){
  		  var msg = messageInput.value;
		  var file_name = fileInput.value;
		  var files = document.getElementById("file-input").files;
		  
		  if (msg.length != 0) {
			var c = peer.connect(recipientId, { label: 'chat', serialization: 'none', metadata: {message: 'Chat started...'} });
			c.on('open', function(){ c.send(msg); });
		   	$('#messages').append('<div><span class="you">You: </span>' + msg + '</div>');
			messageInput.value = '';
			console.log('message was sent: ', msg);
		  }
		  
		  if (files.length > 0) {
			var f = peer.connect(recipientId, { label: 'file', reliable: true });
			f.on('open', function(){ f.send(files[0]); });
			$('#messages').append('<div><span class="you">You sent file to customer</span></div>');
			console.log('file was sent: ', file_name);
		  }
		};

	    // wire up button events
	    dialBtn.addEventListener('click', dial);
		sendBtn.addEventListener('click', send);
		connect();
		
		window.onunload = window.onbeforeunload = function(e) {
		  if (!!peer && !peer.destroyed) {
		    peer.destroy();
		  }
		};
	},

	successCallback: function(localMediaStream){
		var video = document.querySelector('video');
		video.src = window.URL.createObjectURL(localMediaStream);
	},

	errorCallback: function(error){
		console.log('navigator.getUserMedia error: ', error);
	}

});