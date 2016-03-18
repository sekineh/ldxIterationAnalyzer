REM read from file
set /p VERSION=<version
REM remove spaces

go build genReport.go
set ZIPFILE=ldxIterationAnalyzer_%VERSION%.zip
@echo Generating %ZIPFILE%
zip -r ..\%ZIPFILE% app.js *.exe version DragCSVHere.cmd css js template.html
