/**
 * @author  Hyperandroid  ||  http://hyperandroid.com/
 *
 * Sound implementation.
 */

(function() {

    /**
     * This class is a sound manager implementation which can play at least 'numChannels' sounds at the same time.
     * By default, CAAT.Director instances will set eight channels to play sound.
     * <p>
     * If more than 'numChannels' sounds want to be played at the same time the requests will be dropped,
     * so no more than 'numChannels' sounds can be concurrently played.
     * <p>
     * Available sounds to be played must be supplied to every CAAT.Director instance by calling <code>addSound</code>
     * method. The default implementation will accept a URL/URI or a HTMLAudioElement as source.
     * <p>
     * The cached elements can be played, or looped. The <code>loop</code> method will return a handler to
     * give the opportunity of cancelling the sound.
     * <p>
     * Be aware of Audio.canPlay, is able to return 'yes', 'no', 'maybe', ..., so anything different from
     * '' and 'no' will do.
     *
     * @constructor
     *
     */
    CAAT.AudioManager= function() {
        return this;
    };

    CAAT.AudioManager.prototype= {

        audioCache:         null,   // audio elements.
        channels:           null,   // available playing channels.
        workingChannels:    null,   // currently playing channels.
        audioTypes: {               // supported audio formats. Don't remember where i took them from :S
	        'mp3': 'audio/mpeg;',
            'ogg': 'audio/ogg; codecs="vorbis"',
            'wav': 'audio/wav; codecs="1"',
            'mp4': 'audio/mp4; codecs="mp4a.40.2"'
		},

        /**
         * Initializes the sound subsystem by creating a fixed number of Audio channels.
         * Every channel registers a handler for sound playing finalization. If a callback is set, the
         * callback function will be called with the associated sound id in the cache.
         *
         * @param numChannels {number} number of channels to pre-create. 8 by default.
         *
         * @return this.
         */
        initialize : function(numChannels) {

            this.audioCache=      [];
            this.channels=        [];
            this.workingChannels= [];

            for( var i=0; i<numChannels; i++ ) {
                var channel= document.createElement('audio');

                if ( null!=channel ) {
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

                                if ( target.caat_callback ) {
                                    target.caat_callback(target.caat_id);
                                }

                                // set back to channels.
                                me.channels.push(target);
                            },
                            false
                    );
                }
            }

            return this;
        },
        /**
         * creates an Audio object and adds it to the audio cache in case the url points to a
         * suitable audio file to be played.
         *
         * @param id {object} an object to reference the audio object. Tipically a string.
         * @param url {string|HTMLElement} an url pointing to an audio resource or an HTMLAudioElement
         * object.
         * @param endplaying_callback {function} a callback function to notify on audio finalization. The
         * function is of the form <code>function(id{string})</code>. The id parameter is the associated id
         * in the cache.
         *
         * @return this
         */
        addAudio : function( id, url, endplaying_callback ) {
            var audio= null;
            var extension= null;

            if ( typeof url == "string" ) {

                audio= document.createElement('audio');
                if ( null!=audio ) {

                    if(!audio.canPlayType) {
                        return this;
                    }

                    extension= url.substr(url.lastIndexOf('.')+1);
                    var canplay= audio.canPlayType(this.audioTypes[extension]);

                    if(canplay!=="" && canplay!=="no") {
                        audio.src= url;
                        audio.preload = "auto";
                        audio.load();
                        if ( endplaying_callback ) {
                            audio.caat_callback= endplaying_callback;
                            audio.caat_id= id;
                        }
                        this.audioCache.push( { id:id, audio:audio } );
                    }
                }
            } else {
                try {
                    if ( url instanceof HTMLAudioElement ) {
                        audio= url;
                        extension= audio.src.substr(audio.src.lastIndexOf('.')+1);
                        if ( audio.canPlayType(this.audioTypes[extension]) ) {
                            if ( endplaying_callback ) {
                                audio.caat_callback= endplaying_callback;
                                audio.caat_id= id;
                            }
                            this.audioCache.push( { id:id, audio:audio } );
                        }
                    }
                }
                catch(e) {
                    
                }
            }


            return this;
        },
        /**
         * Returns an audio object.
         * @param aId {object} the id associated to the target Audio object.
         * @return {object} the HTMLAudioElement addociated to the given id.
         */
        getAudio : function(aId) {
            for( var i=0; i<this.audioCache.length; i++ ) {
                if ( this.audioCache[i].id==aId ) {
                    return this.audioCache[i].audio;
                }
            }

            return null;
        },
        /**
         * Plays an audio file from the cache if any sound channel is available.
         * The playing sound will occupy a sound channel and when ends playing will leave
         * the channel free for any other sound to be played in.
         * @param id {object} an object identifying a sound in the sound cache.
         * @return this.
         */
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
         * @return {HTMLElement|null} an Audio instance if a valid sound id is supplied. Null otherwise
         */
        loop : function( id ) {
            var audio_in_cache= this.getAudio(id);
            // existe el audio, y ademas hay un canal de audio disponible.
            if ( null!=audio_in_cache ) {
                var audio= document.createElement('audio');
                if ( null!=audio ) {
                    audio.src= audio_in_cache.src;
                    audio.preload = "auto";
                    audio.loop= true;
                    audio.load();
                    audio.play();
                    return audio;
                }
            }

            return null;
        },
        /**
         * Cancel all playing audio channels
         * Get back the playing channels to available channel list.
         *
         * @return this
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