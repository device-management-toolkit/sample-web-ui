#!/bin/bash
#*********************************************************************
# Copyright (c) Intel Corporation 2023
# SPDX-License-Identifier: Apache-2.0
#*********************************************************************

# Script to run Cypress with no-proxy settings and configurable URLs

# Default values (can be overridden)
DEFAULT_FQDN="10.44.76.50"
DEFAULT_VAULT_PORT="8200"
BASE_IMAGE="intel/oact-webui:latest"
CYPRESS_IMAGE_NAME="oact-webui-cypress"

# Parse command line arguments
CYPRESS_MODE=""
CUSTOM_FQDN=""
CUSTOM_VAULT_URL=""
CUSTOM_BASE_URL=""
USE_DOCKER=false
DOCKER_NETWORK=""
BUILD_IMAGE=false

show_usage() {
    echo "Usage: $0 [open|run] [options]"
    echo ""
    echo "Commands:"
    echo "  open    Opens Cypress Test Runner (local only)"
    echo "  run     Runs tests headlessly"
    echo ""
    echo "Options:"
    echo "  --fqdn <ip_or_domain>     Set FQDN and derive base/vault URLs (default: $DEFAULT_FQDN)"
    echo "  --base-url <url>          Set custom base URL (overrides FQDN-based URL)"
    echo "  --vault-url <url>         Set custom vault URL (overrides FQDN-based URL)"
    echo "  --docker                  Run Cypress in Docker container"
    echo "  --network <name>          Docker network to use (default: bridge)"
    echo "  --build                   Force rebuild of Cypress Docker image (with --docker)"
    echo ""
    echo "Examples:"
    echo "  # Local execution"
    echo "  $0 open --fqdn 192.168.1.100"
    echo "  $0 run --fqdn my-server.local"
    echo ""
    echo "  # Docker execution"
    echo "  $0 run --docker --fqdn 192.168.1.100"
    echo "  $0 run --docker --network openamtnetwork --fqdn 192.168.1.100"
    echo "  $0 run --docker --base-url https://custom-server/ --vault-url http://vault-server:8200"
}

