#!/bin/bash

# Array of port numbers
ports=(8001 8002 8003 8004 8005)

# Loop through each port number
for port in "${ports[@]}"; do
    # Find PID(s) using the port
    pids=$(netstat -nlp | grep ":$port " | awk '{print $7}' | awk -F'/' '{print $1}')

    # Check if any PID(s) were found
    if [ -n "$pids" ]; then
        echo "Processes using port $port: $pids"
        
        # Kill the processes using SIGKILL
        kill -9 $pids
        
        echo "Processes killed."
    else
        echo "No processes found using port $port."
    fi
done