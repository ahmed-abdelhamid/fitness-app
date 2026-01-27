export const API_VERSION = "v1";

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: "15m",
  REFRESH_TOKEN: "7d",
} as const;

export const WEBSOCKET_EVENTS = {
  // Connection
  CONNECTION: "connection",
  DISCONNECT: "disconnect",

  // Messages
  SEND_MESSAGE: "send_message",
  NEW_MESSAGE: "new_message",
  MESSAGE_READ: "message_read",

  // Typing indicators
  TYPING_START: "typing_start",
  TYPING_STOP: "typing_stop",

  // Errors
  ERROR: "error",
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;
