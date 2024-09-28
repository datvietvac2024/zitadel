FROM golang:1.23 AS builder

ENV GO111MODULE=on \
    CGO_ENABLED=0  \
    GOARCH="amd64" \
    GOOS=linux

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

RUN go build -o /app/zitadel -v -ldflags="-extldflags "-static" -s -w"

COPY build/entrypoint.sh /app/entrypoint.sh

RUN useradd -s "" --home / zitadel && \
    chown zitadel /app/zitadel && \
    chmod +x /app/zitadel && \
    chown zitadel /app/entrypoint.sh && \
    chmod +x /app/entrypoint.sh


WORKDIR /app
ENV PATH="/app:${PATH}"

USER zitadel
ENTRYPOINT ["/app/entrypoint.sh"]

FROM alpine:3.17
LABEL maintainer="VieON"

# RUN apk add libc6-compat

COPY --from=builder /etc/passwd /etc/passwd
COPY --from=builder /etc/ssl/certs /etc/ssl/certs
COPY --from=builder /app/zitadel /app/zitadel

USER zitadel
ENTRYPOINT ["/app/zitadel"]
