module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
              separator: ';'
            },
            dist: {
                src: [
                    'src/Core/ModuleManager.js',
                    'src/Core/Constants.js',
                    'src/Core/Class.js',
                    'src/Math/Bezier.js',
                    'src/Math/CatmullRom.js',
                    'src/Math/Curve.js',
                    'src/Math/Dimension.js',
                    'src/Math/Matrix.js',
                    'src/Math/Matrix3.js',
                    'src/Math/Point.js',
                    'src/Math/Rectangle.js',
                    'src/Behavior/Interpolator.js',
                    'src/Behavior/BaseBehavior.js',
                    'src/Behavior/AlphaBehavior.js',
                    'src/Behavior/ContainerBehavior.js',
                    'src/Behavior/GenericBehavior.js',
                    'src/Behavior/PathBehavior.js',
                    'src/Behavior/RotateBehavior.js',
                    'src/Behavior/Scale1Behavior.js',
                    'src/Behavior/ScaleBehavior.js',
                    'src/Modules/Runtime/BrowserInfo.js',
                    'src/Modules/Audio/AudioManager.js',
                    'src/Modules/Storage/LocalStorage.js',
                    'src/Modules/ColorUtil/Color.js',
                    'src/Modules/Debug/Debug.js',
                    'src/Modules/Font/Font.js',
                    'src/Modules/CircleManager/PackedCircle.js',
                    'src/Modules/CircleManager/PackedCircleManager.js',
                    'src/Modules/Image/Preloader/Preloader.js',
                    'src/Modules/Image/Preloader/ImagePreloader.js',
                    'src/Modules/Image/Util/ImageUtil.js',
                    'src/Modules/Collision/Quadtree.js',
                    'src/Modules/Collision/SpatialHash.js',
                    'src/Modules/TexturePacker/TextureElement.js',
                    'src/Modules/TexturePacker/TextureScan.js',
                    'src/Modules/TexturePacker/TextureScanMap.js',
                    'src/Modules/TexturePacker/TexturePage.js',
                    'src/Modules/TexturePacker/TexturePageManager.js',
                    'src/Modules/LayoutUtils/RowLayout.js',
                    'src/Modules/Initialization/Template.js',
                    'src/Modules/Initialization/TemplateWithSplash.js',
                    'src/PathUtil/PathSegment.js',
                    'src/PathUtil/ArcPath.js',
                    'src/PathUtil/CurvePath.js',
                    'src/PathUtil/LinearPath.js',
                    'src/PathUtil/RectPath.js',
                    'src/PathUtil/Path.js',
                    'src/PathUtil/SVGPath.js',
                    'src/WebGL/GLU.js',
                    'src/WebGL/Program.js',
                    'src/WebGL/ColorProgram.js',
                    'src/WebGL/TextureProgram.js',
                    'src/Event/TouchInfo.js',
                    'src/Event/TouchEvent.js',
                    'src/Event/MouseEvent.js',
                    'src/Event/KeyEvent.js',
                    'src/Event/Input.js',
                    'src/Event/AnimationLoop.js',
                    'src/Foundation/Timer/TimerTask.js',
                    'src/Foundation/Timer/TimerManager.js',
                    'src/Foundation/UI/Layout/LayoutManager.js',
                    'src/Foundation/UI/Layout/BoxLayout.js',
                    'src/Foundation/UI/Layout/BorderLayout.js',
                    'src/Foundation/UI/Layout/GridLayout.js',
                    'src/Foundation/SpriteImageHelper.js',
                    'src/Foundation/SpriteImageAnimationHelper.js',
                    'src/Foundation/SpriteImage.js',
                    'src/Foundation/Actor.js',
                    'src/Foundation/ActorContainer.js',
                    'src/Foundation/Scene.js',
                    'src/Foundation/Director.js',
                    'src/Foundation/UI/Dock.js',
                    'src/Foundation/UI/InterpolatorActor.js',
                    'src/Foundation/UI/Label.js',
                    'src/Foundation/UI/PathActor.js',
                    'src/Foundation/UI/ShapeActor.js',
                    'src/Foundation/UI/StarActor.js',
                    'src/Foundation/UI/TextActor.js',
                    'solve_all'
                ],        
                dest: 'build/caat.js'
            },
            css: {
                src: [
                    'src/Core/ModuleManager.js',
                    'use_css',
                    'src/Core/Constants.js',
                    'src/Core/Class.js',
                    'src/Math/Bezier.js',
                    'src/Math/CatmullRom.js',
                    'src/Math/Curve.js',
                    'src/Math/Dimension.js',
                    'src/Math/Matrix.js',
                    'src/Math/Matrix3.js',
                    'src/Math/Point.js',
                    'src/Math/Rectangle.js',
                    'src/Behavior/Interpolator.js',
                    'src/Behavior/BaseBehavior.js',
                    'src/Behavior/AlphaBehavior.js',
                    'src/Behavior/ContainerBehavior.js',
                    'src/Behavior/GenericBehavior.js',
                    'src/Behavior/PathBehavior.js',
                    'src/Behavior/RotateBehavior.js',
                    'src/Behavior/Scale1Behavior.js',
                    'src/Behavior/ScaleBehavior.js',
                    'src/Modules/Runtime/BrowserInfo.js',
                    'src/Modules/Audio/AudioManager.js',
                    'src/Modules/Storage/LocalStorage.js',
                    'src/Modules/ColorUtil/Color.js',
                    'src/Modules/Debug/Debug.js',
                    'src/Modules/Font/Font.js',
                    'src/Modules/CircleManager/PackedCircle.js',
                    'src/Modules/CircleManager/PackedCircleManager.js',
                    'src/Modules/Image/Preloader/Preloader.js',
                    'src/Modules/Image/Preloader/ImagePreloader.js',
                    'src/Modules/Image/Util/ImageUtil.js',
                    'src/Modules/Collision/Quadtree.js',
                    'src/Modules/Collision/SpatialHash.js',
                    'src/Modules/TexturePacker/TextureElement.js',
                    'src/Modules/TexturePacker/TextureScan.js',
                    'src/Modules/TexturePacker/TextureScanMap.js',
                    'src/Modules/TexturePacker/TexturePage.js',
                    'src/Modules/TexturePacker/TexturePageManager.js',
                    'src/Modules/LayoutUtils/RowLayout.js',
                    'src/Modules/Initialization/Template.js',
                    'src/Modules/Initialization/TemplateWithSplash.js',
                    'src/Modules/CSS/csskeyframehelper.js',
                    'src/PathUtil/PathSegment.js',
                    'src/PathUtil/ArcPath.js',
                    'src/PathUtil/CurvePath.js',
                    'src/PathUtil/LinearPath.js',
                    'src/PathUtil/RectPath.js',
                    'src/PathUtil/Path.js',
                    'src/PathUtil/SVGPath.js',
                    'src/WebGL/GLU.js',
                    'src/WebGL/Program.js',
                    'src/WebGL/ColorProgram.js',
                    'src/WebGL/TextureProgram.js',
                    'src/Event/TouchInfo.js',
                    'src/Event/TouchEvent.js',
                    'src/Event/MouseEvent.js',
                    'src/Event/KeyEvent.js',
                    'src/Event/Input.js',
                    'src/Event/AnimationLoop.js',
                    'src/Foundation/Timer/TimerTask.js',
                    'src/Foundation/Timer/TimerManager.js',
                    'src/Foundation/UI/Layout/LayoutManager.js',
                    'src/Foundation/UI/Layout/BoxLayout.js',
                    'src/Foundation/UI/Layout/BorderLayout.js',
                    'src/Foundation/UI/Layout/GridLayout.js',
                    'src/Foundation/SpriteImageHelper.js',
                    'src/Foundation/SpriteImageAnimationHelper.js',
                    'src/Foundation/SpriteImage.js',
                    'src/Foundation/ActorCSS.js',
                    'src/Foundation/ActorContainerCSS.js',
                    'src/Foundation/SceneCSS.js',
                    'src/Foundation/Director.js',
                    'src/Foundation/UI/Dock.js',
                    'src/Foundation/UI/InterpolatorActor.js',
                    'src/Foundation/UI/Label.js',
                    'src/Foundation/UI/PathActor.js',
                    'src/Foundation/UI/ShapeActor.js',
                    'src/Foundation/UI/StarActor.js',
                    'src/Foundation/UI/TextActor.js',
                    'solve_all'
                ],        
                dest: 'build/caat-css.js'
            },
            box2d: {
                src: [
                    'src/Foundation/Box2D/B2DBodyActor.js',
                    'src/Foundation/Box2D/B2DCircularBody.js',
                    'src/Foundation/Box2D/B2DPolygonBody.js',
                    'solve_all'
                ],
                dest: 'build/caat-box2d.js'
            }
        },
        uglify: {
            options: {
              mangle: true,
              beautify: false,
              preserveComments: false,
              banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n' 
            },
            dist: {
                files: {
                    'build/caat-min.js':['build/caat.js']  
                } 
            },
            box2d: {
                files: {
                    'build/caat-box2d-min.js':['build/caat-box2d.js']
                } 
            },
            css: {
                files: {
                    'build/caat-css-min.js':['build/caat-css.js']
                }
            }
        },
        jsdoc: {
          dist: {
            src: ['src/**/*.js'],
            options: {
                destination: 'doc',
                recurse: true,
                private: true,
            },
            tags: {
                allowUnknownTags: true
            }
          }
        },
        jshint: {
            options: {
              curly: true,
              eqeqeq: true,
              eqnull: true,
              browser: true
            },
            all: ['src/**/*.js']
        }
});

    // Default task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jsdoc');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['concat, uglify, jsdoc, jshint']);
};
