
#!/bin/bash
set -e

# Unset empty proxy variables
for var in HTTP_PROXY HTTPS_PROXY NO_PROXY http_proxy https_proxy no_proxy; do
  eval v="\${$var}"
  if [ -z "$v" ]; then unset $var; fi
done

# Configure apt proxy if proxies are present
if [ -n "$HTTP_PROXY" ] || [ -n "$http_proxy" ] || [ -n "$HTTPS_PROXY" ] || [ -n "$https_proxy" ]; then
  echo "Configuring apt to use proxy..."
  sudo mkdir -p /etc/apt/apt.conf.d
  sudo tee /etc/apt/apt.conf.d/99proxy > /dev/null <<EOF
Acquire::http::Proxy \"${HTTP_PROXY:-${http_proxy:-}}\";
Acquire::https::Proxy \"${HTTPS_PROXY:-${https_proxy:-}}\";
EOF
fi

npm install


sudo apt-get update
sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
npm install
npx cypress install
