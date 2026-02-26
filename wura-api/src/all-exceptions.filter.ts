import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    
    // Log exception to file
    fs.appendFileSync('error.log', `\n\n[=== ERROR TRACE ===]\nTime: ${new Date().toISOString()}\nPath: ${request.url}\nBody: ${JSON.stringify(request.body)}\nError: ${exception instanceof Error ? exception.stack : JSON.stringify(exception)}`);
    
    // Default response behavior
    const response = ctx.getResponse();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception instanceof Error ? exception.message : 'Internal server error',
    });
  }
}
