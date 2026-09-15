set -euo pipefail
umask 077
root=/home/zero-web-eng/work/r44-integration
node=/home/zero-web-eng/work/private-runtime-r1/node-v24.19.0-linux-x64/bin/node
for port in 4198 4199; do
 if ss -ltn | grep -q ":$port "; then echo PORT_IN_USE; exit 1; fi
done
systemd-run --user --unit=zero-web-r44 --property=Restart=on-failure --property=UMask=0077 --property=WorkingDirectory="$root" "$node" "$root/serve.mjs" 4198
systemd-run --user --unit=zero-web-r44-smoke --property=Restart=on-failure --property=UMask=0077 --property=WorkingDirectory="$root" "$node" "$root/serve.mjs" 4199
curl -fsS --retry 4 --retry-connrefused --retry-delay 1 --max-time 5 -o /dev/null http://127.0.0.1:4198/api/catalog
curl -fsS --retry 4 --retry-connrefused --retry-delay 1 --max-time 5 -o /dev/null http://127.0.0.1:4199/api/catalog
systemctl --user show zero-web-r44 -p InvocationID --value > "$root/invocation-before.txt"
ss -ltn
