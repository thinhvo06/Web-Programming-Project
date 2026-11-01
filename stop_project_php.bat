@echo off
title Dung TDTU Note App Services
chcp 65001 > nul
echo Dang dung cac dich vu cua project...
taskkill /F /IM mariadbd.exe 2>nul
taskkill /F /IM php.exe 2>nul
echo Da dung MariaDB va PHP.
pause
