#!/bin/bash

npm install -g chrome-webstore-upload-cli

sed -i 's/"version": "\([0-9]\+\.[0-9]\+\.\)[0-9]\+",/"version": "\1'"$TRAVIS_BUILD_NUMBER"'",/' manifest.json

webstore upload --extension-id $EXTENSION_ID --client-id $CLIENT_ID --client-secret $CLIENT_SECRET --refresh-token $REFRESH_TOKEN --source "./packages/zync-1.0.0-chrome.zip" --auto-publish
