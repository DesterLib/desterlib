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
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o go-service .

FROM alpine:latest

RUN apk --no-cache add ca-certificates ffmpeg wget

WORKDIR /root/

COPY --from=builder /app/go-service .

EXPOSE 8080

CMD ["./go-service"]

