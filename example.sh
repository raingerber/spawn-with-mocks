#!/bin/sh

# this command will fail, unless it's
# run with a mock for the curl command
curl "<example-url>" | grep F
