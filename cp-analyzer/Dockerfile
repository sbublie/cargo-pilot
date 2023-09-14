FROM python:3.9

# Set the working directory
WORKDIR /app

# Install dependencies
COPY ./requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy all scripts
COPY . /app

# Start server
CMD [ "python", "cp-analyzer.py" ]