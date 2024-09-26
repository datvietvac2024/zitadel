
FROM golang:1.23 AS builder

# Install dependencies for Node.js
RUN apt-get update && \
    apt-get install -y curl gnupg && \
    # Install Node.js (adjust version as needed)
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
#    # Enable Corepack
#    corepack enable && \
#    # Prepare and activate the specific Yarn version defined in package.json
#    corepack prepare yarn@4.5.0 --activate && \
#    # Install Sass globally using npm
    npm install -g sass && \
#    # Clean up to reduce image size
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /go/src/github.com/zitadel/zitadel

COPY go.mod go.sum ./

RUN go mod download

COPY . .

RUN make core_api && \
    make core_static && \
    make core_assets

RUN go build -o /app/zitadel -v -ldflags="-s -w -extldflags -static"


FROM debian:latest as artifact

RUN apt-get update && apt-get install ca-certificates -y

COPY build/entrypoint.sh /app/entrypoint.sh
COPY --from=builder /app/zitadel  /app/zitadel

RUN useradd -s "" --home / zitadel && \
    chown zitadel /app/zitadel && \
    chmod +x /app/zitadel && \
    chown zitadel /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh

WORKDIR /app
ENV PATH="/app:${PATH}"

USER zitadel
ENTRYPOINT ["/app/entrypoint.sh"]

FROM scratch as final

COPY --from=artifact /etc/passwd /etc/passwd
COPY --from=artifact /etc/ssl/certs /etc/ssl/certs
COPY --from=artifact /app/zitadel /app/zitadel

HEALTHCHECK NONE

USER zitadel
ENTRYPOINT ["/app/zitadel"]