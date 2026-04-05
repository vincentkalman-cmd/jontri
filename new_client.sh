#!/bin/bash
# Quick setup for a new client config
# Usage: ./new_client.sh <client-folder-name>
# Example: ./new_client.sh denver-restaurants

if [ -z "$1" ]; then
    echo "Usage: ./new_client.sh <client-folder-name>"
    echo "Example: ./new_client.sh denver-restaurants"
    exit 1
fi

CLIENT_NAME="$1"
CLIENT_DIR="clients/$CLIENT_NAME"
TEMPLATE="templates/client_config.template.json"

if [ -d "$CLIENT_DIR" ]; then
    echo "Error: Client '$CLIENT_NAME' already exists at $CLIENT_DIR"
    exit 1
fi

if [ ! -f "$TEMPLATE" ]; then
    echo "Error: Template not found at $TEMPLATE"
    exit 1
fi

mkdir -p "$CLIENT_DIR"
cp "$TEMPLATE" "$CLIENT_DIR/config.json"

echo "Created new client config: $CLIENT_DIR/config.json"
echo "Next steps:"
echo "  1. Open $CLIENT_DIR/config.json"
echo "  2. Fill in the client details, ICP, and email settings"
echo "  3. Run: cd prospector && python main.py --client $CLIENT_NAME"
