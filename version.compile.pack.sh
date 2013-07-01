#
# execute version procedure. 
# version.nfo contains new version value.
#i
source ./version.compile.variables.sh
./version.sh
VERSION=`cat version.nfo`
echo "New generated version: ${VERSION}"

CAAT_DST="/tmp/caat"

DST_FILE_NAME="${CAAT_DST}";

VERSION=`cat version.nfo`

FILE_CAAT="${DST_FILE_NAME}.js"
FILE_CAAT_CSS="${DST_FILE_NAME}-css.js"
FILE_CAAT_BOX2D="${DST_FILE_NAME}-box2d.js"

echo "Packing ${FILE_CAAT}"
echo "/*" > "${FILE_CAAT}"
cat LICENSE >> "${FILE_CAAT}"
echo "\nVersion: ${VERSION}\n" >> "${FILE_CAAT}"
echo "Created on:" >> "${FILE_CAAT}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT}"
echo "*/\n\n" >> "${FILE_CAAT}"

more ./src/Core/ModuleManager.js >> "${FILE_CAAT}"
more ./src/Core/Constants.js >> "${FILE_CAAT}"
more ./src/Core/Class.js >> "${FILE_CAAT}"

more ./src/Math/Bezier.js >> "${FILE_CAAT}"
more ./src/Math/CatmullRom.js >> "${FILE_CAAT}"
more ./src/Math/Curve.js >> "${FILE_CAAT}"
more ./src/Math/Dimension.js >> "${FILE_CAAT}"
more ./src/Math/Matrix.js >> "${FILE_CAAT}"
more ./src/Math/Matrix3.js >> "${FILE_CAAT}"
more ./src/Math/Point.js >> "${FILE_CAAT}"
more ./src/Math/Rectangle.js >> "${FILE_CAAT}"

more ./src/Behavior/Interpolator.js >> "${FILE_CAAT}"
more ./src/Behavior/BaseBehavior.js >> "${FILE_CAAT}"
more ./src/Behavior/AlphaBehavior.js >> "${FILE_CAAT}"
more ./src/Behavior/ContainerBehavior.js >> "${FILE_CAAT}"
more ./src/Behavior/GenericBehavior.js >> "${FILE_CAAT}"
more ./src/Behavior/PathBehavior.js >> "${FILE_CAAT}"
more ./src/Behavior/RotateBehavior.js >> "${FILE_CAAT}"
more ./src/Behavior/Scale1Behavior.js >> "${FILE_CAAT}"
more ./src/Behavior/ScaleBehavior.js >> "${FILE_CAAT}"

more ./src/Modules/Runtime/BrowserInfo.js >> "${FILE_CAAT}"
more ./src/Modules/Audio/AudioManager.js >> "${FILE_CAAT}"
more ./src/Modules/Storage/LocalStorage.js >> "${FILE_CAAT}"
more ./src/Modules/ColorUtil/Color.js >> "${FILE_CAAT}"
more ./src/Modules/Debug/Debug.js >> "${FILE_CAAT}"
more ./src/Modules/Font/Font.js >> "${FILE_CAAT}"
more ./src/Modules/CircleManager/PackedCircle.js >> "${FILE_CAAT}"
more ./src/Modules/CircleManager/PackedCircleManager.js >> "${FILE_CAAT}"
more ./src/Modules/Image/Preloader/Preloader.js >> "${FILE_CAAT}"
more ./src/Modules/Image/Preloader/ImagePreloader.js >> "${FILE_CAAT}"
more ./src/Modules/Image/Preloader/XHR.js >> "${FILE_CAAT}"
more ./src/Modules/Image/Util/ImageUtil.js >> "${FILE_CAAT}"
more ./src/Modules/Collision/Quadtree.js >> "${FILE_CAAT}"
more ./src/Modules/Collision/SpatialHash.js >> "${FILE_CAAT}"
more ./src/Modules/TexturePacker/TextureElement.js >> "${FILE_CAAT}"
more ./src/Modules/TexturePacker/TextureScan.js >> "${FILE_CAAT}"
more ./src/Modules/TexturePacker/TextureScanMap.js >> "${FILE_CAAT}"
more ./src/Modules/TexturePacker/TexturePage.js >> "${FILE_CAAT}"
more ./src/Modules/TexturePacker/TexturePageManager.js >> "${FILE_CAAT}"
more ./src/Modules/LayoutUtils/RowLayout.js >> "${FILE_CAAT}"
more ./src/Modules/Initialization/Template.js >> "${FILE_CAAT}"
more ./src/Modules/Initialization/TemplateWithSplash.js >> "${FILE_CAAT}"
more ./src/Modules/CSS/csskeyframehelper.js >> "${FILE_CAAT}"


