# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

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

# Create directory and generate developer certificate in the SDK stage
RUN mkdir -p /https && \
    dotnet dev-certs https -ep /https/aspnetapp.pfx -p password

FROM with-node AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy project files
COPY ["React_Mangati/React_Mangati.Server/React_Mangati.Server.csproj", "React_Mangati/React_Mangati.Server/"]
COPY ["React_Mangati/react_mangati.client/react_mangati.client.esproj", "React_Mangati/react_mangati.client/"]
COPY ["React_Mangati/react_mangati.client/package*.json", "React_Mangati/react_mangati.client/"]

# Restore .NET dependencies
RUN dotnet restore "./React_Mangati/React_Mangati.Server/React_Mangati.Server.csproj"

# Install npm dependencies BEFORE copying all source files
WORKDIR /src/React_Mangati/react_mangati.client
RUN npm install
RUN npm install react-router-dom axios react-i18next i18next i18next-browser-languagedetector react-toastify hammerjs

# Copy all source files
WORKDIR /src
COPY . .

# Build the .NET project
WORKDIR "/src/React_Mangati/React_Mangati.Server"
RUN dotnet build "./React_Mangati.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

# This stage is used to publish the service project to be copied to the final stage
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./React_Mangati.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# This stage is used in production or when running from VS in regular mode (Default when not using the Debug configuration)
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Copy the certificate from the SDK stage
COPY --from=with-node /https /https

# Fix permissions for the certificate
RUN chmod -R 755 /https && \
    chown -R $APP_UID:$APP_UID /https

# Set environment variables for the certificate
ENV ASPNETCORE_Kestrel__Certificates__Default__Password=password
ENV ASPNETCORE_Kestrel__Certificates__Default__Path=/https/aspnetapp.pfx

# Don't run as root
USER $APP_UID

ENTRYPOINT ["dotnet", "React_Mangati.Server.dll"]