build_docker_image() {
    echo "Building Cypress Docker image based on $BASE_IMAGE..."

    # Create Dockerfile if it doesn't exist
    if [[ ! -f "Dockerfile.cypress" ]]; then
        cat > Dockerfile.cypress << 'EOF'
# Dockerfile for Cypress using Debian-based Node.js image for better compatibility
FROM node:18-bullseye

# Build arguments for proxy settings
ARG HTTP_PROXY
ARG http_proxy
ARG HTTPS_PROXY
ARG https_proxy
ARG FTP_PROXY
ARG ftp_proxy
ARG NO_PROXY
ARG no_proxy

# Set proxy environment variables for build process
ENV HTTP_PROXY=$HTTP_PROXY
ENV http_proxy=$http_proxy
ENV HTTPS_PROXY=$HTTPS_PROXY
ENV https_proxy=$https_proxy
ENV FTP_PROXY=$FTP_PROXY
ENV ftp_proxy=$ftp_proxy
ENV NO_PROXY=$NO_PROXY
ENV no_proxy=$no_proxy

# Install Cypress dependencies for Debian
USER root
RUN apt-get update && apt-get install -y \
    libgtk2.0-0 \
    libgtk-3-0 \
    libgbm-dev \
    libnotify-dev \
    libnss3 \
    libxss1 \
    libasound2 \
    libxtst6 \
    xauth \
    xvfb \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files and install Cypress
COPY package*.json ./
RUN npm install cypress --save-dev

# Copy TypeScript and Cypress configuration files
COPY tsconfig*.json ./
COPY angular.json ./
COPY cypress.config.ts ./
COPY cypress/ ./cypress/
# Copy source files that Cypress tests depend on
COPY src/ ./src/

# Set environment variables for runtime
ENV CYPRESS_CACHE_FOLDER=/root/.cache/Cypress

# Install Cypress binary
RUN npx cypress install

# Clear build-time proxy variables and set runtime NO_PROXY
ENV HTTP_PROXY=
ENV http_proxy=
ENV HTTPS_PROXY=
ENV https_proxy=
ENV FTP_PROXY=
ENV ftp_proxy=
ENV NO_PROXY=localhost,127.0.0.1,0.0.0.0,::1
ENV no_proxy=localhost,127.0.0.1,0.0.0.0,::1

# Create entrypoint script for Cypress
RUN printf '#!/bin/bash\nset -e\n\n# Set no-proxy environment variables\nexport NO_PROXY="${NO_PROXY:-localhost,127.0.0.1,0.0.0.0,::1}"\nexport no_proxy="$NO_PROXY"\n\n# Force colored output\nexport FORCE_COLOR=1\nexport CI=false\n\necho "Docker Cypress Configuration:"\necho "  Base URL: ${CYPRESS_BASEURL:-https://localhost/}"\necho "  FQDN: ${CYPRESS_FQDN:-localhost}"\necho "  Vault URL: ${CYPRESS_VAULT_ADDRESS:-http://localhost:8200}"\necho "  Browser: Electron (headless)"\necho "  NO_PROXY: $NO_PROXY"\necho ""\n\n# Start Xvfb for headless execution\nXvfb :99 -ac -screen 0 1280x1024x16 &\nexport DISPLAY=:99\n\n# Run Cypress with Electron browser\nexec npx cypress "$@" --browser electron\n' > /cypress-entrypoint.sh && chmod +x /cypress-entrypoint.sh

ENTRYPOINT ["/cypress-entrypoint.sh"]
CMD ["run"]
EOF
        echo "Created Dockerfile.cypress"
    fi

    # Prepare Docker build command with proxy build args
    BUILD_CMD="docker build -f Dockerfile.cypress -t $CYPRESS_IMAGE_NAME"

    # Add proxy build arguments if they exist in environment
    if [[ -n "$HTTP_PROXY" ]]; then
        BUILD_CMD="$BUILD_CMD --build-arg HTTP_PROXY='$HTTP_PROXY'"
        BUILD_CMD="$BUILD_CMD --build-arg http_proxy='$HTTP_PROXY'"
        echo "  Build HTTP_PROXY: $HTTP_PROXY"
    fi

    if [[ -n "$HTTPS_PROXY" ]]; then
        BUILD_CMD="$BUILD_CMD --build-arg HTTPS_PROXY='$HTTPS_PROXY'"
        BUILD_CMD="$BUILD_CMD --build-arg https_proxy='$HTTPS_PROXY'"
        echo "  Build HTTPS_PROXY: $HTTPS_PROXY"
    fi

    if [[ -n "$FTP_PROXY" ]]; then
        BUILD_CMD="$BUILD_CMD --build-arg FTP_PROXY='$FTP_PROXY'"
        BUILD_CMD="$BUILD_CMD --build-arg ftp_proxy='$FTP_PROXY'"
        echo "  Build FTP_PROXY: $FTP_PROXY"
    fi

    if [[ -n "$NO_PROXY" ]]; then
        BUILD_CMD="$BUILD_CMD --build-arg NO_PROXY='$NO_PROXY'"
        BUILD_CMD="$BUILD_CMD --build-arg no_proxy='$NO_PROXY'"
        echo "  Build NO_PROXY: $NO_PROXY"
    fi

    # Add the build context
    BUILD_CMD="$BUILD_CMD ."

    echo "Docker build command: $BUILD_CMD"

    if ! eval $BUILD_CMD; then
        echo "Error: Failed to build Docker image"
        exit 1
    fi
    echo "Docker image built successfully: $CYPRESS_IMAGE_NAME"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        open|run)
            CYPRESS_MODE="$1"
            shift
            ;;
        --fqdn)
            CUSTOM_FQDN="$2"
            shift 2
            ;;
        --base-url)
            CUSTOM_BASE_URL="$2"
            shift 2
            ;;
        --vault-url)
            CUSTOM_VAULT_URL="$2"
            shift 2
            ;;
        --docker)
            USE_DOCKER=true
            shift
            ;;
        --network)
            DOCKER_NETWORK="$2"
            shift 2
            ;;
        --build)
            BUILD_IMAGE=true
            shift
            ;;
        -h|--help)
            show_usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate Docker mode with open command
if [[ "$USE_DOCKER" == true && "$CYPRESS_MODE" == "open" ]]; then
    echo "Error: Docker mode does not support 'open' command (interactive mode)"
    echo "Use 'run' command for Docker execution"
    exit 1
fi

# Set FQDN (use custom or default)
FQDN="${CUSTOM_FQDN:-$DEFAULT_FQDN}"

# Set URLs (use custom or derive from FQDN)
if [[ -n "$CUSTOM_BASE_URL" ]]; then
    BASE_URL="$CUSTOM_BASE_URL"
else
    BASE_URL="https://$FQDN/"
fi

if [[ -n "$CUSTOM_VAULT_URL" ]]; then
    VAULT_URL="$CUSTOM_VAULT_URL"
else
    VAULT_URL="http://$FQDN:$DEFAULT_VAULT_PORT"
fi

# Default network if not specified and using Docker
if [[ "$USE_DOCKER" == true && -z "$DOCKER_NETWORK" ]]; then
    DOCKER_NETWORK="bridge"
fi

