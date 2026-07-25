namespace Tazkarti.Helpers;

public class AppException(string message, int statusCode = 500) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}

public class NotFoundException(string message) : AppException(message, 404);

public class BadRequestException(string message) : AppException(message, 400);

public class ConflictException(string message) : AppException(message, 409);

public class ForbiddenException(string message) : AppException(message, 403);
