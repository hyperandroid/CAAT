/**
 *
 * Shows some collision management.
 * Thanks to Mario Gonzalez @onedayitwillmake.
 *
 */

function __scene10(director) {

    // Start our scene created below
    var packedCircleScene = new PackedCircleScene();
    packedCircleScene.initDirector(director);

    __scene10_text(director, packedCircleScene.scene);
}

function __scene10_text(director, scene) {
    var gradient = director.crc.createLinearGradient(0, 0, 0, 50);
    gradient.addColorStop(0, 'orange');
    gradient.addColorStop(0.5, 'red');
    gradient.addColorStop(1, '#3f00ff');

    var cc = new CAAT.ActorContainer().
            setBounds(450, 30, 150, 100).
            create().
            enableEvents(false).
            addBehavior(
            new CAAT.RotateBehavior().
                    setCycle(true).
                    setFrameTime(0, 4000).
                    setValues(-Math.PI / 8, Math.PI / 8, 50, 0).
                    setInterpolator(
                    new CAAT.Interpolator().createExponentialInOutInterpolator(3, true)
                    )
            );
    scene.addChild(cc);

    var text = new CAAT.TextActor().
            setFont("50px sans-serif").
            setText("PackedCircle").
            create().
            setFillStyle(gradient).
            setOutline(true).
            calcTextSize(director);
    cc.addChild(text.cacheAsBitmap().setLocation((cc.width - text.textWidth) / 2, 0));

    var text2 = new CAAT.TextActor().
            setFont("30px sans-serif").
            setText("Collision demo").
            calcTextSize(director).
            create().
            setFillStyle(gradient).
            setOutline(true);
    cc.addChild(text2.cacheAsBitmap().setLocation((cc.width - text2.textWidth) / 2, 50));
}

