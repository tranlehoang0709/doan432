@echo off
title Mess App - Backend FastAPI
echo ========================================
echo   Starting Backend FastAPI Server...
echo ========================================
cd backend
call venv\Scripts\activate.bat
uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
