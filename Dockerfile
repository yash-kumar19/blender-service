FROM ubuntu:22.04

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set Blender to run in headless mode
ENV BLENDER_USER_CONFIG=/tmp/blender
ENV BLENDER_SYSTEM_SCRIPTS=/usr/share/blender/scripts

# Install Blender dependencies and Node.js
RUN apt-get update && \
    apt-get install -y \
    blender \
    curl \
    xz-utils \
    libgl1-mesa-glx \
    libglu1-mesa \
    libsm6 \
    libxrender1 \
    libxext6 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