(function() {
    PackedCircleScene = function() {
        return this;
    };

    PackedCircleScene.prototype = {
        packedCirleManager: null,
        director:    null,
        scene:    null,
        root:    null,
        mousePosition: null,
        sineOffset: 1212, // some arbitary number i liked

        initDirector: function(director) {
            this.mousePosition = new CAAT.Point(director.canvas.width / 2, director.canvas.height / 2);
            this.director = director;
            this.scene = new CAAT.Scene().
                    create();
            this.root = new CAAT.ActorContainer().
                    setBounds(0, 0, director.canvas.width, director.canvas.height);
            this.scene.addChild(this.root);

            // Collision simulation
            this.packedCirleManager = new CAAT.modules.CircleManager.PackedCircleManager();
            this.packedCirleManager.setBounds(0, 0, director.width, director.height);
            this.packedCirleManager.setNumberOfCollisionPasses(2);
            this.packedCirleManager.setNumberOfTargetingPasses(1);

            // Create a bunch of circles!
            var colorHelper = new CAAT.Color(),
                    rgb = new CAAT.Color.RGB(0, 0, 0),
                    total = 75;
            for (var i = 0; i < total; i++) {
                // Size
                var aRadius = Math.random() * 25 + 9;

                // color it
                var hue = (360 - ((i / total) * 360) ), // HSV uses 0 - 360
                        hex = colorHelper.hsvToRgb(hue, 80, 99).toHex(); // Convert to hex value

                var circleActor = new CAAT.ShapeActor()
                        .setShape(CAAT.ShapeActor.prototype.SHAPE_CIRCLE)
                        .setLocation(Math.random() * director.canvas.width, Math.random() * director.canvas.height)
                        .setSize(aRadius * 2, aRadius * 2)// Size is in diameters
                        .setFillStyle('#' + hex);


                // The 'packedCircle' in the simulation is considered completely separate entity than the circleActor itself
                var packedCircle = new CAAT.modules.CircleManager.PackedCircle()
                        .setDelegate(circleActor)
                        .setRadius(aRadius)
                        .setCollisionMask(1)// packedCircle instnace - will collide against this group
                        .setCollisionGroup(1)// packedCircle instance - is in this group
                        .setTargetPosition(this.mousePosition)
                        .setTargetChaseSpeed(Math.random() * 0.02);

                // disable mouse on specific circle
                packedCircle.mouseEnabled = false;

                this.animateInUsingScale(circleActor, this.scene.time + Math.random() * 3000, 500, 0.1, 1);

                // Add to the collision simulation
                this.packedCirleManager.addCircle(packedCircle);

                // Add actor to the scene
                this.root.addChild(circleActor);
            }

            this.director.addScene(this.scene);

            // Force all packedCircles to move to the position of their delegates
            this.packedCirleManager.forceCirclesToMatchDelegatePositions();

            var me = this;

            this.root.mouseMove = function(mouseEvent) {
                me.mousePosition.set(mouseEvent.point.x, mouseEvent.point.y);
            };

            this.scene.onRenderEnd = function(director, delta) {

                me.packedCirleManager.pushAllCirclesTowardTarget();
                me.packedCirleManager.handleCollisions();
                me.sineOffset += 0.01;
                var circleList = me.packedCirleManager.allCircles,
                        len = circleList.length;

                // color it
                var color = new CAAT.Color();
                var longestDistance = 40000 + Math.sin(me.sineOffset) * 30000;
                if (longestDistance < 0) longestDistance *= -1; // abs
                while (len--) {
                    var packedCircle = circleList[len];
                    var circleActor = packedCircle.delegate;
                    var distanceFromTarget = packedCircle.position.getDistanceSquared(packedCircle.targetPosition);
                    if (distanceFromTarget > longestDistance) distanceFromTarget = longestDistance;

                    var amplitude = (distanceFromTarget / longestDistance);
                    var hue = 360 - (amplitude * 95);

                    circleActor.x = packedCircle.position.x - packedCircle.radius;
                    circleActor.y = packedCircle.position.y - packedCircle.radius;
                    // color
                    circleActor.setFillStyle('#' + color.hsvToRgb(hue, 95, 99).toHex());

                    // Here we are doing an interesting trick.
                    // By randomly changing the targetChaseSpeed +/- 0.002 randomly
                    // we introduce a seemingly complex hive behavior whereby certain circles
                    // seem to want to 'leave' sometimes, and others decide to force their way to the center more strongly
                    if (Math.random() < 0.2)
                        packedCircle.setTargetChaseSpeed(packedCircle.targetChaseSpeed + Math.random() * 0.004 - 0.002);
                }
            };
        },

        /**
         * Adds a CAAT.ScaleBehavior to the entity, used on animate in
         */
        animateInUsingScale: function(actor, starTime, endTime, startScale, endScale) {
            var scaleBehavior = new CAAT.ScaleBehavior();
            scaleBehavior.anchor = CAAT.Actor.prototype.ANCHOR_CENTER;
            actor.scaleX = actor.scaleY = scaleBehavior.startScaleX = scaleBehavior.startScaleY = startScale;  // Fall from the 'sky' !
            scaleBehavior.endScaleX = scaleBehavior.endScaleY = endScale;
            scaleBehavior.setFrameTime(starTime, starTime + endTime);
            scaleBehavior.setCycle(false);
            scaleBehavior.setInterpolator(new CAAT.Interpolator().createBounceOutInterpolator(false));
            actor.addBehavior(scaleBehavior);

            return scaleBehavior;
        },

        /**
         * Adds a CAAT.ScaleBehavior to the entity, used on animate in
         */
        animateInUsingAlpha: function(actor, starTime, endTime, startAlpha, endAlpha) {
            var fadeBehavior = new CAAT.AlphaBehavior();

            fadeBehavior.anchor = CAAT.Actor.prototype.ANCHOR_CENTER;
            actor.alpha = fadeBehavior.startAlpha = startAlpha;
            fadeBehavior.endAlpha = endAlpha;
            fadeBehavior.setFrameTime(starTime, endTime);
            fadeBehavior.setCycle(false);
            fadeBehavior.setInterpolator(new CAAT.Interpolator().createExponentialOutInterpolator(2, false));
            actor.addBehavior(fadeBehavior);

            return fadeBehavior;
        }
    }
})();
