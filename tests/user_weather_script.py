import os
import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util import Retry
from requests.exceptions import RequestException

def create_resilient_session():
    """Configures a session with automatic retries for flaky connections."""
    session = requests.Session()
    
    # Configure retry logic for connection drops or 5xx server errors
    retries = Retry(
        total=3,                # Retry 3 times before giving up
        backoff_factor=1,       # Wait 1s, 2s, 4s between retries
        status_forcelist=[500, 502, 503, 504] # Retry on these server errors
    )
    
    # Mount the retry logic to both HTTP and HTTPS requests
    adapter = HTTPAdapter(max_retries=retries)
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    
    # Define global headers so they apply to every request automatically
    session.headers.update({
        'User-Agent': 'ResilientWeatherClient/2.0',
        'Accept': 'application/json'
    })
    
    return session

def fetch_weather_report(latitude, longitude):
    """Fetches real-time weather data using query parameters and a session."""
    url = "https://api.open-meteo.com/v1/forecast"
    
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current_weather": "true",
        "timezone": "auto"
    }
    
    print(f"🔄 Initialising secure API session...")
    with create_resilient_session() as session:
        try:
            print(f"🛰️ Sending GET request to Open-Meteo...")
            # Enforce a strict timeout (3 seconds to connect, 10 seconds to read data)
            response = session.get(url, params=params, timeout=(3, 10))
            
            # Instantly raise an exception if a 4xx or 5xx status code is returned
            response.raise_for_status()
            
            # Performance checkpoint: measure how fast the server responded
            latency = response.elapsed.total_seconds()
            print(f"✅ Success! Server responded in {latency:.2f} seconds.")
            
            return response.json()
            
        except RequestException as error:
            print(f"❌ Network operation failed: {error}")
            return None

def stream_raw_data_to_disk(api_response_dict, filename="weather_raw.json"):
    """Demonstrates streaming large/structured responses safely chunk-by-chunk."""
    # We simulate a large streaming download by hitting a test endpoint 
    # that streams raw payload chunks back to us.
    stream_url = "https://httpbin.org" 
    
    print(f"💾 Opening data stream to save raw packets to '{filename}'...")
    try:
        with requests.get(stream_url, stream=True, timeout=5) as stream_response:
            stream_response.raise_for_status()
            
            with open(filename, 'wb') as file:
                # Read the response in small chunks (128 bytes at a time)
                # This protects memory usage if downloading massive multi-gigabyte files.
                for chunk in stream_response.iter_content(chunk_size=128):
                    if chunk:
                        file.write(chunk)
                        print("🧱 Data chunk written to disk...")
                        
        print(f"🎉 Stream complete. Data safely persistent in {os.path.abspath(filename)}")
    except RequestException as e:
        print(f"❌ Streaming failed: {e}")

if __name__ == "__main__":
    # 1. Coordinate configurations (Coordinates for London, UK)
    LONDON_LAT = 51.5074
    LONDON_LON = -0.1278
    
    # 2. Execute the primary API transaction
    weather_data = fetch_weather_report(LONDON_LAT, LONDON_LON)
    
    if weather_data:
        # Extract specific elements out of the nested JSON layout safely
        current = weather_data.get("current_weather", {})
        temp = current.get("temperature")
        windspeed = current.get("windspeed")
        
        print("\n--- 📊 PARSED METRIC REPORT ---")
        print(f"📍 Location: London (Lat: {LONDON_LAT}, Lon: {LONDON_LON})")
        print(f"🌡️ Temperature : {temp}°C")
        print(f"💨 Wind Speed  : {windspeed} km/h")
        print("-------------------------------\n")
        
        # 3. Trigger a streaming transaction to save data chunks to disk
        stream_raw_data_to_disk(weather_data)