echo "Configuration:"
echo "  FQDN: $FQDN"
echo "  Base URL: $BASE_URL"
echo "  Vault URL: $VAULT_URL"
echo "  Execution mode: $([ "$USE_DOCKER" == true ] && echo "Docker" || echo "Local")"
if [[ "$USE_DOCKER" == true ]]; then
    echo "  Docker Network: $DOCKER_NETWORK"
fi

if [[ "$USE_DOCKER" == true ]]; then
    # Docker execution
    echo "Running Cypress in Docker container..."

    # Check if Docker image exists or if rebuild is requested
    if [[ "$BUILD_IMAGE" == true ]] || ! docker image inspect $CYPRESS_IMAGE_NAME >/dev/null 2>&1; then
        build_docker_image
    fi

    # Prepare Docker run command
    DOCKER_CMD="docker run --rm -it"
    DOCKER_CMD="$DOCKER_CMD --network $DOCKER_NETWORK"

    # Add Cypress environment variables
    DOCKER_CMD="$DOCKER_CMD -e CYPRESS_BASEURL='$BASE_URL'"
    DOCKER_CMD="$DOCKER_CMD -e CYPRESS_FQDN='$FQDN'"
    DOCKER_CMD="$DOCKER_CMD -e CYPRESS_VAULT_ADDRESS='$VAULT_URL'"
    DOCKER_CMD="$DOCKER_CMD -e NO_PROXY='localhost,127.0.0.1,0.0.0.0,::1,$FQDN,.local,.mlopshub.com'"

    # Add environment variables for colored output
    DOCKER_CMD="$DOCKER_CMD -e FORCE_COLOR=1"
    DOCKER_CMD="$DOCKER_CMD -e CI=false"
    DOCKER_CMD="$DOCKER_CMD -e TERM=xterm-256color"

    # Pass proxy environment variables to Docker if they exist in host environment
    if [[ -n "$HTTP_PROXY" ]]; then
        DOCKER_CMD="$DOCKER_CMD -e HTTP_PROXY='$HTTP_PROXY'"
        DOCKER_CMD="$DOCKER_CMD -e http_proxy='$HTTP_PROXY'"
        echo "  HTTP_PROXY: $HTTP_PROXY"
    fi

    if [[ -n "$HTTPS_PROXY" ]]; then
        DOCKER_CMD="$DOCKER_CMD -e HTTPS_PROXY='$HTTPS_PROXY'"
        DOCKER_CMD="$DOCKER_CMD -e https_proxy='$HTTPS_PROXY'"
        echo "  HTTPS_PROXY: $HTTPS_PROXY"
    fi

    if [[ -n "$FTP_PROXY" ]]; then
        DOCKER_CMD="$DOCKER_CMD -e FTP_PROXY='$FTP_PROXY'"
        DOCKER_CMD="$DOCKER_CMD -e ftp_proxy='$FTP_PROXY'"
        echo "  FTP_PROXY: $FTP_PROXY"
    fi

    # Mount results directories
    DOCKER_CMD="$DOCKER_CMD -v $(pwd)/cypress/videos:/app/cypress/videos"
    DOCKER_CMD="$DOCKER_CMD -v $(pwd)/cypress/screenshots:/app/cypress/screenshots"
    DOCKER_CMD="$DOCKER_CMD -v $(pwd):/app/results"

    # Add image and command
    DOCKER_CMD="$DOCKER_CMD $CYPRESS_IMAGE_NAME run"

    echo "Executing Docker command..."
    eval $DOCKER_CMD

    echo "Cypress execution completed. Check cypress/videos and cypress/screenshots for results."

else
    # Local execution - only set NO_PROXY, don't inherit proxy settings
    echo "Running Cypress locally..."

    # Clear any existing proxy environment variables for local execution
    unset HTTP_PROXY HTTPS_PROXY FTP_PROXY http_proxy https_proxy ftp_proxy

    # Set no-proxy environment variables
    export NO_PROXY="localhost,127.0.0.1,0.0.0.0,::1,$FQDN,.local,.mlopshub.com"
    export no_proxy="$NO_PROXY"

    # Set Cypress environment variables to override config
    export CYPRESS_BASEURL="$BASE_URL"
    export CYPRESS_FQDN="$FQDN"
    export CYPRESS_VAULT_ADDRESS="$VAULT_URL"

    echo "  NO_PROXY: $NO_PROXY"
    echo "  Proxy variables cleared for local execution"

    # Run Cypress with the environment
    if [ "$CYPRESS_MODE" = "open" ]; then
        echo "Opening Cypress with custom configuration..."
        npx cypress open
    elif [ "$CYPRESS_MODE" = "run" ]; then
        echo "Running Cypress tests with custom configuration..."
        npx cypress run
    else
        echo "Error: Must specify 'open' or 'run' command"
        echo ""
        show_usage
        exit 1
    fi
fi