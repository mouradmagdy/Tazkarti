using System.Text.Json;
using Tazkarti.Helpers;

namespace Tazkarti.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (AppException ex)
        {
            logger.LogWarning("Handled exception: {Message}", ex.Message);
            await WriteErrorAsync(ctx, ex.StatusCode, ex.Message);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception");
            await WriteErrorAsync(ctx, 500, "Internal server error");
        }
    }

    private static Task WriteErrorAsync(HttpContext ctx, int status, string message)
    {
        ctx.Response.ContentType = "application/json";
        ctx.Response.StatusCode = status;

        var body = JsonSerializer.Serialize(new { message });
        return ctx.Response.WriteAsync(body);
    }
}
