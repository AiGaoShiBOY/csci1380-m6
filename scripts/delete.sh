#!/bin/bash

# Array of port numbers
ports=(7000 7001 7002 7003 7004 7005 7006 7007 7008 7009 7010
# 7011 7012 7013 7014 7015 7016 7017 7018 7019 7020
# 7021 7022 7023 7024 7025 7026 7027 7028 7029 7030
)

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

rm -r store/ && rm log.txt && mkdir store