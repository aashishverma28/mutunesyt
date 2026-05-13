from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
from ytmusicapi import YTMusic
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

# Supabase Edge Extraction Config
SUPABASE_URL = "https://ogagawuaybvfuguejhgm.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nYWdhd3VheWJ2ZnVndWVqaGdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NTY4MTEsImV4cCI6MjA5NDIzMjgxMX0.K2N70M_AYiYIIybdweVsVfG4ONj6SFOxQD4vWx0i3cc"

stream_cache = {}
CACHE_TTL = 3600

async def get_supabase_edge_stream(video_id):
    """Extraction via Supabase Edge Function (Bypasses Render IP block)"""
    url = f"{SUPABASE_URL}/functions/v1/youtube-extractor"
    headers = {
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json={"id": video_id}, headers=headers)
            if r.status_code == 200:
                data = r.json()
                return data.get("url")
            else:
                print(f"Supabase Edge Error: {r.status_code} - {r.text}")
    except Exception as e:
        print(f"Supabase request failed: {e}")
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
                "duration": r.get("duration_seconds", 0),
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
        print(f"Routing extraction for {id} via Supabase Edge...")
        stream_url = await get_supabase_edge_stream(id)
        
        if not stream_url:
            return {"success": False, "error": "Edge extraction failed. YouTube bot detection is extremely high."}
            
        stream_cache[id] = (stream_url, current_time)

    async def stream_proxy():
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=60.0) as client:
                async with client.stream("GET", stream_url, headers=headers) as response:
                    if response.status_code != 200: return
                    async for chunk in response.aiter_bytes(): yield chunk
        except Exception as e:
            print(f"Proxy error: {e}")

    return StreamingResponse(stream_proxy(), media_type="audio/mpeg")

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

app.mount("/static", StaticFiles(directory="."), name="static")

@app.get("/")
def read_root(): return RedirectResponse(url="/static/index.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
