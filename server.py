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
import re

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

async def get_vevioz_stream(video_id):
    """Fallback to Vevioz API for robust extraction"""
    # Vevioz returns a download button page, we need to extract the direct link if possible
    # Actually, they have a button API: https://api.vevioz.com/api/button/mp3/{id}
    # This is often used by small players
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            r = await client.get(f"https://api.vevioz.com/api/button/mp3/{video_id}")
            if r.status_code == 200:
                # Scrape the first <a href="..."> that looks like a download link
                match = re.search(r'href="(https://[^"]+?\.mp3[^"]*?)"', r.text)
                if match:
                    return match.group(1)
    except:
        pass
    return None

async def get_piped_stream(video_id):
    """Fallback to Piped API"""
    PIPED_INSTANCES = ["https://pipedapi.kavin.rocks", "https://api.piped.victr.me", "https://pipedapi.rivo.gg"]
    async with httpx.AsyncClient(timeout=10.0) as client:
        for base in PIPED_INSTANCES:
            try:
                r = await client.get(f"{base}/streams/{video_id}")
                if r.status_code == 200:
                    data = r.json()
                    streams = data.get("audioStreams", [])
                    if streams:
                        streams.sort(key=lambda x: x.get("bitrate", 0), reverse=True)
                        return streams[0]["url"]
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
        # Step 1: Try Direct with refined headers
        ydl_opts = {
            'format': 'bestaudio/best',
            'quiet': True,
            'no_warnings': True,
            'nocheckcertificate': True,
            'user_agent': 'com.google.ios.youtube/19.05.6 (iPhone16,2; U; CPU iOS 17_3_1 like Mac OS X; en_US)',
            'extractor_args': {'youtube': {'player_client': ['ios'], 'player_skip': ['webpage']}},
            'source_address': '0.0.0.0'
        }
        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f"https://www.youtube.com/watch?v={id}", download=False)
                stream_url = info['url']
        except:
            pass
            
        # Step 2: Fallback to Vevioz
        if not stream_url:
            print(f"Direct failed, trying Vevioz for {id}")
            stream_url = await get_vevioz_stream(id)
            
        # Step 3: Fallback to Piped
        if not stream_url:
            print(f"Vevioz failed, trying Piped for {id}")
            stream_url = await get_piped_stream(id)
            
        if not stream_url:
            return {"success": False, "error": "All extraction methods failed. Service is temporarily blocked by YouTube."}
            
        stream_cache[id] = (stream_url, current_time)

    async def stream_proxy():
        headers = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
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
