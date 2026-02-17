sed -i \
-e "s|##CONSOLE_SERVER_API##|$CONSOLE_SERVER_API|g" \
-e "s|##RPS_SERVER##|$RPS_SERVER|g" \
-e "s|##MPS_SERVER##|$MPS_SERVER|g" \
-e "s|##VAULT_SERVER##|$VAULT_SERVER|g" \
 /usr/share/nginx/html/*.js
