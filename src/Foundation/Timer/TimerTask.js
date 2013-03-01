CAAT.Module( {

    /**
     * @name TimerTask
     * @memberOf CAAT.Foundation.Timer
     * @constructor
     */

    defines : "CAAT.Foundation.Timer.TimerTask",
    aliases : ["CAAT.TimerTask"],
    extendsWith : {

        /**
         * @lends CAAT.Foundation.Timer.TimerTask.prototype
         */

        /**
         * Timer start time. Relative to Scene or Director time, depending who owns this TimerTask.
         */
        startTime:          0,

        /**
         * Timer duration.
         */
        duration:           0,

        /**
         * This callback will be called only once, when the timer expires.
         */
        callback_timeout:   null,

        /**
         * This callback will be called whenever the timer is checked in time.
         */
        callback_tick:      null,

        /**
         * This callback will be called when the timer is cancelled.
         */
        callback_cancel:    null,

        /**
         * What TimerManager instance owns this task.
         */
        owner:              null,

        /**
         * Scene or director instance that owns this TimerTask owner.
         */
        scene:              null,   // scene or director instance

        /**
         * An arbitrry id.
         */
        taskId:             0,

        /**
         * Remove this timer task on expiration/cancellation ?
         */
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
