#!/bin/sh
# Rendert ein Konzeptbild:  sh run.sh kb-2-bau [--klein] [--samples=N]
cd "$(dirname "$0")"
T=$(( ${NUMBER_OF_PROCESSORS:-16} * 3 / 4 ))
"D:/Tools/blender/blender-5.2.3-windows-x64/blender.exe" -t "$T" -b --factory-startup --python konzept3.py -- "$@" 2>&1 | grep -i -E "error|Traceback|File \"|saved" | grep -v Deprecat
