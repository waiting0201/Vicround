#!/usr/bin/env bash
#
# 把 mockup/ 與 reference/ 快照到「只推 NAS」的 assets 分支。
#
# 這兩個目錄在 master 上是 .gitignore 的，所以 GitHub 永遠拿不到；
# 本腳本用獨立的 index 直接產生 commit，不會動到你的工作目錄、
# 不會切換分支、也不會把素材帶進 master 的歷史。
#
# 用法：./scripts/sync-nas-assets.sh
#
set -euo pipefail

REMOTE="Remote_NAS"
BRANCH="assets"
ASSET_PATHS=(mockup reference)

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# ── 前置檢查 ──────────────────────────────────────────────────────────
NAS_URL="$(git remote get-url "$REMOTE" 2>/dev/null || true)"
if [[ -z "$NAS_URL" ]]; then
  echo "✗ 找不到 remote '$REMOTE'" >&2; exit 1
fi
if [[ "$NAS_URL" == /* && ! -d "$NAS_URL" ]]; then
  echo "✗ NAS 未掛載：$NAS_URL" >&2
  echo "  請先在 Finder 掛上 /Volumes/public 再重跑。" >&2
  exit 1
fi

PRESENT=()
for p in "${ASSET_PATHS[@]}"; do
  [[ -d "$p" ]] && PRESENT+=("$p")
done
if [[ ${#PRESENT[@]} -eq 0 ]]; then
  echo "✗ ${ASSET_PATHS[*]} 都不存在，沒有東西可同步" >&2; exit 1
fi

# ── 用獨立 index 建立 tree（-f 蓋過 .gitignore）────────────────────────
GIT_INDEX_FILE="$REPO_ROOT/.git/assets.index"
export GIT_INDEX_FILE
rm -f "$GIT_INDEX_FILE"

git add -f -- "${PRESENT[@]}"
git rm --cached -rq --ignore-unmatch -- ':(glob)**/.DS_Store'

TREE="$(git write-tree)"

# ── 沿用既有 assets 歷史（本機無 ref 時回頭抓 NAS 上的）────────────────
PARENT="$(git rev-parse --verify -q "refs/heads/$BRANCH" || true)"
if [[ -z "$PARENT" ]]; then
  git fetch -q "$REMOTE" "$BRANCH:refs/heads/$BRANCH" 2>/dev/null || true
  PARENT="$(git rev-parse --verify -q "refs/heads/$BRANCH" || true)"
fi

if [[ -n "$PARENT" ]] && [[ "$(git rev-parse "$PARENT^{tree}")" == "$TREE" ]]; then
  echo "✓ 素材無變動，NAS 已是最新（$BRANCH @ ${PARENT:0:8}）"
  exit 0
fi

MSG="assets: snapshot $(date '+%Y-%m-%d %H:%M') (${PRESENT[*]})"
if [[ -n "$PARENT" ]]; then
  COMMIT="$(git commit-tree "$TREE" -p "$PARENT" -m "$MSG")"
else
  COMMIT="$(git commit-tree "$TREE" -m "$MSG")"
fi

git update-ref "refs/heads/$BRANCH" "$COMMIT" ${PARENT:+"$PARENT"}

# ── 只推 NAS，絕不推 GitHub ───────────────────────────────────────────
git push "$REMOTE" "$BRANCH:$BRANCH"

echo "✓ 已推送 ${BRANCH} → ${REMOTE}（${COMMIT:0:8}）"
git ls-tree -r --name-only "$COMMIT" | wc -l | xargs echo "  檔案數："
