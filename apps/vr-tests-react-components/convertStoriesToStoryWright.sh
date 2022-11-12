#!/usr/bin/env bash
set -x
find ./src -type f | xargs sed -i "s/import.*Screener.*Steps.*screener'/import { StoryWright, Steps } from 'storywright'/g"
find ./src -type f | xargs sed -i "s/import.*Screener.*Step.*screener'/import { StoryWright, Step } from 'storywright'/g"
find ./src -type f | xargs sed -i "s/import.*Screener from .*screener'/import { StoryWright, Steps } from 'storywright'/g"
find ./src/stories/Button/utils.ts -type f | xargs sed -i "s/import Screener from.*screener'/import { Steps } from 'storywright'/g"
find ./src -type f | xargs sed -i "s/Screener.Steps/Steps/g"
find ./src -type f | xargs sed -i "s/<Screener/<StoryWright/g"
find ./src -type f | xargs sed -i "s/Screener>/StoryWright>/g"
