sed -i \
-e "s|##RPS_SERVER##|$RPS_SERVER|g" \
-e "s|##MPS_SERVER##|$MPS_SERVER|g" \
-e "s|##CONSOLE_SERVER_API##|$CONSOLE_SERVER_API|g" \
-e "s|##VAULT_SERVER##|$VAULT_SERVER|g" \
-e "s|##AUTH_MODE_ENABLED##|$AUTH_MODE_ENABLED|g" \
-e "s|##CLIENTID##|$CLIENTID|g" \
-e "s|##ISSUER##|$ISSUER|g" \
-e "s|##REDIRECTURI##|$REDIRECTURI|g" \
-e "s|##SCOPE##|$SCOPE|g" \
 /usr/share/nginx/html/*.js