more ./src/PathUtil/PathSegment.js >> "${FILE_CAAT}"
more ./src/PathUtil/ArcPath.js >> "${FILE_CAAT}"
more ./src/PathUtil/CurvePath.js >> "${FILE_CAAT}"
more ./src/PathUtil/LinearPath.js >> "${FILE_CAAT}"
more ./src/PathUtil/RectPath.js >> "${FILE_CAAT}"
more ./src/PathUtil/Path.js >> "${FILE_CAAT}"
more ./src/PathUtil/SVGPath.js >> "${FILE_CAAT}"

more ./src/WebGL/GLU.js >> "${FILE_CAAT}"
more ./src/WebGL/Program.js >> "${FILE_CAAT}"
more ./src/WebGL/ColorProgram.js >> "${FILE_CAAT}"
more ./src/WebGL/TextureProgram.js >> "${FILE_CAAT}"

more ./src/Event/TouchInfo.js >> "${FILE_CAAT}"
more ./src/Event/TouchEvent.js >> "${FILE_CAAT}"
more ./src/Event/MouseEvent.js >> "${FILE_CAAT}"
more ./src/Event/KeyEvent.js >> "${FILE_CAAT}"
more ./src/Event/Input.js >> "${FILE_CAAT}"
more ./src/Event/AnimationLoop.js >> "${FILE_CAAT}"

more ./src/Foundation/Timer/TimerTask.js >> "${FILE_CAAT}"
more ./src/Foundation/Timer/TimerManager.js >> "${FILE_CAAT}"

more ./src/Foundation/UI/Layout/LayoutManager.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/Layout/BoxLayout.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/Layout/BorderLayout.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/Layout/GridLayout.js >> "${FILE_CAAT}"

more ./src/Foundation/SpriteImageHelper.js >> "${FILE_CAAT}"
more ./src/Foundation/SpriteImageAnimationHelper.js >> "${FILE_CAAT}"
more ./src/Foundation/SpriteImage.js >> "${FILE_CAAT}"
more ./src/Foundation/Actor.js >> "${FILE_CAAT}"
more ./src/Foundation/ActorContainer.js >> "${FILE_CAAT}"
more ./src/Foundation/Scene.js >> "${FILE_CAAT}"
more ./src/Foundation/Director.js >> "${FILE_CAAT}"

#more ./src/Foundation/Box2D/B2DBodyActor.js >> "${FILE_CAAT}"
#more ./src/Foundation/Box2D/B2DCircularBody.js >> "${FILE_CAAT}"
#more ./src/Foundation/Box2D/B2DPolygonBody.js >> "${FILE_CAAT}"

more ./src/Foundation/UI/Dock.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/InterpolatorActor.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/Label.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/PathActor.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/ShapeActor.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/StarActor.js >> "${FILE_CAAT}"
more ./src/Foundation/UI/TextActor.js >> "${FILE_CAAT}"

echo "CAAT.ModuleManager.solveAll();" >> "${FILE_CAAT}"

# Distribute resulting compiled files
#
echo "\nCopying:"
echo "\tCopying results to ${CAAT_BUILD_DIR}"
cp ${FILE_CAAT} ${CAAT_BUILD_DIR}



#
# CSS
#
echo "Packing ${FILE_CAAT_CSS}"
echo "/*" > "${FILE_CAAT_CSS}"
cat LICENSE >> "${FILE_CAAT_CSS}"
echo "\nVersion: ${VERSION}\n" >> "${FILE_CAAT_CSS}"
echo "Created on:" >> "${FILE_CAAT_CSS}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT_CSS}"
echo "*/\n\n" >> "${FILE_CAAT_CSS}"


more ./src/Core/ModuleManager.js >> "${FILE_CAAT_CSS}"
echo "CAAT.__CSS__=1;" >> "${FILE_CAAT_CSS}"
more ./src/Core/Constants.js >> "${FILE_CAAT_CSS}"
more ./src/Core/Class.js >> "${FILE_CAAT_CSS}"

more ./src/Math/Bezier.js >> "${FILE_CAAT_CSS}"
more ./src/Math/CatmullRom.js >> "${FILE_CAAT_CSS}"
more ./src/Math/Curve.js >> "${FILE_CAAT_CSS}"
more ./src/Math/Dimension.js >> "${FILE_CAAT_CSS}"
more ./src/Math/Matrix.js >> "${FILE_CAAT_CSS}"
more ./src/Math/Matrix3.js >> "${FILE_CAAT_CSS}"
more ./src/Math/Point.js >> "${FILE_CAAT_CSS}"
more ./src/Math/Rectangle.js >> "${FILE_CAAT_CSS}"

more ./src/Behavior/Interpolator.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/BaseBehavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/AlphaBehavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/ContainerBehavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/GenericBehavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/PathBehavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/RotateBehavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/Scale1Behavior.js >> "${FILE_CAAT_CSS}"
more ./src/Behavior/ScaleBehavior.js >> "${FILE_CAAT_CSS}"

