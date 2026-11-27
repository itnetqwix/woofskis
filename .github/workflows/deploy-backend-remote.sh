set -eu
export HOME=/root
export HUSKY=0
SHA=__SHA__
APP=/var/www/woofskis/app
test -f "$APP/.env"
WORK=$(mktemp -d /tmp/woofskis-deploy.XXXXXX)
trap 'rm -rf "$WORK"' EXIT
git clone --depth 1 https://github.com/itnetqwix/woofskis.git "$WORK"
git -C "$WORK" fetch --depth 1 origin "$SHA"
git -C "$WORK" checkout --detach FETCH_HEAD
test "$(git -C "$WORK" rev-parse HEAD)" = "$SHA"
cd "$WORK/backend"
npm ci
npm run build
grep -F '10 * 60 * 1000' dist/services/contest-transition.service.js
rsync -a --delete "$WORK/backend/node_modules/" "$APP/node_modules/"
rsync -a --delete "$WORK/backend/dist/" "$APP/dist/"
rsync -a \
  --exclude '.env' \
  --exclude '.env*' \
  --exclude node_modules \
  --exclude dist \
  --exclude storage \
  --exclude uploads \
  "$WORK/backend/" "$APP/"
test -f "$APP/.env"
test -d "$APP/storage"
grep -F '10 * 60 * 1000' "$APP/dist/services/contest-transition.service.js"
chown -R ubuntu:ubuntu "$APP"
sudo -u ubuntu -H pm2 restart woofskis-api
sudo -u ubuntu -H pm2 save
for i in $(seq 1 12); do
  if curl --fail --silent http://127.0.0.1:5000/api/v1/health; then
    echo HEALTH_CHECK_PASSED
    exit 0
  fi
  sleep 5
done
echo HEALTH_CHECK_FAILED
sudo -u ubuntu -H pm2 logs woofskis-api --lines 40 --nostream || true
exit 1
