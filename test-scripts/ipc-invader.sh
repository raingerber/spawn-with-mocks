#!/bin/sh

# Piping "invalid" data to the IPC channel

echo '{}' >&3
echo '{"id":"invalid_id_format"}' >&3

echo "Hello World"
