# Multiple Device Remote SSH RPC Execution Configuration

This configuration enables the RPC activation tests to run across multiple AMT devices simultaneously via SSH instead of using local Docker containers or Windows executables.

## Configuration File: `cypress/fixtures/ssh-config.json`

```json
{
  "enabled": false,
  "devices": [
    {
      "name": "device1",
      "host": "192.168.1.100",
      "username": "amt-user",
      "keyPath": "~/.ssh/id_rsa",
      "port": 22,
      "enabled": true
    },
    {
      "name": "device2",
      "host": "192.168.1.101",
      "username": "amt-user",
      "keyPath": "~/.ssh/id_rsa",
      "port": 22,
      "enabled": true
    }
  ]
}
```

## Setup Instructions

### 1. Multiple Device Requirements
- Multiple Intel AMT-enabled machines with `/dev/mei0` device access
- Each device running Linux operating system
- SSH server running on all target devices
- Network connectivity from test runner to all devices
- `wget` and `tar` utilities available on all devices

### 2. SSH Authentication Setup
```bash
# Generate SSH key pair (if not exists)
ssh-keygen -t rsa -b 4096 -C "amt-testing"

# Copy public key to all remote hosts
ssh-copy-id -i ~/.ssh/id_rsa.pub amt-user@192.168.1.100
ssh-copy-id -i ~/.ssh/id_rsa.pub amt-user@192.168.1.101
ssh-copy-id -i ~/.ssh/id_rsa.pub amt-user@192.168.1.102

# Test SSH connections
ssh amt-user@192.168.1.100 "echo 'Device 1 SSH OK'"
ssh amt-user@192.168.1.101 "echo 'Device 2 SSH OK'"
ssh amt-user@192.168.1.102 "echo 'Device 3 SSH OK'"
```

### 3. Enable Multiple Device Execution
1. Edit `cypress/fixtures/ssh-config.json`
2. Set global `"enabled": true`
3. Configure each device in the `devices` array
4. Set individual device `"enabled": true/false` as needed
5. Run tests with `ISOLATE=N`

## How It Works

When `ISOLATE=N` and SSH config is enabled:

1. **Setup Phase**: Downloads and extracts RPC executable to `/tmp` on all enabled devices
2. **Discovery Phase**: Collects AMT info from all enabled devices
3. **Activation Phase**: Activates AMT on all detected devices sequentially
4. **Validation Phase**: Validates first device via web UI (to avoid conflicts)
5. **Deactivation Phase**: Deactivates all devices

### Test Execution Flow
```
Device 1: Info → Activate → Validate UI → Deactivate
Device 2: Info → Activate →              Deactivate
Device 3: Info → Activate →              Deactivate
```

## Device Management

### Individual Device Control
```json
{
  "name": "device3",
  "host": "192.168.1.102",
  "enabled": false  // Skip this device
}
```

### Selective Testing
- Set `"enabled": false` on devices to skip them
- Tests will only run on devices with `"enabled": true`
- Devices without AMT hardware are automatically skipped

## Fallback Behavior

If SSH config file doesn't exist or `"enabled": false`, tests fall back to single device local execution:
- Docker execution on Linux: `docker run --device=/dev/mei0 rpc-image command`
- Windows executable: `rpc.exe command`

## Performance Considerations

### Parallel vs Sequential Execution
- **Device Setup**: Parallel (all devices setup simultaneously)
- **AMT Discovery**: Parallel (all devices queried simultaneously)
- **Activation**: Sequential (one device at a time to avoid conflicts)
- **UI Validation**: First device only (to prevent UI conflicts)
- **Deactivation**: Sequential (one device at a time)

### Timeouts
- **Setup timeout**: 60 seconds per device
- **Command timeout**: 240 seconds per command
- **Total test time**: Scales with number of devices

## Troubleshooting

### Multiple Device Issues
```bash
# Test all SSH connections
for host in 192.168.1.100 192.168.1.101 192.168.1.102; do
  echo "Testing $host..."
  ssh -o ConnectTimeout=5 amt-user@$host "echo 'OK: $host'" || echo "FAIL: $host"
done

# Check AMT devices on all hosts
for host in 192.168.1.100 192.168.1.101; do
  echo "Checking AMT on $host..."
  ssh amt-user@$host "ls -la /dev/mei*"
done
```

### Network Conflicts
- Ensure all devices can reach activation server independently
- Check for IP address conflicts
- Verify firewall rules on all devices
- Test network connectivity between devices and activation server

### Load Balancing
- Consider staggered activation timing for large device counts
- Monitor activation server load with multiple concurrent devices
- Use device grouping for very large deployments

## Security Considerations

- Use SSH key-based authentication for all devices
- Restrict SSH access with `authorized_keys` options on all hosts
- Consider using dedicated test user accounts on all devices
- Monitor SSH access logs across all devices
- Use private network segments for AMT testing when possible
- Implement device access controls and monitoring