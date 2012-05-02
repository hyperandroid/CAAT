if [ "${CAAT_DST}" == "" ]; then
  echo CAAT_DST is not defined.
  exit -1;
fi

echo -e "\n\nCompilation process\n\n"

#
# define CAAT products files.
#
DST_FILE_NAME="${CAAT_DST}";

FILE_CAAT="${DST_FILE_NAME}-min.js"
FILE_CAAT_CSS="${DST_FILE_NAME}-css-min.js"
FILE_CAAT_BOX2D="${DST_FILE_NAME}-box2d-min.js"

#
# DST_FILE is a file name.
# This script will produce different target files as follow:
#   + DST_FILE.js
#   + DST_FILE-css.js
#   + DST_FILE-box2d.js
#
echo "" > "${FILE_CAAT}"
echo "" > "${FILE_CAAT_CSS}"
echo "" > "${FILE_CAAT_BOX2D}"

SOURCE_DIR=/Users/ibon/js/CAAT/src

#
# set compilation level
#
COMPILATION_LEVEL=$1
if [ "${COMPILATION_LEVEL}" ]; then
  if [[ "${COMPILATION_LEVEL}" == "simple" ]]; then
    echo "Compilation level set to simple"
    COMPILATION_LEVEL="SIMPLE_OPTIMIZATIONS"
  elif [[ "${COMPILATION_LEVEL}" == "advanced" ]]; then
    echo "Compilation level set to advanced"
    COMPILATION_LECEL="ADVANCED_OPTIMIZATIONS"
  elif [[ "${COMPILATION_LEVEL}" == "spaces" ]]; then
    echo "Compilation level set to white spaces"
    COMPILATION_LEVEL="WHITESPACE_ONLY"
  else
    echo "Compilation level unknown: '${COMPILATION_LEVEL}'. Change to SIMPLE_OPTIMIZATIONS"
    COMPILATION_LEVEL="SIMPLE_OPTIMIZATIONS"
  fi
else
  echo "Compilation level defaults to simple optimizations."
  COMPILATION_LEVEL="SIMPLE_OPTIMIZATIONS"
fi

#
# execute version procedure. 
# version.nfo contains new version value.
#
./version.sh
VERSION=`cat version.nfo`
echo "New generated version: ${VERSION}"
echo "Generated at: ${DST_FILE_NAME}"
echo "From files at: ${SOURCE_DIR}"

#
# create stub files for all CAAT products.
#
echo -e "/*" >> "${FILE_CAAT}"
cat LICENSE >> "${FILE_CAAT}"
echo -e "\nVersion: ${VERSION}\n" >> "${FILE_CAAT}"
echo -e "Created on:" >> "${FILE_CAAT}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT}"
echo -e "*/\n\n" >> "${FILE_CAAT}"

echo -e "/*" >> "${FILE_CAAT_CSS}"
cat LICENSE >> "${FILE_CAAT_CSS}"
echo -e "\nVersion: ${VERSION}\n" >> "${FILE_CAAT_CSS}"
echo -e "Created on:" >> "${FILE_CAAT_CSS}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT_CSS}"
echo -e "*/\n\n" >> "${FILE_CAAT_CSS}"

echo -e "/*" >> "${FILE_CAAT_BOX2D}"
cat LICENSE >> "${FILE_CAAT_BOX2D}"
echo -e "\nVersion: ${VERSION}\n" >> "${FILE_CAAT_BOX2D}"
echo -e "Created on:" >> "${FILE_CAAT_BOX2D}"
date "+DATE: %Y-%m-%d%nTIME: %H:%M:%S" >> "${FILE_CAAT_BOX2D}"
echo -e "*/\n\n" >> "${FILE_CAAT_BOX2D}"


