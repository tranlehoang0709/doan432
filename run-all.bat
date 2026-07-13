@echo off
title Mess App - Start All
echo ========================================
echo   Starting Backend and Frontend...
echo ========================================
start cmd /k "run-backend.bat"
start cmd /k "run-frontend.bat"
echo Done! Both servers are starting in separate windows.
timeout /t 3
