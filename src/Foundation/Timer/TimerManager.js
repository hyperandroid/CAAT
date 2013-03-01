/**
 * See LICENSE file.
 */
CAAT.Module({

    /**
     * @name Timer
     * @memberOf CAAT.Foundation
     * @namespace
     */

    /**
     * @name TimerManager
     * @memberOf CAAT.Foundation.Timer
     * @constructor
     */

    defines : "CAAT.Foundation.Timer.TimerManager",
    aliases : ["CAAT.TimerManager"],
    depends : [
        "CAAT.Foundation.Timer.TimerTask"
    ],
    extendsWith :   {

        /**
         * @lends CAAT.Foundation.Timer.TimerManager.prototype
         */

        __init:function () {
            this.timerList = [];
            return this;
        },

        /**
         * Collection of registered timers.
         * @type {CAAT.Foundation.Timer.TimerManager}
         * @private
         */
        timerList:null,

        /**
         * Index sequence to idenfity registered timers.
         * @private
         */
        timerSequence:0,

        /**
         * Check and apply timers in frame time.
         * @param time {number} the current Scene time.
         */
        checkTimers:function (time) {
            var tl = this.timerList;
            var i = tl.length - 1;
            while (i >= 0) {
                if (!tl[i].remove) {
                    tl[i].checkTask(time);
                }
                i--;
            }
        },
        /**
         * Make sure the timertask is contained in the timer task list by adding it to the list in case it
         * is not contained.
         * @param timertask {CAAT.Foundation.Timer.TimerTask}.
         * @return this
         */
        ensureTimerTask:function (timertask) {
            if (!this.hasTimer(timertask)) {
                this.timerList.push(timertask);
            }
            return this;
        },
        /**
         * Check whether the timertask is in this scene's timer task list.
         * @param timertask {CAAT.Foundation.Timer.TimerTask}.
         * @return {boolean} a boolean indicating whether the timertask is in this scene or not.
         */
        hasTimer:function (timertask) {
            var tl = this.timerList;
            var i = tl.length - 1;
            while (i >= 0) {
                if (tl[i] === timertask) {
                    return true;
                }
                i--;
            }

            return false;
        },
        /**
         * Creates a timer task. Timertask object live and are related to scene's time, so when an Scene
         * is taken out of the Director the timer task is paused, and resumed on Scene restoration.
         *
         * @param startTime {number} an integer indicating the scene time this task must start executing at.
         * @param duration {number} an integer indicating the timerTask duration.
         * @param callback_timeout {function} timer on timeout callback function.
         * @param callback_tick {function} timer on tick callback function.
         * @param callback_cancel {function} timer on cancel callback function.
         *
         * @return {CAAT.TimerTask} a CAAT.TimerTask class instance.
         */
        createTimer:function (startTime, duration, callback_timeout, callback_tick, callback_cancel, scene) {

            var tt = new CAAT.Foundation.Timer.TimerTask().create(
                startTime,
                duration,
                callback_timeout,
                callback_tick,
                callback_cancel);

            tt.taskId = this.timerSequence++;
            tt.sceneTime = scene.time;
            tt.owner = this;
            tt.scene = scene;

            this.timerList.push(tt);

            return tt;
        },
        /**
         * Removes expired timers. This method must not be called directly.
         */
        removeExpiredTimers:function () {
            var i;
            var tl = this.timerList;
            for (i = 0; i < tl.length; i++) {
                if (tl[i].remove) {
                    tl.splice(i, 1);
                }
            }
        }
    }
});
