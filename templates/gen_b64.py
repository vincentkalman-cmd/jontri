import base64, sys, os
# This script decodes and runs the real generator from base64
b64 = sys.stdin.read().strip()
code = base64.b64decode(b64).decode('utf-8')
exec(code)
