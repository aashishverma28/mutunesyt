from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from ytmusicapi import YTMusic
import yt_dlp
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serving static files (index.html, JS, etc.)
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

yt = YTMusic()

# yt-dlp config for extracting audio stream URLs without downloading
ydl_opts = {
    'format': 'bestaudio[ext=m4a]/bestaudio/best',
    'quiet': True,
    'no_warnings': True,
    'simulate': True,
    'skip_download': True,
    'nocheckcertificate': True,
    'youtube_include_dash_manifest': False,
}

# In-memory cache for stream URLs to reduce YouTube lookups
# Format: { videoId: (url, timestamp) }
stream_cache = {}
CACHE_TTL = 3600  # 1 hour

@app.get("/search")
def search_general(query: str = ""):
    if not query:
        return {"success": True, "data": []}
    try:
        # get_search_suggestions generally returns a list of strings
        # or dicts depending on the exact version/response
        results = yt.get_search_suggestions(query)
        songs = []
        for r in results:
            title = r.get("title", "") if isinstance(r, dict) else r
            songs.append({"title": title})
        
        data = {
            "songs": {"results": songs}
        }
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/search/songs")
def search_songs(request: Request, query: str, limit: int = 15):
    try:
        base_url = str(request.base_url).rstrip("/")
        results = yt.search(query, filter="songs", limit=limit)
        mapped_results = []
        for r in results:
            # Safely grab thumbnails
            thumbnails = r.get("thumbnails", [])
            images = [{"url": t["url"]} for t in thumbnails]
            if not images:
                images = [{"url": "https://via.placeholder.com/500?text=No+Art"}]
                
            mapped_results.append({
                "id": r.get('videoId'),
                "name": r.get('title'),
                "duration": r.get('duration_seconds', 0),
                "artists": {
                    "primary": [{"name": a.get("name"), "id": a.get("id")} for a in r.get("artists", [])]
                },
                "image": images,
                "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={r.get('videoId')}"}]
            })
        return {"success": True, "data": {"results": mapped_results}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/search/artists")
def search_artists(query: str, limit: int = 10):
    try:
        results = yt.search(query, filter="artists", limit=limit)
        mapped_results = []
        for r in results:
            thumbnails = r.get("thumbnails", [])
            images = [{"url": t["url"]} for t in thumbnails]
            if not images:
                images = [{"url": "https://via.placeholder.com/150?text=Artist"}]

            mapped_results.append({
                "id": r.get('browseId'),
                "name": r.get('artist'),
                "image": images
            })
        return {"success": True, "data": {"results": mapped_results}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/artists")
def get_artist(request: Request, id: str):
    try:
        base_url = str(request.base_url).rstrip("/")
        artist = yt.get_artist(id)
        
        songs = []
        if 'songs' in artist and 'results' in artist['songs']:
            for s in artist['songs']['results']:
                if not s.get('videoId'):
                     continue # skip if unplayable
                
                thumbnails = s.get("thumbnails", [])
                images = [{"url": t["url"]} for t in thumbnails]
                if not images:
                    images = [{"url": "https://via.placeholder.com/500?text=No+Art"}]

                songs.append({
                    "id": s.get('videoId'),
                    "name": s.get('title'),
                    "duration": 0, # usually not strictly provided in this particular endpoint
                    "artists": {
                        "primary": [{"name": a.get("name"), "id": a.get("id")} for a in s.get("artists", [])]
                    },
                    "image": images,
                    "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={s.get('videoId')}"}]
                })
        
        albums = []
        if 'albums' in artist and 'results' in artist['albums']:
            for a in artist['albums']['results']:
                thumbnails = a.get("thumbnails", [])
                images = [{"url": t["url"]} for t in thumbnails]
                if not images:
                    images = [{"url": "https://via.placeholder.com/500?text=No+Art"}]

                albums.append({
                    "id": a.get('browseId'),
                    "name": a.get('title'),
                    "year": a.get('year'),
                    "image": images
                })

        # Top level thumbnails
        thumbnails = artist.get('thumbnails', [])
        images = [{"url": t["url"]} for t in thumbnails]
        if not images:
             images = [{"url": "https://via.placeholder.com/500?text=No+Art"}]

        data = {
            "id": id,
            "name": artist.get('name'),
            "image": images,
            "topSongs": songs,
            "topAlbums": albums
        }
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/songs")
def get_song(request: Request, id: str):
    try:
        base_url = str(request.base_url).rstrip("/")
        # We can implement get_song using yt.get_song(id) but it requires videoId.
        # It's primarily used for 'refetchMetadata' in frontend.
        r = yt.get_song(id)
        if not r or 'videoDetails' not in r:
            raise Exception("Song not found")
        
        details = r['videoDetails']
        thumbnails = details.get("thumbnail", {}).get("thumbnails", [])
        images = [{"url": t["url"]} for t in thumbnails]
        if not images:
             images = [{"url": "https://via.placeholder.com/500?text=No+Art"}]
             
        data = [{
            "id": details.get('videoId'),
            "name": details.get('title'),
            "artists": {
                "primary": [{"name": details.get("author"), "id": ""}]
            },
            "image": images,
            "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={details.get('videoId')}"}]
        }]
            
        return {"success": True, "data": data}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/stream")
def get_stream(id: str):
    if not id:
        return {"success": False, "error": "No ID provided"}
    
    import time
    current_time = time.time()
    
    # Check cache
    if id in stream_cache:
        cached_url, timestamp = stream_cache[id]
        if current_time - timestamp < CACHE_TTL:
            return RedirectResponse(cached_url)
    
    url = f"https://music.youtube.com/watch?v={id}"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            print(f"Fetching fresh stream for: {id}")
            info = ydl.extract_info(url, download=False)
            stream_url = info['url']
            
            # Save to cache
            stream_cache[id] = (stream_url, current_time)
            
            return RedirectResponse(stream_url)
    except Exception as e:
         return {"success": False, "error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
