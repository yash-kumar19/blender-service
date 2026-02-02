FROM ubuntu:22.04

# Avoid prompts
ENV DEBIAN_FRONTEND=noninteractive

# Set Blender to run in headless mode
ENV BLENDER_USER_CONFIG=/tmp/blender

# Install dependencies and Node.js
RUN apt-get update && \
    apt-get install -y \
    curl \
    xz-utils \
    libgl1-mesa-glx \
    libglu1-mesa \
    libsm6 \
    libxrender1 \
    libxext6 \
    libxi6 \
    libxkbcommon0 \
    libxrandr2 \
    libxinerama1 \
    libxcursor1 \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Download and install Blender 4.2 LTS manually (more reliable than apt)
WORKDIR /opt/blender
RUN curl -L https://download.blender.org/release/Blender4.2/blender-4.2.0-linux-x64.tar.xz | tar -xJ --strip-components=1
ENV PATH="/opt/blender:$PATH"

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
