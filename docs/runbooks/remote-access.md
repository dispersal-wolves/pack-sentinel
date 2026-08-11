# Remote access

Set a long random API token, bind only to a private interface, and place a TLS reverse proxy in front of the service. Restrict the port at the network layer. Confirm unauthorized requests receive `401` before allowing another machine to connect.
