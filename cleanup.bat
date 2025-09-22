@echo off
setlocal enabledelayedexpansion

REM Folder root
set MIGRATIONS_DIR=prisma\migrations

echo [INFO] Mencari folder dengan nama *mod* di %MIGRATIONS_DIR%...

for /d %%F in ("%MIGRATIONS_DIR%\*mod*") do (
    echo [DEL] Menghapus folder: %%F
    rmdir /s /q "%%F"
)
rm -rf prisma\schema\mod_*.prisma

echo [OK] Selesai!
