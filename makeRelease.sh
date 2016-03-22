#!/bin/bash
git describe --tags > .version
VERSION=`cat .version`
ZIPFILE=ldxIterationAnalyzer_$VERSION.zip

go build genReport.go
echo Generating $ZIPFILE
rm ../$ZIPFILE
zip -r ../$ZIPFILE app.js *.exe .version DragCSVHere.cmd css js template.html
