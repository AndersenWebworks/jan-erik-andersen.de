#!/bin/sh
# Rendert ein Konzeptbild:  sh run.sh kb-2-bau [--klein] [--samples=N]
cd "$(dirname "$0")"
"D:/Tools/blender/blender-5.2.3-windows-x64/blender.exe" -b --factory-startup --python konzept.py -- "$@" 2>&1 | grep -i -E "error|Traceback|File \"|saved" | grep -v Deprecat
