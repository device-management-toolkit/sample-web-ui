sed -i \
-e "s|##RPS_SERVER##|$RPS_SERVER|g" \
-e "s|##MPS_SERVER##|$MPS_SERVER|g" \
-e "s|##MPSXAPIKEY##|$MPSXAPIKEY|g" \
-e "s|##RPSXAPIKEY##|$RPSXAPIKEY|g" \
-e "s|##AUTH_MODE_ENABLED##|$AUTH_MODE_ENABLED|g" \
 /usr/share/nginx/html/*.js