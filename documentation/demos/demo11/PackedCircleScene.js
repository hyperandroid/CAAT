CAAT.Module( {
    defines : "Circles.PackedCircleScene",
    depends : [
        "CAAT.Math.Point",
        "CAAT.Foundation.ActorContainer",
        "CAAT.Foundation.UI.ShapeActor",
        "CAAT.Behavior.ScaleBehavior",
        "CAAT.Behavior.AlphaBehavior",
        "CAAT.Behavior.Interpolator",
        "CAAT.Module.CircleManager.PackedCircleManager",
        "CAAT.Module.CircleManager.PackedCircle",
        "CAAT.Module.ColorUtil.Color"
    ],
    extendsWith : {
        packedCirleManager:null,
        director:null,
        scene:null,
        root:null,
        mousePosition:null,
        sineOffset:1212, // some arbitary number i liked

        initDirector:function (director) {
            this.mousePosition = new CAAT.Math.Point(director.width / 2, director.height / 2);
            this.director = director;
            this.scene = director.createScene();
            this.root = new CAAT.Foundation.ActorContainer().
                    setBounds(0, 0, director.width, director.height);
            this.scene.addChild(this.root);

            // Collision simulation
            this.packedCirleManager = new CAAT.Module.CircleManager.PackedCircleManager();
            this.packedCirleManager.setBounds(0, 0, director.width, director.height);
            this.packedCirleManager.setNumberOfCollisionPasses(2);
            this.packedCirleManager.setNumberOfTargetingPasses(1);

            // Create a bunch of circles!
            var rgb = new CAAT.Module.ColorUtil.Color(0, 0, 0),
                    total = 75;
            for (var i = 0; i < total; i++) {
                // Size
                var aRadius = Math.random() * 25 + 9;

                // color it
                var hue = (360 - ((i / total) * 360) ), // HSV uses 0 - 360
                        hex = new CAAT.Module.ColorUtil.Color.hsvToRgb(hue, 80, 99).toHex(); // Convert to hex value

                var circleActor = new CAAT.Foundation.UI.ShapeActor()
                        .setShape(CAAT.Foundation.UI.ShapeActor.SHAPE_CIRCLE)
                        .setLocation(Math.random() * director.width, Math.random() * director.height)
                        .setSize(aRadius * 2, aRadius * 2)// Size is in diameters
                        .setFillStyle('#' + hex);


                // The 'packedCircle' in the simulation is considered completely separate entity than the circleActor itself
                var packedCircle = new CAAT.Module.CircleManager.PackedCircle()
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

            // Force all packedCircles to move to the position of their delegates
            this.packedCirleManager.forceCirclesToMatchDelegatePositions();

            var me = this;

            this.root.mouseMove = function (mouseEvent) {
                me.mousePosition.set(mouseEvent.x, mouseEvent.y);
            };

            this.scene.onRenderEnd = function (director, delta) {

                me.packedCirleManager.pushAllCirclesTowardTarget();
                me.packedCirleManager.handleCollisions();
                me.sineOffset += 0.01;
                var circleList = me.packedCirleManager.allCircles,
                        len = circleList.length;

                // color it
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
                    circleActor.setFillStyle('#' + CAAT.Module.ColorUtil.Color.hsvToRgb(hue, 95, 99).toHex());

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
        animateInUsingScale:function (actor, starTime, endTime, startScale, endScale) {
            var scaleBehavior = new CAAT.Behavior.ScaleBehavior();
            scaleBehavior.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
            actor.scaleX = actor.scaleY = scaleBehavior.startScaleX = scaleBehavior.startScaleY = startScale;  // Fall from the 'sky' !
            scaleBehavior.endScaleX = scaleBehavior.endScaleY = endScale;
            scaleBehavior.setFrameTime(starTime, starTime + endTime);
            scaleBehavior.setCycle(false);
            scaleBehavior.setInterpolator(new CAAT.Behavior.Interpolator().createBounceOutInterpolator(false));
            actor.addBehavior(scaleBehavior);

            return scaleBehavior;
        },

        /**
         * Adds a CAAT.ScaleBehavior to the entity, used on animate in
         */
        animateInUsingAlpha:function (actor, starTime, endTime, startAlpha, endAlpha) {
            var fadeBehavior = new CAAT.Behavior.AlphaBehavior();

            fadeBehavior.anchor = CAAT.Foundation.Actor.ANCHOR_CENTER;
            actor.alpha = fadeBehavior.startAlpha = startAlpha;
            fadeBehavior.endAlpha = endAlpha;
            fadeBehavior.setFrameTime(starTime, endTime);
            fadeBehavior.setCycle(false);
            fadeBehavior.setInterpolator(new CAAT.Behavior.Interpolator().createExponentialOutInterpolator(2, false));
            actor.addBehavior(fadeBehavior);

            return fadeBehavior;
        }
    }
});