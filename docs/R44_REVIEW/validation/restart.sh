set -euo pipefail
umask 077
root=/home/zero-web-eng/work/r44-integration
export PATH=/home/zero-web-eng/work/private-runtime-r1/node-v24.19.0-linux-x64/bin:$PATH
test "$(cat "$root/invocation-before.txt")" = "$(systemctl --user show zero-web-r44 -p InvocationID --value)"
echo DISCONNECT_SURVIVAL=PASS
old=$(systemctl --user show zero-web-r44 -p MainPID --value)
systemctl --user restart zero-web-r44 zero-web-r44-smoke
curl -fsS --retry 4 --retry-connrefused --retry-delay 1 --max-time 5 -o /dev/null http://127.0.0.1:4198/api/catalog
curl -fsS --retry 4 --retry-connrefused --retry-delay 1 --max-time 5 -o /dev/null http://127.0.0.1:4199/api/catalog
test "$old" != "$(systemctl --user show zero-web-r44 -p MainPID --value)"
node --input-type=module <<'JS'
import {DatabaseSync} from 'node:sqlite';import {readFileSync,writeFileSync,statSync} from 'node:fs';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const root='/home/zero-web-eng/work/r44-integration',hash=s=>createHash('sha256').update(s).digest('hex'),prep=JSON.parse(readFileSync(root+'/PREPARATION.json')),smoke=JSON.parse(readFileSync(root+'/SMOKE.json'));
const results={};for(const [name,expected] of [['launch',prep.launchStateHash],['smoke',smoke.stateHash]]){const db=new DatabaseSync(root+'/'+name+'.sqlite',{readOnly:true}),json=db.prepare('SELECT json FROM state WHERE id=1').get().json;assert.equal(hash(json),expected);assert.equal(db.prepare('PRAGMA integrity_check').get().integrity_check,'ok');results[name]={stateHash:hash(json),schema:JSON.parse(json).schema,vehicles:JSON.parse(json).vehicles.length,bookings:JSON.parse(json).bookings.length,mode:(statSync(root+'/'+name+'.sqlite').mode&0o777).toString(8)};db.close();}
writeFileSync(root+'/RESTART.json',JSON.stringify({disconnectSurvival:true,restart:'PASS',...results}),{mode:0o600});console.log(JSON.stringify(results));
JS
for n in 1 2 3; do
systemctl --user show zero-web-r44 -p MemoryCurrent -p CPUUsageNSec -p NRestarts -p MainPID
curl -fsS --max-time 5 -o /dev/null -w 'CATALOG_HTTP=%{http_code} SECONDS=%{time_total}\n' http://127.0.0.1:4198/api/catalog
free -m
sleep 10
done
ss -ltn
for port in 4198 4199; do
if curl --noproxy '*' -fsS --connect-timeout 2 --max-time 3 -o /dev/null "http://152.42.233.152:$port/"; then echo PUBLIC_EXPOSURE; exit 1; else echo PUBLIC_ADDRESS_REFUSED=$port; fi
done
