#
# execute version procedure. 
# version.nfo contains new version value.
#
./version.sh
VERSION=`cat version.nfo`
echo "New generated version: ${VERSION}"


DST_FILE_NAME="${CAAT_DST}";

VERSION=`cat version.nfo`

FILE_CAAT="${DST_FILE_NAME}.js"
FILE_CAAT_CSS="${DST_FILE_NAME}-css.js"
FILE_CAAT_BOX2D="${DST_FILE_NAME}-box2d.js"

echo "Packing ${FILE_CAAT}"
echo -e "/*" > "${FILE_CAAT}"
cat LICENSE >> "${FILE_CAAT}"
echo -e "\nVersion: ${VERSION}\n" >> "${FILE_CAAT}"
echo -e "Created on:" >> "${FILE_CAAT}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT}"
echo -e "*/\n\n" >> "${FILE_CAAT}"

more ./src/CAAT.js >> "${FILE_CAAT}"
more ./src/core/class.js >> "${FILE_CAAT}"
more ./src/math/affinetransform2D.js >> "${FILE_CAAT}"
more ./src/math/color.js >> "${FILE_CAAT}"
more ./src/math/rectangle.js >> "${FILE_CAAT}"
more ./src/math/bezier.js >> "${FILE_CAAT}"
more ./src/math/point.js >> "${FILE_CAAT}"
more ./src/math/quadtree.js >> "${FILE_CAAT}"
more ./src/path/interpolator.js >> "${FILE_CAAT}"
more ./src/behaviour/behaviour.js >> "${FILE_CAAT}"
more ./src/behaviour/csskeyframehelper.js >> "${FILE_CAAT}"
more ./src/core/browserdetect.js >> "${FILE_CAAT}"
more ./src/model/debug.js >> "${FILE_CAAT}"
more ./src/model/actor.js >> "${FILE_CAAT}"
more ./src/model/audio.js >> "${FILE_CAAT}"
more ./src/model/extraActor.js >> "${FILE_CAAT}"
more ./src/model/director.js >> "${FILE_CAAT}"
more ./src/model/mouseevent.js >> "${FILE_CAAT}"
more ./src/model/conpoundimage.js >> "${FILE_CAAT}"
more ./src/model/imagepreloader.js >> "${FILE_CAAT}"
more ./src/model/timer.js >> "${FILE_CAAT}"
more ./src/model/scene.js >> "${FILE_CAAT}"
more ./src/modules/modules.js >> "${FILE_CAAT}"
more ./src/modules/CircleManager/PackedCircle.js >> "${FILE_CAAT}"
more ./src/modules/CircleManager/PackedCircleManager.js >> "${FILE_CAAT}"
more ./src/modules/LocalStorage/LocalStorage.js >> "${FILE_CAAT}"
more ./src/modules/ImageUtil/ImageUtil.js >> "${FILE_CAAT}"
more ./src/modules/Layout/layout.js >> "${FILE_CAAT}"
more ./src/modules/Font/font.js >> "${FILE_CAAT}"
more ./src/modules/Inspector/inspector.js >> "${FILE_CAAT}"
more ./src/path/interpolatoractor.js >> "${FILE_CAAT}"
more ./src/path/path.js >> "${FILE_CAAT}"
more ./src/path/pathactor.js >> "${FILE_CAAT}"
more ./src/texture/plasma.js >> "${FILE_CAAT}"
more ./src/webgl/ShaderUtil.js >> "${FILE_CAAT}"
more ./src/webgl/glu.js >> "${FILE_CAAT}"
more ./src/webgl/glTexturePage.js >> "${FILE_CAAT}"


# Distribute resulting compiled files
#
echo -e "\nCopying:"
while read LINE; do
  echo -e "\tCopying results to ${LINE}"
  cp ${FILE_CAAT} ${LINE} 
done < version.distribution


#
# CSS
#
echo "Packing ${FILE_CAAT_CSS}"
echo -e "/*" > "${FILE_CAAT_CSS}"
cat LICENSE >> "${FILE_CAAT_CSS}"
echo -e "\nVersion: ${VERSION}\n" >> "${FILE_CAAT_CSS}"
echo -e "Created on:" >> "${FILE_CAAT_CSS}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT_CSS}"
echo -e "*/\n\n" >> "${FILE_CAAT_CSS}"

