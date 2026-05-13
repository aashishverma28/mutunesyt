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

# yt-dlp config optimized for cloud environments (bypassing bot detection)
ydl_opts = {
    'format': 'bestaudio/best',
    'quiet': True,
    'no_warnings': True,
    'nocheckcertificate': True,
    'ignoreerrors': False,
    'logtostderr': False,
    'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
    'extractor_args': {
        'youtube': {
            'player_client': ['ios'],
            'player_skip': ['webpage', 'configs', 'js'],
        }
    },
    'geo_bypass': True,
    'source_address': '0.0.0.0',
    'noplaylist': True
}

stream_cache = {}
CACHE_TTL = 3600

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
            mapped_results.append({"id": r.get('browseId'), "name": r.get('artist'), "image": images})
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
                thumbnails = s.get("thumbnails", [])
                images = [{"url": t["url"]} for t in thumbnails]
                songs.append({
                    "id": s.get('videoId'), "name": s.get('title'), "duration": 0,
                    "artists": {"primary": [{"name": a.get("name"), "id": a.get("id")} for a in s.get("artists", [])]},
                    "image": images if images else [{"url": "https://via.placeholder.com/500?text=No+Art"}],
                    "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={s.get('videoId')}"}]
                })
        
        albums = []
        if 'albums' in artist and 'results' in artist['albums']:
            for a in artist['albums']['results']:
                thumbnails = a.get("thumbnails", [])
                albums.append({"id": a.get('browseId'), "name": a.get('title'), "year": a.get('year'), "image": [{"url": t["url"]} for t in thumbnails]})

        return {"success": True, "data": {"id": id, "name": artist.get('name'), "image": [{"url": t["url"]} for t in artist.get('thumbnails', [])], "topSongs": songs, "topAlbums": albums}}
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/songs")
def get_song(request: Request, id: str):
    try:
        base_url = str(request.base_url).rstrip("/")
        r = yt.get_song(id)
        details = r['videoDetails']
        images = [{"url": t["url"]} for t in details.get("thumbnail", {}).get("thumbnails", [])]
        data = [{
            "id": details.get('videoId'), "name": details.get('title'),
            "artists": {"primary": [{"name": details.get("author"), "id": ""}]},
            "image": images if images else [{"url": "https://via.placeholder.com/500?text=No+Art"}],
            "downloadUrl": [{"quality": "320kbps", "url": f"{base_url}/stream?id={details.get('videoId')}"}]
        }]
        return {"success": True, "data": data}
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
        url = f"https://www.youtube.com/watch?v={id}"
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                if not info or 'url' not in info: raise Exception(f"Extraction failed for {id}")
                stream_url = info['url']
                stream_cache[id] = (stream_url, current_time)
        except Exception as e:
             return {"success": False, "error": str(e)}

    async def stream_proxy():
        headers = {'User-Agent': ydl_opts['user_agent'], 'Referer': 'https://www.youtube.com/'}
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                async with client.stream("GET", stream_url, headers=headers) as response:
                    if response.status_code != 200: return
                    async for chunk in response.aiter_bytes(): yield chunk
        except Exception as e:
            print(f"Proxy error: {e}")

    return StreamingResponse(stream_proxy(), media_type="audio/mpeg")

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
