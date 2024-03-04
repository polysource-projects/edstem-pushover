# Base image: Node LTS
FROM node:20.4.0-alpine

# Install PNPM
RUN corepack enable

# Create application directory and move there
WORKDIR /app

# Copy package.json and pnpm-lock.yaml from the host to the container
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy the rest of the application files
COPY . .

# Start the server
CMD ["pnpm", "start"]
