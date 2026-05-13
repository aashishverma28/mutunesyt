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
import random

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

yt = YTMusic()

stream_cache = {}
CACHE_TTL = 3600

# PRE-DEFINED ROBUST INVIDIOUS INSTANCES (API ONLY)
INVIDIOUS_API_INSTANCES = [
    "https://invidious.snopyta.org/api/v1",
    "https://yewtu.be/api/v1",
    "https://invidious.flokinet.to/api/v1",
    "https://invidious.lunar.icu/api/v1",
    "https://inv.tux.digital/api/v1"
]

async def get_proxy_stream(video_id):
    """Attempt to get stream URL via public Invidious API fallbacks"""
    instances = list(INVIDIOUS_API_INSTANCES)
    random.shuffle(instances)
    
    async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
        for api_base in instances:
            try:
                r = await client.get(f"{api_base}/videos/{video_id}")
                if r.status_code == 200:
                    data = r.json()
                    formats = data.get("adaptiveFormats", [])
                    # Find audio only
                    audio = [f for f in formats if f.get("type", "").startswith("audio/")]
                    if audio:
                        audio.sort(key=lambda x: int(x.get("bitrate", 0)), reverse=True)
                        return audio[0]["url"]
            except:
                continue
    return None

@app.get("/search/songs")
async def search_songs(request: Request, query: str, limit: int = 15):
    try:
        base_url = str(request.base_url).rstrip("/")
        results = yt.search(query, filter="songs", limit=limit)
        mapped_results = []
        for r in results:
            thumbnails = r.get("thumbnails", [])
            mapped_results.append({
                "id": r.get('videoId'),
                "name": r.get('title'),
                "duration": r.get('duration_seconds', 0),
                "artists": {"primary": [{"name": a.get("name"), "id": a.get("id")} for a in r.get("artists", [])]},
                "image": [{"url": t["url"]} for t in thumbnails] if thumbnails else [{"url": "https://via.placeholder.com/500?text=No+Art"}],
                "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={r.get('videoId')}"}]
            })
        return {"success": True, "data": {"results": mapped_results}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/stream")
async def get_stream(id: str):
    if not id: return {"success": False, "error": "No ID provided"}
    current_time = time.time()
    stream_url = None
    
    if id in stream_cache:
        cached_url, timestamp = stream_cache[id]
        if current_time - timestamp < CACHE_TTL: stream_url = cached_url
    
    if not stream_url:
        # Step 1: Try Direct Extraction with multiple client fallback
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'extractor_args': {'youtube': {'player_client': ['ios', 'android', 'tv'], 'player_skip': ['webpage']}},
            'source_address': '0.0.0.0'
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"https://www.youtube.com/watch?v={id}", download=False)
                stream_url = info['url']
        except Exception as e:
            print(f"Direct extract failed: {e}")
            
        # Step 2: Fallback to Invidious API (Distributed IPs)
        if not stream_url:
            print(f"Using Invidious API fallback for {id}")
            stream_url = await get_proxy_stream(id)
            
        if not stream_url:
            return {"success": False, "error": "Could not extract stream. Render IP is blocked and fallbacks failed."}
            
        stream_cache[id] = (stream_url, current_time)

    async def stream_proxy():
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.youtube.com/'
        }
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                async with client.stream("GET", stream_url, headers=headers) as response:
                    if response.status_code != 200: return
                    async for chunk in response.aiter_bytes(): yield chunk
        except Exception as e:
            print(f"Proxy error: {e}")

    return StreamingResponse(stream_proxy(), media_type="audio/mpeg")

@app.get("/search/artists")
def search_artists(query: str, limit: int = 10):
    try:
        results = yt.search(query, filter="artists", limit=limit)
        mapped_results = [{"id": r.get('browseId'), "name": r.get('artist'), "image": [{"url": t["url"]} for t in r.get("thumbnails", [])]} for r in results]
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
                if not s.get('videoId'): continue
                songs.append({
                    "id": s.get('videoId'), "name": s.get('title'),
                    "artists": {"primary": [{"name": a.get("name"), "id": a.get("id")} for a in s.get("artists", [])]},
                    "image": [{"url": t["url"]} for t in s.get("thumbnails", [])],
                    "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={s.get('videoId')}"}]
                })
        return {"success": True, "data": {"id": id, "name": artist.get('name'), "image": [{"url": t["url"]} for t in artist.get('thumbnails', [])], "topSongs": songs}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/search")
def search_general(query: str = ""):
    if not query: return {"success": True, "data": []}
    try:
        results = yt.get_search_suggestions(query)
        songs = [{"title": r.get("title", "") if isinstance(r, dict) else r} for r in results]
        return {"success": True, "data": {"songs": {"results": songs}}}
    except Exception as e:
        return {"success": False, "error": str(e)}

app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def read_root(): return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
