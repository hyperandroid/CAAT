CAAT.Module( {
    defines : "CAAT.Foundation.Timer.TimerTask",
    aliases : ["CAAT.TimerTask"],
    extendsWith : {

        startTime:          0,
        duration:           0,
        callback_timeout:   null,
        callback_tick:      null,
        callback_cancel:    null,

        owner:              null,   // TimerManager instance
        scene:              null,   // scene or director instance
        taskId:             0,
        remove:             false,

        /**
         * Create a TimerTask.
         * The taskId will be set by the scene.
         * @param startTime {number} an integer indicating TimerTask enable time.
         * @param duration {number} an integer indicating TimerTask duration.
         * @param callback_timeout {function( sceneTime {number}, timertaskTime{number}, timertask {CAAT.TimerTask} )} on timeout callback function.
         * @param callback_tick {function( sceneTime {number}, timertaskTime{number}, timertask {CAAT.TimerTask} )} on tick callback function.
         * @param callback_cancel {function( sceneTime {number}, timertaskTime{number}, timertask {CAAT.TimerTask} )} on cancel callback function.
         *
         * @return this
         */
        create: function( startTime, duration, callback_timeout, callback_tick, callback_cancel ) {
            this.startTime=         startTime;
            this.duration=          duration;
            this.callback_timeout=  callback_timeout;
            this.callback_tick=     callback_tick;
            this.callback_cancel=   callback_cancel;
            return this;
        },
        /**
         * Performs TimerTask operation. The task will check whether it is in frame time, and will
         * either notify callback_timeout or callback_tick.
         *
         * @param time {number} an integer indicating scene time.
         * @return this
         *
         * @protected
         *
         */
        checkTask : function(time) {
            var ttime= time;
            ttime-= this.startTime;
            if ( ttime>=this.duration ) {
                this.remove= true;
                if( this.callback_timeout ) {
                    this.callback_timeout( time, ttime, this );
                }
            } else {
                if ( this.callback_tick ) {
                    this.callback_tick( time, ttime, this );
                }
            }
            return this;
        },
        remainingTime : function() {
            return this.duration - (this.scene.time-this.startTime);
        },
        /**
         * Reschedules this TimerTask by changing its startTime to current scene's time.
         * @param time {number} an integer indicating scene time.
         * @return this
         */
        reset : function( time ) {
            this.remove= false;
            this.startTime=  time;
            this.owner.ensureTimerTask(this);
            return this;
        },
        /**
         * Cancels this timer by removing it on scene's next frame. The function callback_cancel will
         * be called.
         * @return this
         */
        cancel : function() {
            this.remove= true;
            if ( null!=this.callback_cancel ) {
                this.callback_cancel( this.scene.time, this.scene.time-this.startTime, this );
            }
            return this;
        },
        addTime : function( time ) {
            this.duration+= time;
            return this;
        }
    }
});
