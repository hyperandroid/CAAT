/**
 * See LICENSE file.
 *
 * Sound implementation.
 */

CAAT.Module({

    /**
     * @name Module
     * @memberOf CAAT
     * @namespace
     */

    /**
     * @name Audio
     * @memberOf CAAT.Module
     * @namespace
     */

    /**
     * @name AudioManager
     * @memberOf CAAT.Module.Audio
     * @constructor
     */

    defines:"CAAT.Module.Audio.AudioManager",
    extendsWith:function () {
        return {

            /**
             * @lends CAAT.Module.Audio.AudioManager.prototype
             */

            __init:function () {
                this.isFirefox= navigator.userAgent.match(/Firefox/g)!==null;
                return this;
            },

            isFirefox : false,

            /**
             * The only background music audio channel.
             */
            musicChannel: null,

            /**
             * Is music enabled ?
             */
            musicEnabled:true,

            /**
             * Are FX sounds enabled ?
             */
            fxEnabled:true,

            /**
             * A collection of Audio objects.
             */
            audioCache:null,

            /**
             * A cache of empty Audio objects.
             */
            channels:null,

            /**
             * Currently used Audio objects.
             */
            workingChannels:null,

            /**
             * Currently looping Audio objects.
             */
            loopingChannels:[],

            /**
             * available formats for audio elements.
             * the system will load audio files with the extensions in this preferred order.
             */
            audioFormatExtensions : [
                'ogg',
                'wav',
                'x-wav',
                'mp3'
            ],

            currentAudioFormatExtension : 'ogg',

            /**
             * Audio formats.
             * @dict
             */
            audioTypes:{               // supported audio formats. Don't remember where i took them from :S
                'ogg':  'audio/ogg',
                'mp3':  'audio/mpeg;',
                'wav':  'audio/wav',
                'x-wav':'audio/x-wav',
                'mp4':  'audio/mp4"'
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
            initialize:function (numChannels ) {

                this.setAudioFormatExtensions( this.audioFormatExtensions );

                this.audioCache = [];
                this.channels = [];
                this.workingChannels = [];

                for (var i = 0; i <= numChannels; i++) {
                    var channel = document.createElement('audio');

                    if (null !== channel) {
                        channel.finished = -1;
                        this.channels.push(channel);
                        var me = this;
                        channel.addEventListener(
                            'ended',
                            // on sound end, set channel to available channels list.
                            function (audioEvent) {
                                var target = audioEvent.target;
                                var i;

                                // remove from workingChannels
                                for (i = 0; i < me.workingChannels.length; i++) {
                                    if (me.workingChannels[i] === target) {
                                        me.workingChannels.splice(i, 1);
                                        break;
                                    }
                                }

                                if (target.caat_callback) {
                                    target.caat_callback(target.caat_id);
                                }

                                // set back to channels.
                                me.channels.push(target);
                            },
                            false
                        );
                    }
                }

                this.musicChannel= this.channels.pop();

                return this;
            },

            setAudioFormatExtensions : function( formats ) {
                this.audioFormatExtensions= formats;
                this.__setCurrentAudioFormatExtension();
                return this;
            },

            __setCurrentAudioFormatExtension : function( ) {

                var audio= new Audio();

                for( var i= 0, l=this.audioFormatExtensions.length; i<l; i+=1 ) {
                    var res= audio.canPlayType( this.audioTypes[this.audioFormatExtensions[i]]).toLowerCase();
                    if ( res!=="no" && res!=="" ) {
                        this.currentAudioFormatExtension= this.audioFormatExtensions[i];
                        console.log("Audio type set to: "+this.currentAudioFormatExtension);
                        return;
                    }
                }

                this.currentAudioFormatExtension= null;
            },

            __getAudioUrl : function( url ) {

                if ( this.currentAudioFormatExtension===null ) {
                    return url;
                }

                var lio= url.lastIndexOf( "." );
                if ( lio<0 ) {
                    console.log("Audio w/o extension: "+url);
                    lio= url.length()-1;
                }

                var uri= url.substring( 0, lio+1 ) + this.currentAudioFormatExtension;
                return uri;
            },

            /**
             * Tries to add an audio tag to the available list of valid audios. The audio is described by a url.
             * @param id {object} an object to associate the audio element (if suitable to be played).
             * @param url {string} a string describing an url.
             * @param endplaying_callback {function} callback to be called upon sound end.
             *
             * @return {boolean} a boolean indicating whether the browser can play this resource.
             *
             * @private
             */
            addAudioFromURL:function (id, url, endplaying_callback) {
                var audio = document.createElement('audio');

                if (null !== audio) {

                    audio.src = this.__getAudioUrl(url);
                    console.log("Loading audio: "+audio.src);
                    audio.preload = "auto";
                    audio.load();
                    if (endplaying_callback) {
                        audio.caat_callback = endplaying_callback;
                        audio.caat_id = id;
                    }
                    this.audioCache.push({ id:id, audio:audio });

                    return true;
                }

                return false;
            },
            /**
             * Tries to add an audio tag to the available list of valid audios. The audio element comes from
             * an HTMLAudioElement.
             * @param id {object} an object to associate the audio element (if suitable to be played).
             * @param audio {HTMLAudioElement} a DOM audio node.
             * @param endplaying_callback {function} callback to be called upon sound end.
             *
             * @return {boolean} a boolean indicating whether the browser can play this resource.
             *
             * @private
             */
            addAudioFromDomNode:function (id, audio, endplaying_callback) {

                var extension = audio.src.substr(audio.src.lastIndexOf('.') + 1);
                if (audio.canPlayType(this.audioTypes[extension])) {
                    if (endplaying_callback) {
                        audio.caat_callback = endplaying_callback;
                        audio.caat_id = id;
                    }
                    this.audioCache.push({ id:id, audio:audio });

                    return true;
                }

                return false;
            },
            /**
             * Adds an elements to the audio cache.
             * @param id {object} an object to associate the audio element (if suitable to be played).
             * @param element {URL|HTMLElement} an url or html audio tag.
             * @param endplaying_callback {function} callback to be called upon sound end.
             *
             * @return {boolean} a boolean indicating whether the browser can play this resource.
             *
             * @private
             */
            addAudioElement:function (id, element, endplaying_callback) {
                if (typeof element === "string") {
                    return this.addAudioFromURL(id, element, endplaying_callback);
                } else {
                    try {
                        if (element instanceof HTMLAudioElement) {
                            return this.addAudioFromDomNode(id, element, endplaying_callback);
                        }
                    }
                    catch (e) {
                    }
                }

                return false;
            },
            /**
             * creates an Audio object and adds it to the audio cache.
             * This function expects audio data described by two elements, an id and an object which will
             * describe an audio element to be associated with the id. The object will be of the form
             * array, dom node or a url string.
             *
             * <p>
             * The audio element can be one of the two forms:
             *
             * <ol>
             *  <li>Either an HTMLAudioElement/Audio object or a string url.
             *  <li>An array of elements of the previous form.
             * </ol>
             *
             * <p>
             * When the audio attribute is an array, this function will iterate throught the array elements
             * until a suitable audio element to be played is found. When this is the case, the other array
             * elements won't be taken into account. The valid form of using this addAudio method will be:
             *
             * <p>
             * 1.<br>
             * addAudio( id, url } ). In this case, if the resource pointed by url is
             * not suitable to be played (i.e. a call to the Audio element's canPlayType method return 'no')
             * no resource will be added under such id, so no sound will be played when invoking the play(id)
             * method.
             * <p>
             * 2.<br>
             * addAudio( id, dom_audio_tag ). In this case, the same logic than previous case is applied, but
             * this time, the parameter url is expected to be an audio tag present in the html file.
             * <p>
             * 3.<br>
             * addAudio( id, [array_of_url_or_domaudiotag] ). In this case, the function tries to locate a valid
             * resource to be played in any of the elements contained in the array. The array element's can
             * be any type of case 1 and 2. As soon as a valid resource is found, it will be associated to the
             * id in the valid audio resources to be played list.
             *
             * @return this
             */
            addAudio:function (id, array_of_url_or_domnodes, endplaying_callback) {

                if (array_of_url_or_domnodes instanceof Array) {
                    /*
                     iterate throught array elements until we can safely add an audio element.
                     */
                    for (var i = 0; i < array_of_url_or_domnodes.length; i++) {
                        if (this.addAudioElement(id, array_of_url_or_domnodes[i], endplaying_callback)) {
                            break;
                        }
                    }
                } else {
                    this.addAudioElement(id, array_of_url_or_domnodes, endplaying_callback);
                }

                return this;
            },
            /**
             * Returns an audio object.
             * @param aId {object} the id associated to the target Audio object.
             * @return {object} the HTMLAudioElement addociated to the given id.
             */
            getAudio:function (aId) {
                for (var i = 0; i < this.audioCache.length; i++) {
                    if (this.audioCache[i].id === aId) {
                        return this.audioCache[i].audio;
                    }
                }

                return null;
            },

            stopMusic : function() {
                this.musicChannel.pause();
            },

            playMusic : function(id) {
                if (!this.musicEnabled) {
                    return null;
                }

                var audio_in_cache = this.getAudio(id);
                // existe el audio, y ademas hay un canal de audio disponible.
                if (null !== audio_in_cache) {
                    var audio =this.musicChannel;
                    if (null !== audio) {
                        audio.src = audio_in_cache.src;
                        audio.preload = "auto";

                        if (this.isFirefox) {
                            audio.addEventListener(
                                'ended',
                                // on sound end, restart music.
                                function (audioEvent) {
                                    var target = audioEvent.target;
                                    target.currentTime = 0;
                                },
                                false
                            );
                        } else {
                            audio.loop = true;
                        }
                        audio.load();
                        audio.play();
                        return audio;
                    }
                }

                return null;
            },

            /**
             * Set an audio object volume.
             * @param id {object} an audio Id
             * @param volume {number} volume to set. The volume value is not checked.
             *
             * @return this
             */
            setVolume:function (id, volume) {
                var audio = this.getAudio(id);
                if (null != audio) {
                    audio.volume = volume;
                }

                return this;
            },

            /**
             * Plays an audio file from the cache if any sound channel is available.
             * The playing sound will occupy a sound channel and when ends playing will leave
             * the channel free for any other sound to be played in.
             * @param id {object} an object identifying a sound in the sound cache.
             * @return { id: {Object}, audio: {(Audio|HTMLAudioElement)} }
             */
            play:function (id) {
                if (!this.fxEnabled) {
                    return null;
                }

                var audio = this.getAudio(id);
                // existe el audio, y ademas hay un canal de audio disponible.
                if (null !== audio && this.channels.length > 0) {
                    var channel = this.channels.shift();
                    channel.src = audio.src;
//                    channel.load();
                    channel.volume = audio.volume;
                    channel.play();
                    this.workingChannels.push(channel);
                } else {
                    console.log("Can't play audio: "+id);
                }

                return audio;
            },

            /**
             * cancel all instances of a sound identified by id. This id is the value set
             * to identify a sound.
             * @param id
             * @return {*}
             */
            cancelPlay : function(id) {

                for( var i=0 ; this.workingChannels.length; i++ ) {
                    var audio= this.workingChannels[i];
                    if ( audio.caat_id===id ) {
                        audio.pause();
                        this.channels.push(audio);
                        this.workingChannels.splice(i,1);
                    }
                }

                return this;
            },

            /**
             * cancel a channel sound
             * @param audioObject
             * @return {*}
             */
            cancelPlayByChannel : function(audioObject) {

                for( var i=0 ; this.workingChannels.length; i++ ) {
                    if ( this.workingChannels[i]===audioObject ) {
                        this.channels.push(audioObject);
                        this.workingChannels.splice(i,1);
                        return this;
                    }
                }

                return this;
            },

            /**
             * This method creates a new AudioChannel to loop the sound with.
             * It returns an Audio object so that the developer can cancel the sound loop at will.
             * The user must call <code>pause()</code> method to stop playing a loop.
             * <p>
             * Firefox does not honor the loop property, so looping is performed by attending end playing
             * event on audio elements.
             *
             * @return {HTMLElement} an Audio instance if a valid sound id is supplied. Null otherwise
             */
            loop:function (id) {

                if (!this.musicEnabled) {
                    return null;
                }

                var audio_in_cache = this.getAudio(id);
                // existe el audio, y ademas hay un canal de audio disponible.
                if (null !== audio_in_cache) {
                    var audio = document.createElement('audio');
                    if (null !== audio) {
                        audio.src = audio_in_cache.src;
                        audio.preload = "auto";

                        if (this.isFirefox) {
                            audio.addEventListener(
                                'ended',
                                // on sound end, set channel to available channels list.
                                function (audioEvent) {
                                    var target = audioEvent.target;
                                    target.currentTime = 0;
                                },
                                false
                            );
                        } else {
                            audio.loop = true;
                        }
                        audio.load();
                        audio.play();
                        this.loopingChannels.push(audio);
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
            endSound:function () {
                var i;
                for (i = 0; i < this.workingChannels.length; i++) {
                    this.workingChannels[i].pause();
                    this.channels.push(this.workingChannels[i]);
                }

                for (i = 0; i < this.loopingChannels.length; i++) {
                    this.loopingChannels[i].pause();
                }

                this.workingChannels= [];
                this.loopingChannels= [];

                this.stopMusic();

                return this;
            },
            setSoundEffectsEnabled:function (enable) {
                this.fxEnabled = enable;
                for (var i = 0; i < this.loopingChannels.length; i++) {
                    if (enable) {
                        this.loopingChannels[i].play();
                    } else {
                        this.loopingChannels[i].pause();
                    }
                }
                return this;
            },
            isSoundEffectsEnabled:function () {
                return this.fxEnabled;
            },
            setMusicEnabled:function (enable) {
                this.musicEnabled = enable;
                this.stopMusic();
                return this;
            },
            isMusicEnabled:function () {
                return this.musicEnabled;
            }
        }
    }
});
