#!/bin/bash
# extract version from manifest.json
VERSION=`cat manifest.json| jq .version`
VERSION=${VERSION//\"/}
ARCHIVE=release_$VERSION.zip
if [ -f $ARCHIVE ]; then
    rm $ARCHIVE
fi
zip release_$VERSION.zip autoscout24.js manifest.json background.js
shasum -a 256 $ARCHIVE
md5 $ARCHIVE