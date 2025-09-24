# This stage is used when running from VS in fast mode (Default for Debug configuration)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# This stage is used to build the service project
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS with-node
RUN apt-get update
RUN apt-get install curl -y
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash
RUN apt-get -y install nodejs

# Generate developer certificate in the SDK stage (as root)
RUN mkdir -p /https && \
    dotnet dev-certs https -ep /https/aspnetapp.pfx -p password

FROM with-node AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["React_Rentify/React_Rentify.Server/React_Rentify.Server.csproj", "React_Rentify/React_Rentify.Server/"]
COPY ["React_Rentify/react_rentify.client/react_rentify.client.esproj", "React_Rentify/react_rentify.client/"]
RUN dotnet restore "./React_Rentify/React_Rentify.Server/React_Rentify.Server.csproj"
COPY . .
WORKDIR "/src/React_Rentify/React_Rentify.Server"
RUN dotnet build "./React_Rentify.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./React_Rentify.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy the certificate from the SDK stage
COPY --from=with-node /https /https

# Fix permissions for the certificate (before switching to non-root user)
RUN chmod -R 755 /https

# Set environment variables for the certificate
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=password
ENV ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx

# Switch to non-root user after setting up certificates
USER $APP_UID

ENTRYPOINT ["dotnet", "React_Rentify.Server.dll"]