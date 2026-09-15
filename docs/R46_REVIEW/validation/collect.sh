set -euo pipefail
root=/home/zero-web-eng/work/r46-integration
journalctl --user -u zero-r2-backup.service --since '2026-09-15 12:08:00 UTC' --no-pager > "$root/SCHEDULER_JOURNAL.txt"
/home/zero-web-eng/work/private-runtime-r1/node-v24.19.0-linux-x64/bin/node --input-type=module <<'JS'
import {readFileSync} from 'node:fs';const root='/home/zero-web-eng/work/r46-integration',result={};for(const name of ['TEST_RESULTS.txt','R2_TEST_RESULTS.txt','SCHEDULER_JOURNAL.txt','BACKUP.json','FINAL.json'])result[name]=readFileSync(root+'/'+name,'utf8');console.log(JSON.stringify(result));
JS
