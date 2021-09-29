#!/usr/bin/env bash

set -e

LIST=`cat << EOL
https://code.angularjs.org/1.6.10/angular.min.js;vendors/angularjs/angular.js
https://code.angularjs.org/1.6.10/angular-route.min.js;vendors/angularjs/angular-route.js
https://code.angularjs.org/1.6.10/angular-sanitize.min.js;vendors/angularjs/angular-sanitize.js
https://code.jquery.com/jquery-3.6.0.min.js;vendors/jquery/jquery-latest.js
https://cdnjs.cloudflare.com/ajax/libs/less.js/2.7.3/less.min.js;vendors/less/less-latest.js
https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js;vendors/lodash/lodash-latest.js
https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js;vendors/momentjs/moment-latest.js
EOL`

for l in $LIST; do
  URL=$(echo "$l" | cut -d";" -f1)
  DEST=$(echo "$l" | cut -d";" -f2)
  echo ""
  echo "Downloading ${URL}..."
  wget --quiet "${URL}" -O "./src/${DEST}" && echo "${DEST} updated"
done

exit 0
