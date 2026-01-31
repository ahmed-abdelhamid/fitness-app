import { WEBSOCKET_EVENTS } from "@fitness-app/shared/src/constants/index.js";
import { ArgumentsHost, Catch, Logger } from "@nestjs/common";
import { BaseWsExceptionFilter, WsException } from "@nestjs/websockets";
import { Socket } from "socket.io";

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const client = host.switchToWs().getClient<Socket>();

    let error = { message: "Internal server error", status: 500 };

    if (exception instanceof WsException) {
      error = {
        message: exception.message,
        status: 400,
      };
    } else if (exception instanceof Error) {
      error = {
        message: exception.message,
        status: 500,
      };
    }

    this.logger.error(`WebSocket error: ${error.message}`, exception);

    client.emit(WEBSOCKET_EVENTS.ERROR, error);
  }
}
