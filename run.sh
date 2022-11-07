#!/bin/sh

TEST_FOLDER=$1
TESTER_NAME=${TESTER}
BUILD=${BUILD}
ENV=${ENV}
BUILD_URL=${BUILD_URL} # for mochawesome image ctx
WHERE=${WHERE} # for reportParser.js

if [ -z "$TEST_FOLDER" ] || [ -z "$TESTER_NAME" ] || [ -z "$ENV" ]; then
    echo "Usage: TESTER=<my_tester_name> ENV=<environment_name> sh run.sh <test_folder>" 
    echo "Example: TESTER=reyhan ENV=tribe-newhope sh run.sh test/customer"
    exit 1;
fi

user_check=$(node scripts/checkTesterName.js)

if [ "$user_check" = "NOT_EXIST" ]; then
    echo "Tester name does not exist. Please contact your administrator."
    exit 1;
fi

if [ "$TESTER" = "jenkins" ] && [ -z "$BUILD_URL" ]; then
    echo "Missing BUILD_URL environment variable"
    exit 1;
fi

# Run test
npm run test -- "$TEST_FOLDER" || EXIT_STATUS=$?; 

# Post test reporting
node scripts/reportParser.js

if [ -z "$EXIT_STATUS" ]; 
then 
    exit 0; 
else 
    exit $EXIT_STATUS; 
fi