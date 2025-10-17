// Frontend Example for Social WebSocket Connection Status
// This is a simple JavaScript client to test the social WebSocket functionality

class SocialWebSocketClient {
    constructor(wsUrl, token) {
        this.wsUrl = wsUrl;
        this.token = token;
        this.socket = null;
        this.isAuthenticated = false;
        this.userId = null;
        this.friends = [];

        // Event handlers
        this.onAuthSuccess = null;
        this.onFriendsListReceived = null;
        this.onFriendConnectionStatus = null;
        this.onError = null;
    }

    connect() {
        console.log('Connecting to WebSocket:', this.wsUrl);
        this.socket = new WebSocket(this.wsUrl);

        this.socket.onopen = () => {
            console.log('WebSocket connected');
            this.authenticate();
        };

        this.socket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };

        this.socket.onclose = () => {
            console.log('WebSocket connection closed');
            this.isAuthenticated = false;
            this.userId = null;
        };

        this.socket.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    authenticate() {
        const authMessage = {
            action: 0, // AUTH action
            token: this.token
        };

        console.log('Sending authentication:', authMessage);
        this.send(authMessage);
    }

    requestFriendsList() {
        if (!this.isAuthenticated) {
            console.error('Not authenticated. Please authenticate first.');
            return;
        }

        const listFriendsMessage = {
            action: 1 // LIST_FRIENDS action
        };

        console.log('Requesting friends list');
        this.send(listFriendsMessage);
    }

    send(message) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(message));
        } else {
            console.error('WebSocket is not open');
        }
    }

    handleMessage(message) {
        console.log('Received message:', message);

        switch (message.type) {
            case 'authSuccess':
                this.isAuthenticated = true;
                this.userId = message.userId;
                console.log(`Authentication successful. User ID: ${this.userId}`);

                if (this.onAuthSuccess) {
                    this.onAuthSuccess(message.userId);
                }

                // Automatically request friends list after authentication
                setTimeout(() => this.requestFriendsList(), 100);
                break;

            case 'friendsList':
                this.friends = message.friends;
                console.log('Friends list received:', this.friends);
                this.displayFriendsList();

                if (this.onFriendsListReceived) {
                    this.onFriendsListReceived(message.friends);
                }
                break;

            case 'friendConnectionStatus':
                console.log(`Friend connection status update:`, {
                    friendId: message.friendId,
                    username: message.username,
                    isConnected: message.isConnected
                });

                this.updateFriendStatus(message.friendId, message.isConnected);

                if (this.onFriendConnectionStatus) {
                    this.onFriendConnectionStatus(message);
                }
                break;

            case 'error':
                console.error('WebSocket error:', message.error);

                if (this.onError) {
                    this.onError(message.error);
                }
                break;

            default:
                console.warn('Unknown message type:', message.type);
        }
    }

    updateFriendStatus(friendId, isConnected) {
        const friend = this.friends.find(f => f.id === friendId);
        if (friend) {
            friend.is_connected = isConnected;
            console.log(`Updated friend ${friend.username} status to: ${isConnected ? 'online' : 'offline'}`);
            this.displayFriendsList();
        }
    }

    displayFriendsList() {
        console.log('\n=== FRIENDS LIST ===');
        if (this.friends.length === 0) {
            console.log('No friends found.');
            return;
        }

        this.friends.forEach(friend => {
            const status = friend.is_connected ? '🟢 Online' : '🔴 Offline';
            const avatar = friend.avatar ? `[Avatar: ${friend.avatar}]` : '[No Avatar]';
            console.log(`${status} - ${friend.username} (ID: ${friend.id}) ${avatar}`);
        });
        console.log('==================\n');
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
        }
    }
}

// Usage Example
function testSocialWebSocket() {
    // Replace with your actual WebSocket URL and token
    const WS_URL = 'ws://localhost:3000/api/social/';
    const JWT_TOKEN = 'your_jwt_token_here';

    const client = new SocialWebSocketClient(WS_URL, JWT_TOKEN);

    // Set up event handlers
    client.onAuthSuccess = (userId) => {
        console.log(`✅ Successfully authenticated as user ${userId}`);
    };

    client.onFriendsListReceived = (friends) => {
        console.log(`📋 Received ${friends.length} friends`);
    };

    client.onFriendConnectionStatus = (statusUpdate) => {
        const status = statusUpdate.isConnected ? 'connected' : 'disconnected';
        console.log(`🔄 ${statusUpdate.username} ${status}`);
    };

    client.onError = (error) => {
        console.error(`❌ Error: ${error}`);
    };

    // Connect to WebSocket
    client.connect();

    // For testing: disconnect after 30 seconds
    setTimeout(() => {
        console.log('Test ending - disconnecting...');
        client.disconnect();
    }, 30000);

    // Return client for manual testing in browser console
    return client;
}

// Browser usage:
// 1. Open browser console
// 2. Paste this entire file
// 3. Update JWT_TOKEN with a valid token
// 4. Run: const client = testSocialWebSocket();
// 5. You can then manually call:
//    - client.requestFriendsList()
//    - client.disconnect()

// Node.js usage (requires 'ws' package):
// npm install ws
// Then uncomment the following lines:

/*
if (typeof require !== 'undefined') {
    const WebSocket = require('ws');
    global.WebSocket = WebSocket;

    // Run the test
    testSocialWebSocket();
}
*/

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SocialWebSocketClient, testSocialWebSocket };
}
