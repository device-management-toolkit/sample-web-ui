sed -i \
-e "s|##RPS_SERVER##|$RPS_SERVER|g" \
-e "s|##MPS_SERVER##|$MPS_SERVER|g" \
-e "s|##VAULT_SERVER##|$VAULT_SERVER|g" \
-e "s|##AUTH_MODE_ENABLED##|$AUTH_MODE_ENABLED|g" \
 /usr/share/nginx/html/*.js