FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY Tazkarti/Tazkarti.csproj Tazkarti/
RUN dotnet restore Tazkarti/Tazkarti.csproj

COPY Tazkarti/ Tazkarti/
WORKDIR /src/Tazkarti
RUN dotnet publish Tazkarti.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Tazkarti.dll"]
