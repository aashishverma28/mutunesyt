from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from ytmusicapi import YTMusic
import yt_dlp
import os
import httpx
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

yt = YTMusic()

# yt-dlp config for extracting audio stream URLs without downloading
ydl_opts = {
    'format': 'bestaudio/best',
    'quiet': True,
    'no_warnings': True,
    'nocheckcertificate': True,
    'ignoreerrors': False,
    'logtostderr': False,
    'user_agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'extractor_args': {
        'youtube': {
            'player_client': ['android', 'ios'],
            'player_skip': ['webpage', 'configs', 'js'],
        }
    },
    'geo_bypass': True
}

# In-memory cache for stream URLs to reduce YouTube lookups
# Format: { videoId: (url, timestamp) }
stream_cache = {}
CACHE_TTL = 3600  # 1 hour

@app.get("/debug")
def debug_info(id: str = "4NRXx6U8ABQ"):
    url = f"https://music.youtube.com/watch?v={id}"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                 return {"success": False, "error": "yt-dlp returned None"}
            return {"success": True, "url": info.get('url', 'No URL found')[:100]}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/search")
def search_general(query: str = ""):
    if not query:
        return {"success": True, "data": []}
    try:
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
                     continue
                
                thumbnails = s.get("thumbnails", [])
                images = [{"url": t["url"]} for t in thumbnails]
                if not images:
                    images = [{"url": "https://via.placeholder.com/500?text=No+Art"}]

                songs.append({
                    "id": s.get('videoId'),
                    "name": s.get('title'),
                    "duration": 0,
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
async def get_stream(id: str):
    if not id:
        return {"success": False, "error": "No ID provided"}
    
    current_time = time.time()
    
    stream_url = None
    if id in stream_cache:
        cached_url, timestamp = stream_cache[id]
        if current_time - timestamp < CACHE_TTL:
            stream_url = cached_url
    
    if not stream_url:
        url = f"https://music.youtube.com/watch?v={id}"
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                print(f"Fetching fresh stream for: {id}")
                info = ydl.extract_info(url, download=False)
                if not info or 'url' not in info:
                    raise Exception("yt-dlp failed to extract stream URL")
                stream_url = info['url']
                stream_cache[id] = (stream_url, current_time)
        except Exception as e:
             return {"success": False, "error": str(e)}

    async def stream_proxy():
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://music.youtube.com/',
        }
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                async with client.stream("GET", stream_url, headers=headers) as response:
                    if response.status_code != 200:
                        print(f"Failed to fetch stream: {response.status_code}")
                        return
                    async for chunk in response.aiter_bytes():
                        yield chunk
        except Exception as e:
            print(f"Proxy error for {id}: {e}")

    return StreamingResponse(stream_proxy(), media_type="audio/mpeg")

# MOVED STATIC FILES TO THE BOTTOM TO AVOID SHADOWING ROUTES
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
