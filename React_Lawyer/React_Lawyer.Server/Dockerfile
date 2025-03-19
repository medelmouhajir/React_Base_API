FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["React_Lawyer/React_Lawyer.Server/React_Lawyer.Server.csproj", "React_Lawyer/React_Lawyer.Server/"]
RUN dotnet restore "React_Lawyer/React_Lawyer.Server/React_Lawyer.Server.csproj"

# Copy all files and build
COPY . .
WORKDIR "/src/React_Lawyer/React_Lawyer.Server"
RUN dotnet build "React_Lawyer.Server.csproj" -c Debug -o /app/build

FROM build AS publish
RUN dotnet publish "React_Lawyer.Server.csproj" -c Debug -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "React_Lawyer.Server.dll"]