more ./src/Modules/Runtime/BrowserInfo.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Audio/AudioManager.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Storage/LocalStorage.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/ColorUtil/Color.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Debug/Debug.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Font/Font.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/CircleManager/PackedCircle.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/CircleManager/PackedCircleManager.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Image/Preloader/Preloader.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Image/Preloader/ImagePreloader.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Image/Preloader/XHR.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Image/Util/ImageUtil.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Collision/Quadtree.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Collision/SpatialHash.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/TexturePacker/TextureElement.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/TexturePacker/TextureScan.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/TexturePacker/TextureScanMap.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/TexturePacker/TexturePage.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/TexturePacker/TexturePageManager.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/LayoutUtils/RowLayout.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Initialization/Template.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/Initialization/TemplateWithSplash.js >> "${FILE_CAAT_CSS}"
more ./src/Modules/CSS/csskeyframehelper.js >> "${FILE_CAAT}"


more ./src/PathUtil/PathSegment.js >> "${FILE_CAAT_CSS}"
more ./src/PathUtil/ArcPath.js >> "${FILE_CAAT_CSS}"
more ./src/PathUtil/CurvePath.js >> "${FILE_CAAT_CSS}"
more ./src/PathUtil/LinearPath.js >> "${FILE_CAAT_CSS}"
more ./src/PathUtil/RectPath.js >> "${FILE_CAAT_CSS}"
more ./src/PathUtil/Path.js >> "${FILE_CAAT_CSS}"
more ./src/PathUtil/SVGPath.js >> "${FILE_CAAT_CSS}"

more ./src/WebGL/GLU.js >> "${FILE_CAAT_CSS}"
more ./src/WebGL/Program.js >> "${FILE_CAAT_CSS}"
more ./src/WebGL/ColorProgram.js >> "${FILE_CAAT_CSS}"
more ./src/WebGL/TextureProgram.js >> "${FILE_CAAT_CSS}"

more ./src/Event/TouchInfo.js >> "${FILE_CAAT_CSS}"
more ./src/Event/TouchEvent.js >> "${FILE_CAAT_CSS}"
more ./src/Event/MouseEvent.js >> "${FILE_CAAT_CSS}"
more ./src/Event/KeyEvent.js >> "${FILE_CAAT_CSS}"
more ./src/Event/Input.js >> "${FILE_CAAT_CSS}"
more ./src/Event/AnimationLoop.js >> "${FILE_CAAT_CSS}"

more ./src/Foundation/Timer/TimerTask.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/Timer/TimerManager.js >> "${FILE_CAAT_CSS}"

more ./src/Foundation/UI/Layout/LayoutManager.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/Layout/BoxLayout.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/Layout/BorderLayout.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/Layout/GridLayout.js >> "${FILE_CAAT_CSS}"

more ./src/Foundation/SpriteImageHelper.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/SpriteImageAnimationHelper.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/SpriteImage.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/ActorCSS.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/ActorContainerCSS.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/SceneCSS.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/Director.js >> "${FILE_CAAT_CSS}"

more ./src/Foundation/UI/Dock.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/InterpolatorActor.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/Label.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/PathActor.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/ShapeActor.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/StarActor.js >> "${FILE_CAAT_CSS}"
more ./src/Foundation/UI/TextActor.js >> "${FILE_CAAT_CSS}"

echo "CAAT.ModuleManager.solveAll();" >> "${FILE_CAAT_CSS}"

# Distribute resulting compiled files
#
echo "\nCopying:"
echo "\tCopying results to ${CAAT_BUILD_DIR}"
cp ${FILE_CAAT_CSS} ${CAAT_BUILD_DIR}



# box2d

echo "Packing ${FILE_CAAT_BOX2D}"
echo "/*" > "${FILE_CAAT_BOX2D}"
cat LICENSE >> "${FILE_CAAT_BOX2D}"
echo "\nVersion: ${VERSION}\n" >> "${FILE_CAAT_BOX2D}"
echo "Created on:" >> "${FILE_CAAT_BOX2D}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT_BOX2D}"
echo "*/\n\n" >> "${FILE_CAAT_BOX2D}"

more ./src/Foundation/Box2D/B2DBodyActor.js >> "${FILE_CAAT_BOX2D}"
more ./src/Foundation/Box2D/B2DCircularBody.js >> "${FILE_CAAT_BOX2D}"
more ./src/Foundation/Box2D/B2DPolygonBody.js >> "${FILE_CAAT_BOX2D}"

echo "CAAT.ModuleManager.solveAll();" >> "${FILE_CAAT_BOX2D}"

# Distribute resulting compiled files
#
echo "\nCopying:"
echo "\tCopying results to ${CAAT_BUILD_DIR}"
cp ${FILE_CAAT_BOX2D} ${CAAT_BUILD_DIR}
