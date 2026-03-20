@ECHO OFF
WHERE mvn >NUL 2>NUL
IF %ERRORLEVEL% EQU 0 (
  mvn %*
  EXIT /B %ERRORLEVEL%
)
ECHO Maven is not installed. Install Maven or add the Maven Wrapper files.
EXIT /B 1
