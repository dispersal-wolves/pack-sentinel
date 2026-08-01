# Linux

Linux is the primary service platform. Use the systemd unit under `packaging`, create an unprivileged `pack-sentinel` account, and grant collector-specific permissions rather than running the service as root.
