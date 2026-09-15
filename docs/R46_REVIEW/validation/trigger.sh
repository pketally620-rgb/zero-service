set -euo pipefail
umask 077
root=/home/zero-web-eng/work/r46-integration
r2=/home/zero-web-eng/work/r2-backup-r2
/bin/bash "$r2/schedule.sh" backup
systemctl --user show zero-r2-backup.service -p Result -p ExecMainStatus -p ExecMainStartTimestamp -p ExecMainExitTimestamp -p InvocationID > "$root/SCHEDULER.txt"
cat "$root/SCHEDULER.txt"
cp "$r2/status.json" "$root/BACKUP.json"
cat "$root/BACKUP.json"
/bin/bash "$r2/schedule.sh" monitor
systemctl --user show zero-r2-monitor.service -p Result -p ExecMainStatus
# Verify same-source same-day duplicate start is bounded, without resetting status.
/bin/bash "$r2/schedule.sh" backup
journalctl --user -u zero-r2-backup.service -n 8 --no-pager
