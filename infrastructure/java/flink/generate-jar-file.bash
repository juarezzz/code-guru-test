# Simple bash script for automating compiling and copying the script to the files folder
# Might have to install maven dependencies first (check README.md)
mvn clean compile && mvn clean package

cd target/

zip -r temp.zip polytag-analytics-1.0.jar

mv temp.zip ./../../../src/files/polytag-analytics-1.0.zip