more ./src/CAAT.js >> "${FILE_CAAT_CSS}"
echo -e "CAAT.__CSS__=1;" >> "${FILE_CAAT_CSS}"
more ./src/core/class.js >> "${FILE_CAAT_CSS}"
more ./src/math/affinetransform2D.js >> "${FILE_CAAT_CSS}"
more ./src/math/color.js >> "${FILE_CAAT_CSS}"
more ./src/math/rectangle.js >> "${FILE_CAAT_CSS}"
more ./src/math/bezier.js >> "${FILE_CAAT_CSS}"
more ./src/math/point.js >> "${FILE_CAAT_CSS}"
more ./src/math/quadtree.js >> "${FILE_CAAT_CSS}"
more ./src/path/interpolator.js >> "${FILE_CAAT_CSS}"
more ./src/behaviour/behaviour.js >> "${FILE_CAAT_CSS}"
more ./src/behaviour/csskeyframehelper.js >> "${FILE_CAAT_CSS}"
more ./src/core/browserdetect.js >> "${FILE_CAAT_CSS}"
more ./src/model/debug.js >> "${FILE_CAAT_CSS}"
more ./src/model/actorCSS.js >> "${FILE_CAAT_CSS}"
more ./src/model/audio.js >> "${FILE_CAAT_CSS}"
more ./src/model/extraActor.js >> "${FILE_CAAT_CSS}"
more ./src/model/director.js >> "${FILE_CAAT_CSS}"
more ./src/model/mouseevent.js >> "${FILE_CAAT_CSS}"
more ./src/model/conpoundimage.js >> "${FILE_CAAT_CSS}"
more ./src/model/imagepreloader.js >> "${FILE_CAAT_CSS}"
more ./src/model/timer.js >> "${FILE_CAAT_CSS}"
more ./src/model/sceneCSS.js >> "${FILE_CAAT_CSS}"
more ./src/modules/modules.js >> "${FILE_CAAT_CSS}"
more ./src/modules/CircleManager/PackedCircle.js >> "${FILE_CAAT_CSS}"
more ./src/modules/CircleManager/PackedCircleManager.js >> "${FILE_CAAT_CSS}"
more ./src/modules/LocalStorage/LocalStorage.js >> "${FILE_CAAT_CSS}"
more ./src/modules/ImageUtil/ImageUtil.js >> "${FILE_CAAT_CSS}"
more ./src/modules/Layout/layout.js >> "${FILE_CAAT_CSS}"
more ./src/modules/Font/font.js >> "${FILE_CAAT_CSS}"
more ./src/modules/Inspector/inspector.js >> "${FILE_CAAT_CSS}"
more ./src/path/interpolatoractor.js >> "${FILE_CAAT_CSS}"
more ./src/path/path.js >> "${FILE_CAAT_CSS}"
more ./src/path/pathactor.js >> "${FILE_CAAT_CSS}"


#
# Distribute resulting compiled files
#
echo -e "\nCopying:"
while read LINE; do
  echo -e "\tCopying results to ${LINE}"
  cp ${FILE_CAAT_CSS} ${LINE} 
done < version.distribution

# box2d

echo "Packing ${FILE_CAAT_BOX2D}"
echo -e "/*" > "${FILE_CAAT_BOX2D}"
cat LICENSE >> "${FILE_CAAT_BOX2D}"
echo -e "\nVersion: ${VERSION}\n" >> "${FILE_CAAT_BOX2D}"
echo -e "Created on:" >> "${FILE_CAAT_BOX2D}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT_BOX2D}"
echo -e "*/\n\n" >> "${FILE_CAAT_BOX2D}"

more ./src/box2d/box2Dactor.js >> "${FILE_CAAT_BOX2D}"

#
# Distribute resulting compiled files
#
echo -e "\nCopying:"
while read LINE; do
  echo -e "\tCopying results to ${LINE}"
  cp ${FILE_CAAT_BOX2D} ${LINE} 
done < version.distribution
