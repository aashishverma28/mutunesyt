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

# VERSION FOR CACHE BUSTING
VERSION = "1.0.4"

# yt-dlp config for extracting audio stream URLs
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
            'player_client': ['android', 'web'],
        }
    },
    'geo_bypass': True,
    'source_address': '0.0.0.0', # Force IPv4
    'noplaylist': True
}

# In-memory cache for stream URLs
stream_cache = {}
CACHE_TTL = 3600

@app.get("/test_debug")
def test_debug(id: str = "4NRXx6U8ABQ"):
    url = f"https://www.youtube.com/watch?v={id}"
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            if not info:
                 return {"success": False, "version": VERSION, "error": "yt-dlp returned None"}
            return {"success": True, "version": VERSION, "url_found": bool(info.get('url'))}
    except Exception as e:
        return {"success": False, "version": VERSION, "error": str(e)}

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
        return {"success": True, "version": VERSION, "data": {"results": mapped_results}}
    except Exception as e:
        return {"success": False, "version": VERSION, "error": str(e)}

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
        url = f"https://www.youtube.com/watch?v={id}"
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info or 'url' not in info:
                    raise Exception(f"Failed to extract info for {id}")
                stream_url = info['url']
                stream_cache[id] = (stream_url, current_time)
        except Exception as e:
             return {"success": False, "version": VERSION, "error": str(e)}

    async def stream_proxy():
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.youtube.com/',
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

# General catch-all for search suggestions
@app.get("/search")
def search_general(query: str = ""):
    if not query:
        return {"success": True, "data": []}
    try:
        results = yt.get_search_suggestions(query)
        songs = [{"title": r.get("title", "") if isinstance(r, dict) else r} for r in results]
        return {"success": True, "data": {"songs": {"results": songs}}}
    except Exception as e:
        return {"success": False, "error": str(e)}

# Static files and root redirection at the bottom
app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
