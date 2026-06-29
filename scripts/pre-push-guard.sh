#!/usr/bin/env bash
set -euo pipefail

remote_name="${1:-origin}"
remote_url="${2:-}"

while read -r local_ref local_sha remote_ref remote_sha; do
  if [[ "$remote_ref" == "refs/heads/main" && "${DADBUDS_ALLOW_PROD_PUSH:-}" != "1" ]]; then
    cat >&2 <<MSG

DadBuds production push blocked.

Remote: ${remote_name} ${remote_url}
Target: ${remote_ref}

Run validation locally, get explicit approval, then push with:

  DADBUDS_ALLOW_PROD_PUSH=1 git push ${remote_name} main

MSG
    exit 1
  fi

  if [[ "$remote_ref" == "refs/heads/master" && "${DADBUDS_ALLOW_PROD_PUSH:-}" != "1" ]]; then
    cat >&2 <<MSG

DadBuds production push blocked.

Remote: ${remote_name} ${remote_url}
Target: ${remote_ref}

Run validation locally, get explicit approval, then push with:

  DADBUDS_ALLOW_PROD_PUSH=1 git push ${remote_name} master

MSG
    exit 1
  fi
done
