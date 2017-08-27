#!/bin/bash

sed -i 's/"version": "\([0-9]\+\.[0-9]\+\.\)[0-9]\+",/"version": "\1'"$TRAVIS_BUILD_NUMBER"'",/' app/manifest.json
