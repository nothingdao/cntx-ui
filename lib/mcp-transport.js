import { MCPServer } from './mcp-server.js';

export class MCPTransport {
  constructor(cntxServer) {
    this.mcpServer = new MCPServer(cntxServer);
    this.buffer = '';
  }

  // Start stdio transport
  start() {
    console.error('🚀 MCP server starting on stdio transport');
    
    // Handle incoming messages from stdin
    process.stdin.on('data', (data) => {
      this.handleIncomingData(data.toString());
    });

    // Handle process cleanup
    process.on('SIGINT', () => {
      console.error('📡 MCP server shutting down');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.error('📡 MCP server shutting down');
      process.exit(0);
    });

    // Set stdin to raw mode for proper JSON-RPC communication
    process.stdin.setEncoding('utf8');
    
    console.error('✅ MCP server ready for JSON-RPC messages');
  }

  // Handle incoming data and parse JSON-RPC messages
  async handleIncomingData(data) {
    this.buffer += data;
    
    // Split by newlines to handle multiple messages
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line.trim());
          await this.processMessage(message);
        } catch (error) {
          console.error('❌ Failed to parse JSON-RPC message:', error.message);
          this.sendError(null, -32700, 'Parse error');
        }
      }
    }
  }

  // Process a single JSON-RPC message
  async processMessage(message) {
    try {
      const response = await this.mcpServer.handleMessage(message);
      
      // Only send response if not null (notifications don't need responses)
      if (response !== null) {
        this.sendMessage(response);
      }
    } catch (error) {
      console.error('❌ Error processing message:', error.message);
      this.sendError(message.id || null, -32603, 'Internal error');
    }
  }

  // Send a message via stdout
  sendMessage(message) {
    const messageStr = JSON.stringify(message);
    process.stdout.write(messageStr + '\n');
  }

  // Send an error response
  sendError(id, code, message, data = null) {
    const error = { code, message };
    if (data) error.data = data;
    
    const response = {
      jsonrpc: '2.0',
      id,
      error
    };
    
    this.sendMessage(response);
  }
}

// Factory function to start MCP transport
export function startMCPTransport(cntxServer) {
  const transport = new MCPTransport(cntxServer);
  transport.start();
  return transport;
}