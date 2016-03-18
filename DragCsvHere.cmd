@cd %~dp0 || @echo [ERROR] UNC path is not supported.
genReport %* && @echo OK || @echo [ERROR] Faild to generate.
pause
