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

	didConstraintsChanged: function(){
		this.setUserMedia();
	}.observes('selectedConstraints'),

	setUserMedia: function(){
		navigator.getUserMedia  = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
		navigator.getUserMedia(this.getConstraints(), this.successCallback, this.errorCallback);
	},

	successCallback: function(localMediaStream){
		var video = document.querySelector('video');
		video.src = window.URL.createObjectURL(localMediaStream);
	},

	errorCallback: function(error){
		console.log('navigator.getUserMedia error: ', error);
	}

});