#
# Compile canvas/GL
#
echo -e "\nCreating CAAT canvas/webGL"
/usr/bin/java -jar /Users/ibon/applications/closure/compiler.jar --compilation_level "${COMPILATION_LEVEL}" \
 --js "${SOURCE_DIR}"/CAAT.js \
 --js "${SOURCE_DIR}"/core/browserdetect.js \
 --js "${SOURCE_DIR}"/core/class.js \
 --js "${SOURCE_DIR}"/math/affinetransform2D.js \
 --js "${SOURCE_DIR}"/math/color.js \
 --js "${SOURCE_DIR}"/math/rectangle.js \
 --js "${SOURCE_DIR}"/math/bezier.js \
 --js "${SOURCE_DIR}"/math/point.js \
 --js "${SOURCE_DIR}"/math/quadtree.js \
 --js "${SOURCE_DIR}"/path/interpolator.js \
 --js "${SOURCE_DIR}"/behaviour/behaviour.js \
 --js "${SOURCE_DIR}"/model/debug.js \
 --js "${SOURCE_DIR}"/model/actor.js \
 --js "${SOURCE_DIR}"/model/audio.js \
 --js "${SOURCE_DIR}"/model/extraActor.js \
 --js "${SOURCE_DIR}"/model/director.js \
 --js "${SOURCE_DIR}"/model/mouseevent.js \
 --js "${SOURCE_DIR}"/model/conpoundimage.js \
 --js "${SOURCE_DIR}"/model/imagepreloader.js \
 --js "${SOURCE_DIR}"/model/timer.js \
 --js "${SOURCE_DIR}"/model/scene.js \
 --js "${SOURCE_DIR}"/modules/modules.js \
 --js "${SOURCE_DIR}"/modules/Layout/layout.js \
 --js "${SOURCE_DIR}"/modules/CircleManager/PackedCircle.js \
 --js "${SOURCE_DIR}"/modules/CircleManager/PackedCircleManager.js \
 --js "${SOURCE_DIR}"/modules/LocalStorage/LocalStorage.js \
 --js "${SOURCE_DIR}"/modules/ImageUtil/ImageUtil.js \
 --js "${SOURCE_DIR}"/modules/Font/font.js \
 --js "${SOURCE_DIR}"/path/interpolatoractor.js \
 --js "${SOURCE_DIR}"/path/path.js \
 --js "${SOURCE_DIR}"/path/pathactor.js \
 --js "${SOURCE_DIR}"/texture/plasma.js \
 --js "${SOURCE_DIR}"/webgl/ShaderUtil.js \
 --js "${SOURCE_DIR}"/webgl/glu.js \
 --js "${SOURCE_DIR}"/webgl/glTexturePage.js \
 >> "${FILE_CAAT}"

#
# Compile box2d
#
echo "Creating CAAT Box2d"
/usr/bin/java -jar /Users/ibon/applications/closure/compiler.jar --compilation_level "${COMPILATION_LEVEL}" --js "${SOURCE_DIR}"/box2d/box2Dactor.js >> "${FILE_CAAT_BOX2D}"

#
# Compile css
#
echo "Creating CAAT CSS"
echo -e "CAAT.__CSS__=1;" >> /tmp/__css.js
java -jar /Users/ibon/applications/closure/compiler.jar --compilation_level "${COMPILATION_LEVEL}" \
 --js "${SOURCE_DIR}"/CAAT.js \
 --js /tmp/__css.js \
 --js "${SOURCE_DIR}"/core/browserdetect.js \
 --js "${SOURCE_DIR}"/core/class.js \
 --js "${SOURCE_DIR}"/math/affinetransform2D.js \
 --js "${SOURCE_DIR}"/math/color.js \
 --js "${SOURCE_DIR}"/math/rectangle.js \
 --js "${SOURCE_DIR}"/math/bezier.js \
 --js "${SOURCE_DIR}"/math/point.js \
 --js "${SOURCE_DIR}"/math/quadtree.js \
 --js "${SOURCE_DIR}"/path/interpolator.js \
 --js "${SOURCE_DIR}"/behaviour/behaviour.js \
 --js "${SOURCE_DIR}"/model/debug.js \
 --js "${SOURCE_DIR}"/model/actorCSS.js \
 --js "${SOURCE_DIR}"/model/audio.js \
 --js "${SOURCE_DIR}"/model/extraActor.js \
 --js "${SOURCE_DIR}"/model/director.js \
 --js "${SOURCE_DIR}"/model/mouseevent.js \
 --js "${SOURCE_DIR}"/model/conpoundimage.js \
 --js "${SOURCE_DIR}"/model/imagepreloader.js \
 --js "${SOURCE_DIR}"/model/timer.js \
 --js "${SOURCE_DIR}"/model/sceneCSS.js \
 --js "${SOURCE_DIR}"/modules/modules.js \
 --js "${SOURCE_DIR}"/modules/Layout/layout.js \
 --js "${SOURCE_DIR}"/modules/CircleManager/PackedCircle.js \
 --js "${SOURCE_DIR}"/modules/CircleManager/PackedCircleManager.js \
 --js "${SOURCE_DIR}"/modules/LocalStorage/LocalStorage.js \
 --js "${SOURCE_DIR}"/modules/ImageUtil/ImageUtil.js \
 --js "${SOURCE_DIR}"/modules/Font/font.js \
 --js "${SOURCE_DIR}"/path/interpolatoractor.js \
 --js "${SOURCE_DIR}"/path/path.js \
 --js "${SOURCE_DIR}"/path/pathactor.js >> "${FILE_CAAT_CSS}"

#
# Distribute resulting compiled files
#
echo -e "\nCopying:"
while read LINE; do
  echo -e "\tCopying results to ${LINE}"
  cp ${FILE_CAAT} ${LINE} 
  cp ${FILE_CAAT_CSS} ${LINE} 
  cp ${FILE_CAAT_BOX2D} ${LINE} 
done < version.distribution

./version.compile.pack.sh

#
# Generating JSDoc.
#
echo -e "\nGenerating JSDoc"
./version.compile.doc.sh
