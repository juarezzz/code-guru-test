#!/bin/bash

# Current folder absolute path, as we will need it to CD back to it later
current_folder="$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )"

# Common suffix for NodeJS folders
paths_suffix="package.json"

# Script that finds all package.json files in the folder, except for node_modules
matching_folders="$(find . -name "$paths_suffix" -not -path "*/node_modules/*")"

# Iterating through all files in the dir
for folder in $matching_folders; do
  # Removing suffix from path variable
  folder_path=${folder%"$paths_suffix"}

  # Cd'ing into current folder
  cd $folder_path

  # Installing node dependencies
  yarn install --frozen-lockfile

  # Cd'ing back
  cd $current_folder
done
