#!/bin/bash

username="admin"
password="admin"
address="localhost"
port="9080"

# http://208.73.233.32:9080/api/v1/DashUsers/authenticate'
token=$(curl -s -X POST -H "Accept: application/json" -H "Content-Type: application/json" --data "{\"username\":\"${username}\",\"password\":\"${password}\"}" ${address}:${port}/api/v1/DashUsers/authenticate | jq -r '.id')

# Retrieving Users
# curl -i -X "GET" "http://${address}:${port}/api/v1/DashUsers?access_token=${token}" -H "accept: application/json" -H "Authorization: Bearer ${token}"


curl -i -X "GET" "http://${address}:${port}/api/v1/CallLogs/count_logs?access_token=${token}" -H "accept: application/json" -H "Authorization: Bearer ${token}"
