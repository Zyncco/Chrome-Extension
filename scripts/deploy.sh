#!/bin/bash

if [ "$TRAVIS_BRANCH" == "amir" ] && [ "$TRAVIS_PULL_REQUEST" == "false" ];
then
	npm install -g yarn
	npm install -g chrome-webstore-upload-cli

	sed -i 's/"version": "\([0-9]\+\.[0-9]\+\.\)[0-9]\+",/"version": "\1'"$TRAVIS_BUILD_NUMBER"'",/' manifest.json

	webstore upload --extension-id $EXTENSION_ID --client-id $CLIENT_ID --client-secret $CLIENT_SECRET --refresh-token $REFRESH_TOKEN --auto-publish
fi
