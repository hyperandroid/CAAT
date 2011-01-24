/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Sound implementation.
 * This class is a sound manager which can play at least 'numChannels' sounds at the same time.
 * CAAT.Director instances will set eight channels to play sound.
 *
 * If more than 'numChannels' sounds want to be played at the same time the requests will be dropped,
 * so no more than 'numChannels' sounds can be concurrently played.
 *
 * Available sounds to be played must be supplied to every CAAT.Director instance by calling <code>addSound</code>
 * method.
 *
 */

(function() {

    CAAT.AudioManager= function() {
        return this;
    };

    CAAT.AudioManager.prototype= {

        audioCache:         null,
        channels:           null,
        workingChannels:    null,
        audioTypes: {
	        'mp3': 'audio/mpeg;',
            'ogg': 'audio/ogg; codecs="vorbis"',
            'wav': 'audio/wav; codecs="1"',
            'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},

        initialize : function(numChannels) {

            this.audioCache=      [];
            this.channels=        [];
            this.workingChannels= [];

            for( var i=0; i<numChannels; i++ ) {
                var channel= new Audio();
                channel.finished= -1;
                this.channels.push( channel );
                var me= this;
                channel.addEventListener(
                        'ended',
                        // on sound end, set channel to available channels list.
                        function(audioEvent) {
                            var target= audioEvent.target;
                            var i;

                            // remove from workingChannels
                            for( i=0; i<me.workingChannels.length; i++ ) {
                                if (me.workingChannels[i]==target ) {
                                    me.workingChannels.splice(i,1);
                                    break;
                                }
                            }

                            // set back to channels.
                            me.channels.push(target);
                        },
                        false);
            }

            return this;
        },
        /**
         * creates an Audio object and adds it to the audio cache in case the url points to a
         * suitable audio file to be played.
         *
         * @param id an object to reference the audio object
         * @param url an url pointing to an audio resource.
         */
        addAudio : function( id, url ) {
            var audio= new Audio();
            if(!audio.canPlayType) {
                return;
            }

            var extension= url.substr(url.lastIndexOf('.')+1);
            var canplay= audio.canPlayType(this.audioTypes[extension]);

            if(canplay!=="" && canplay!=="no") {
                audio.src= url;
                audio.preload = "auto";
                audio.load();
                this.audioCache.push( { id:id, audio:audio } );
            }

            return this;
        },
        /**
         * Adds a preloaded audio element from DOM. audioElement Referencies an <audio> tag in the html
         * file.
         *
         * @param id an object to reference the audio object
         * @param audioElement a DOM <audio> element.        
         */
        addAudioFromDOM : function( id, audioElement ) {
            this.audioCache.push( {id:id, audio:audioElement} );
        },
        /**
         * Returns an audio object.
         * @param aId the id associated to the target Audio object.
         */
        getAudio : function(aId) {
            for( var i=0; i<this.audioCache.length; i++ ) {
                if ( this.audioCache[i].id==aId ) {
                    return this.audioCache[i].audio;
                }
            }

            return null;
        },
        play : function( id ) {
            var audio= this.getAudio(id);
            // existe el audio, y ademas hay un canal de audio disponible.
            if ( null!=audio && this.channels.length>0 ) {
                var channel= this.channels.shift();
                channel.src= audio.src;
                channel.load();
                channel.play();
                this.workingChannels.push(channel);
            }

            return this;
        },
        /**
         * This method creates a new AudioChannel to loop the sound with.
         * It returns an Audio object so that the developer can cancel the sound loop at will.
         * The user must call <code>pause()</code> method to stop playing a loop.
         *
         * @return an Audio instance if a valid sound id is supplied. Null otherwise
         */
        loop : function( id ) {
            var audio_in_cache= this.getAudio(id);
            // existe el audio, y ademas hay un canal de audio disponible.
            if ( null!=audio_in_cache ) {
                var audio= new Audio();
                audio.src= audio_in_cache.src;
                audio.preload = "auto";
                audio.loop= true;
                audio.load();
                audio.play();
                return audio;
            }

            return null;
        },
        /**
         * Cancel all playing audio channels
         * Get back the playing channels to available channel list.
         */
        endSound : function() {
            for( var i=0; i<this.workingChannels.length; i++ ) {
                this.workingChannels[i].pause();
                this.channels.push( this.workingChannels[i] );
            }

            return this;
        }
    };
})();