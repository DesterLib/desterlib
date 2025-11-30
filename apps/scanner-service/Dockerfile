FROM golang:1.21-alpine AS builder

WORKDIR /app

# Install ffmpeg (for ffprobe)
RUN apk add --no-cache ffmpeg git

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o scanner .

FROM alpine:latest

RUN apk --no-cache add ca-certificates ffmpeg

WORKDIR /root/

COPY --from=builder /app/scanner .

EXPOSE 8080

CMD ["./scanner"]
