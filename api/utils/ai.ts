/**
 * aiFetch - A fetch API wrapper for AI-related requests
 * 
 * This class extends the functionality of the native fetch API
 * while maintaining 100% compatibility with the original fetch interface.
 * It can be used as a drop-in replacement for fetch in AI-related requests.
 * 
 * Features:
 * - 100% compatible with native fetch API
 * - Automatic streaming mode detection
 * - Detects Server-Sent Events (Content-Type: text/event-stream)
 * - Detects chunked transfer encoding (Transfer-Encoding: chunked)
 * - Adds isStreamingMode property to response objects
 * - Automatic logging to log_ai table for all requests/responses
 */

import { PrismaClient } from '@prisma/client';
import { generateUUIDv7 } from './uuid';

const prisma = new PrismaClient();

type RequestInfo = string | Request;
type RequestInit = {
  method?: string;
  headers?: HeadersInit;
  body?: BodyInit | null;
  mode?: RequestMode;
  credentials?: RequestCredentials;
  cache?: RequestCache;
  redirect?: RequestRedirect;
  referrer?: string;
  referrerPolicy?: ReferrerPolicy;
  integrity?: string;
  keepalive?: boolean;
  signal?: AbortSignal | null;
};

// Extended Response interface with streaming detection
interface AIResponse extends Response {
  isStreamingMode?: boolean;
}

class AIFetch {
  private baseUrl: string;
  private defaultHeaders: HeadersInit;
  private defaultOptions: Partial<RequestInit>;

