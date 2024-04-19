
# Array of port numbers
ports=(7001 7002 7003 7004 7005)

# Loop through each port number
for port in "${ports[@]}"; do
    # Find PID(s) using the port
    pids=$(lsof -t -i:$port)

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