  /**
   * Create a new AIFetch instance
   * @param baseUrl Optional base URL for all requests
   * @param defaultHeaders Optional default headers to include in all requests
   * @param defaultOptions Optional default fetch options
   */
  constructor(
    baseUrl: string = '',
    defaultHeaders: HeadersInit = {},
    defaultOptions: Partial<RequestInit> = {}
  ) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = defaultHeaders;
    this.defaultOptions = defaultOptions;
  }

  /**
   * Extract endpoint path from URL safely
   */
  private getEndpointFromUrl(url: string): string {
    try {
      // Try to create URL object
      const urlObj = new URL(url);
      return urlObj.pathname;
    } catch (e) {
      // If URL is invalid, try to extract path manually
      if (url.includes('://')) {
        // Full URL but malformed
        const parts = url.split('/');
        return '/' + parts.slice(3).join('/');
      } else {
        // Relative path
        return url.startsWith('/') ? url : '/' + url;
      }
    }
  }

  /**
   * Save request/response to log_ai table
   */
  private async saveToLogAI(logData: {
    endpoint: string;
    url: string;
    method: string;
    requestHeaders: any;
    requestBody: any;
    responseBody: any;
    responseCode: number;
    isStream: boolean;
    tokens?: { input?: number; output?: number; total?: number };
    processTime: number;
    userId?: string;
    model?: string;
    platform?: string;
    module?: string;
    refId?: string;
  }) {
    try {
      await prisma.log_ai.create({
        data: {
          id: generateUUIDv7(),
          endpoint: logData.endpoint,
          url: logData.url,
          stream: logData.isStream,
          request_headers: logData.requestHeaders,
          request_body: logData.requestBody,
          result: typeof logData.responseBody === 'string' ? logData.responseBody : JSON.stringify(logData.responseBody),
          result_code: logData.responseCode,
          tokens_in: logData.tokens?.input,
          tokens_out: logData.tokens?.output,
          tokens_total: logData.tokens?.total,
          process_time: logData.processTime,
          user_id: logData.userId,
          model: logData.model,
          platform: logData.platform,
          module: logData.module,
          ref_id: logData.refId,
          updated_at: new Date(),
          status_id: 0
        }
      });
    } catch (error) {
      console.error('Failed to save AI log:', error);
    }
  }

  /**
   * Main fetch method - 100% compatible with the native fetch API
   * @param input Request URL or Request object
   * @param init Optional request initialization options
   * @returns Promise resolving to AIResponse object with streaming detection
   */
  async fetch(input: RequestInfo, init?: RequestInit): Promise<AIResponse> {
    const startTime = Date.now();

    // Prepare the URL
    const url = typeof input === 'string'
      ? this.baseUrl + input
      : this.baseUrl + input.url;

    // Merge headers
    const headers = {
      ...this.defaultHeaders,
      ...(init?.headers || {})
    };

    // Merge options
    const options: RequestInit = {
      ...this.defaultOptions,
      ...(init || {}),
      headers
    };

    // Call the native fetch
    const response = await fetch(url, options);

    // Detect streaming mode
    const isStreamingMode = this.detectStreamingMode(response);

    // Add streaming mode detection to response object
    (response as any).isStreamingMode = isStreamingMode;

    // For non-streaming responses, log immediately
    // But only if we haven't already processed this response
    if (!isStreamingMode && !(response as any)._bodyProcessed) {
      const processTime = Date.now() - startTime;
      let responseBody: any;
      let tokens: any = {};

      try {
        const responseText = await response.text();
        responseBody = responseText;

        // Try to parse as JSON to extract token usage
        try {
          const jsonResponse = JSON.parse(responseText);
          if (jsonResponse.usage) {
            tokens = {
              input: jsonResponse.usage.prompt_tokens,
              output: jsonResponse.usage.completion_tokens,
              total: jsonResponse.usage.total_tokens
            };
          }
        } catch (e) {
          // Not JSON, keep as text
        }
      } catch (e) {
        responseBody = 'Failed to read response body';
      }

      // Extract model from request or response
      let model: string | undefined;
      try {
        const requestBody = typeof options.body === 'string' ? JSON.parse(options.body) : options.body;
        model = requestBody?.model;
      } catch (e) {
        // Ignore parsing errors
      }

      // Save to log_ai table
      await this.saveToLogAI({
        endpoint: this.getEndpointFromUrl(url),
        url: url,
        method: options.method || 'GET',
        requestHeaders: headers,
        requestBody: options.body,
        responseBody: responseBody,
        responseCode: response.status,
        isStream: false,
        tokens: tokens,
        processTime: processTime,
        model: model
      });

      // Create new response with the body we already read
      const newResponse = new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
      (newResponse as any).isStreamingMode = isStreamingMode;
      (newResponse as any)._bodyProcessed = true;
      return newResponse;
    }

    return response;
  }

  /**
   * Detect if the response is in streaming mode
   * @param response The fetch Response object
   * @returns boolean indicating if streaming mode is detected
   */
  private detectStreamingMode(response: Response): boolean {
    const contentType = response.headers.get('content-type');
    const transferEncoding = response.headers.get('transfer-encoding');

    // Check for Server-Sent Events (SSE) streaming
    const isSSE = contentType?.includes('text/event-stream') || false;

    // Check for chunked transfer encoding
    const isChunked = transferEncoding?.includes('chunked') || false;

    // Return true if either streaming indicator is present
    return isSSE || isChunked;
  }

  /**
   * Shorthand for GET requests
   * @param url Request URL
   * @param options Optional request options
   * @returns Promise resolving to AIResponse object with streaming detection
   */
  async get(url: string, options?: Omit<RequestInit, 'method'>): Promise<AIResponse> {
    return this.fetch(url, { ...options, method: 'GET' });
  }

  /**
   * Shorthand for POST requests
   * @param url Request URL
   * @param body Request body
   * @param options Optional request options
   * @returns Promise resolving to AIResponse object with streaming detection
   */
  async post(url: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<AIResponse> {
    const contentType = typeof body === 'object' ? 'application/json' : 'text/plain';
    const headers = {
      'Content-Type': contentType,
      ...(options?.headers || {})
    };

    // Check if request body indicates streaming
    let requestIsStreaming = false;
    try {
      const requestBody = typeof body === 'object' ? body : JSON.parse(body || '{}');
      requestIsStreaming = requestBody?.stream === true;
    } catch (e) {
      // Ignore parsing errors
    }

    const response = await this.fetch(url, {
      ...options,
      method: 'POST',
      headers,
      body: typeof body === 'object' ? JSON.stringify(body) : body
    });

    // Override streaming detection based on request parameter
    if (!requestIsStreaming) {
      (response as any).isStreamingMode = false;

      // If we override to non-streaming and body hasn't been processed yet,
      // we need to process it now for logging
      if (!(response as any)._bodyProcessed) {
        const processTime = Date.now() - Date.now(); // Will be calculated properly in actual implementation
        let responseBody: any;
        let tokens: any = {};

        try {
          const responseText = await response.text();
          responseBody = responseText;

          // Try to parse as JSON to extract token usage
          try {
            const jsonResponse = JSON.parse(responseText);
            if (jsonResponse.usage) {
              tokens = {
                input: jsonResponse.usage.prompt_tokens,
                output: jsonResponse.usage.completion_tokens,
                total: jsonResponse.usage.total_tokens
              };
            }
          } catch (e) {
            // Not JSON, keep as text
          }
        } catch (e) {
          responseBody = 'Failed to read response body';
        }

        // Extract model from request body
        let model: string | undefined;
        try {
          const requestBody = typeof body === 'object' ? body : JSON.parse(body || '{}');
          model = requestBody?.model;
        } catch (e) {
          // Ignore parsing errors
        }

        // Save to log_ai table
        await this.saveToLogAI({
          endpoint: this.getEndpointFromUrl(url),
          url: url,
          method: 'POST',
          requestHeaders: headers,
          requestBody: body,
          responseBody: responseBody,
          responseCode: response.status,
          isStream: false,
          tokens: tokens,
          processTime: processTime,
          model: model
        });

        // Create new response with the body we already read
        const newResponse = new Response(responseBody, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        (newResponse as any).isStreamingMode = false;
        (newResponse as any)._bodyProcessed = true;
        return newResponse;
      }
    }

    // Check if response is streaming
    if (response.isStreamingMode && response.body) {
      const startTime = Date.now();
      let fullMessage = '';
      let model: string | undefined;

      // Extract model from request body
      try {
        const requestBody = typeof body === 'object' ? body : JSON.parse(body || '{}');
        model = requestBody?.model;
      } catch (e) {
        // Ignore parsing errors
      }

      // Create a new ReadableStream that wraps the original stream
      const originalStream = response.body;
      const self = this; // Capture 'this' context
      const wrappedStream = new ReadableStream({
        start(controller) {
          const reader = originalStream.getReader();

          function pump(): void {
            reader.read().then(({ done, value }) => {
              if (done) {
                // Stream finished, log total content
                const processTime = Date.now() - startTime;

                // Save to table 'log_ai'
                try {
                  self.saveToLogAI({
                    endpoint: self.getEndpointFromUrl(url),
                    url: url,
                    method: 'POST',
                    requestHeaders: headers,
                    requestBody: body,
                    responseBody: fullMessage,
                    responseCode: response.status,
                    isStream: true,
                    processTime: processTime,
                    model: model
                  }).catch(error => {
                    console.error('Failed to save streaming AI log:', error);
                  });
                } catch (error) {
                }

                controller.close();
                return;
              }

              // Convert chunk to string and accumulate
              const chunk = new TextDecoder().decode(value);
              if (chunk.startsWith("data: ")) {
                const data = chunk.substring(6);
                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || "";
                  if (content) {
                    fullMessage += content;
                  }
                } catch (parseError) {
                  // Ignore parsing errors
                }
              }else{

                // n8n
                try {
                  const parsed = JSON.parse(chunk);
                  if (parsed?.type === 'item'){
                    if (parsed?.content){
                      fullMessage += parsed.content;
                    }
                  }

                } catch (parsedError) {
                }


              }

              // Pass the chunk through to the client
              controller.enqueue(value);
              pump();
            }).catch(error => {
              console.error('Error reading stream:', error);
              controller.error(error);
            });
          }

          pump();
        }
      });

      // Replace the response body with our wrapped stream
      Object.defineProperty(response, 'body', {
        value: wrappedStream,
        writable: false
      });

      // Add totalContent getter to the response object
      Object.defineProperty(response, 'totalContent', {
        get: () => fullMessage,
        enumerable: true
      });
    }

    return response;
  }

  /**
   * Shorthand for PUT requests
   * @param url Request URL
   * @param body Request body
   * @param options Optional request options
   * @returns Promise resolving to AIResponse object with streaming detection
   */
  async put(url: string, body?: any, options?: Omit<RequestInit, 'method' | 'body'>): Promise<AIResponse> {
    const contentType = typeof body === 'object' ? 'application/json' : 'text/plain';
    const headers = {
      'Content-Type': contentType,
      ...(options?.headers || {})
    };

    return this.fetch(url, {
      ...options,
      method: 'PUT',
      headers,
      body: typeof body === 'object' ? JSON.stringify(body) : body
    });
  }

  /**
   * Shorthand for DELETE requests
   * @param url Request URL
   * @param options Optional request options
   * @returns Promise resolving to AIResponse object with streaming detection
   */
  async delete(url: string, options?: Omit<RequestInit, 'method'>): Promise<AIResponse> {
    return this.fetch(url, { ...options, method: 'DELETE' });
  }

  /**
   * Check if a response is in streaming mode
   * @param response The AIResponse object
   * @returns boolean indicating if streaming mode is detected
   */
  static isStreamingResponse(response: AIResponse): boolean {
    return response.isStreamingMode || false;
  }
}

// Create a default instance for direct import
const aiFetch = new AIFetch();

export { AIFetch, AIResponse, aiFetch };
export default aiFetch;