// Global Application State and Core Logic
const API_BASE = window.location.origin;

const state = {
    currentRoute: 'home',
    searchQuery: '',
    isPlaying: false,
    currentTrackIndex: -1,
    currentTrack: null,
    isShuffle: false,
    isRepeat: false,
    theme: localStorage.getItem('theme') || 'dark',
    quality: localStorage.getItem('quality') || 'normal',
    currentTimeText: "0:00",
    durationText: "0:00",
    progressPercent: 0,
    tracksData: [],
    artistsData: [],
    isLoading: true,
    showMoreOptions: false,
    favorites: JSON.parse(localStorage.getItem('favorites')) || [],
    playlists: JSON.parse(localStorage.getItem('playlists')) || { 'My Library': [] },
    artistDetails: null,
    artistCache: {},
    currentArtistId: null,
    artistError: false,
    showPlaylistModal: false,
    showCreatePlaylistModal: false,
    suggestions: [],
    showSuggestions: false
};

const getFilteredTracks = () => {
    if (state.currentRoute === 'library') {
        const base = state.favorites;
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            return base.filter(t => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
        }
        return base;
    }
    
    // For 'search' and other routes, tracksData is either already exactly matched from the API
    // or we don't apply client-side filtering.
    return state.tracksData;
};

const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return m + ":" + (s < 10 ? "0" + s : s);
};

// Download URL Quality Mapper based on state preference
const getDownloadUrlByQuality = (downloadUrls) => {
    if (!downloadUrls || downloadUrls.length === 0) return '';
    let target = '';
    // Typically the array holds qualities like ['12kbps', '48kbps', '96kbps', '160kbps', '320kbps']
    if (state.quality === 'low') target = '12kbps';
    else if (state.quality === 'normal') target = '48kbps';
    else if (state.quality === 'high') target = '160kbps';
    else target = '320kbps'; // extreme

    const match = downloadUrls.find(u => u.quality === target);
    if (match) return match.url;
    // Fallback to lowest available (fastest loading)
    return downloadUrls[0].url;
};

// In-flight search request controller — cancels stale requests
let searchAbortController = null;
let suggestAbortController = null;
let suggestionTimer;

const fetchSuggestions = async (query) => {
    if (suggestAbortController) suggestAbortController.abort();
    suggestAbortController = new AbortController();
    const signal = suggestAbortController.signal;
    try {
        const res = await fetch(`${API_BASE}/search?query=${encodeURIComponent(query)}`, { signal });
        const json = await res.json();
        if (json.success && json.data) {
            let suggestions = [];
            if (json.data.songs && json.data.songs.results) {
                suggestions = [...suggestions, ...json.data.songs.results.map(s => ({ title: s.title, description: 'Song' }))];
            }
            if (json.data.artists && json.data.artists.results) {
                suggestions = [...suggestions, ...json.data.artists.results.map(s => ({ title: s.title, description: 'Artist' }))];
            }
            if (json.data.albums && json.data.albums.results) {
                suggestions = [...suggestions, ...json.data.albums.results.map(s => ({ title: s.title, description: 'Album' }))];
            }
            
            // Remove exact duplicates by title
            const unique = [];
            const seen = new Set();
            for (const item of suggestions) {
                const cleanedTitle = item.title.replace(/&quot;/g, '"').replace(/&amp;/g, '&');
                if (!seen.has(cleanedTitle.toLowerCase())) {
                    seen.add(cleanedTitle.toLowerCase());
                    unique.push({ ...item, title: cleanedTitle });
                }
            }
            
            state.suggestions = unique.slice(0, 5);
            state.showSuggestions = true;
        } else {
            state.suggestions = [];
            state.showSuggestions = false;
        }
    } catch(e) {
        if (e.name === 'AbortError') return;
        state.suggestions = [];
        state.showSuggestions = false;
    } finally {
        if (!signal.aborted) window.updateStateUI();
    }
};

// Fetch wrapper with mapping
const fetchSearch = async (query) => {
    // Cancel any in-flight request so stale results never overwrite newer ones
    if (searchAbortController) searchAbortController.abort();
    searchAbortController = new AbortController();
    const signal = searchAbortController.signal;

    state.isLoading = true;
    window.updateStateUI(); // Non-destructive — never touches the search input

    try {
        const [songsRes, artistsRes] = await Promise.all([
            fetch(`${API_BASE}/search/songs?query=${encodeURIComponent(query)}&limit=15`, { signal }),
            fetch(`${API_BASE}/search/artists?query=${encodeURIComponent(query)}&limit=10`, { signal })
        ]);

        const sJson = await songsRes.json();
        const aJson = await artistsRes.json();

        if (sJson.success && sJson.data.results) {
            state.tracksData = sJson.data.results.map(obj => {
                let artistName = 'Unknown Artist';
                if (obj.artists && obj.artists.primary && obj.artists.primary.length > 0) {
                    artistName = obj.artists.primary.map(a => a.name).join(', ');
                } else if (obj.artists && obj.artists.all && obj.artists.all.length > 0) {
                    artistName = obj.artists.all.map(a => a.name).join(', ');
                }

                let imageUrl = 'https://via.placeholder.com/500?text=No+Art';
                if (obj.image && obj.image.length > 0) {
                    imageUrl = obj.image[obj.image.length - 1].url;
                }

                return {
                    id: obj.id,
                    title: obj.name.replace(/&quot;/g, '"'),
                    artist: artistName,
                    image: imageUrl,
                    url: getDownloadUrlByQuality(obj.downloadUrl),
                    duration: obj.duration,
                    srcObj: obj
                };
            });

            if (!state.currentTrack && state.tracksData.length > 0 && query === 'Top Hits') {
                state.currentTrack = state.tracksData[0];
                state.currentTrackIndex = 0;
            }
        } else {
            state.tracksData = [];
        }

        if (aJson.success && aJson.data.results) {
            state.artistsData = aJson.data.results.map(obj => {
                let imageUrl = 'https://via.placeholder.com/150?text=Artist';
                if (obj.image && obj.image.length > 0) {
                    imageUrl = obj.image[obj.image.length - 1].url;
                }
                return { id: obj.id, name: obj.title || obj.name, image: imageUrl };
            });
        } else {
            state.artistsData = [];
        }

    } catch (err) {
        if (err.name === 'AbortError') return; // Stale request — silently ignore
        console.error('Search failed:', err);
    } finally {
        if (!signal.aborted) {
            state.isLoading = false;
            // Use targeted partial update — NEVER a full render — so input keeps focus
            window.updateStateUI();
        }
    }
};

const fetchArtistDetails = async (id) => {
    if (!id) return;
    state.currentArtistId = id;
    
    // 1. Check Cache first
    if (state.artistCache[id]) {
        state.artistDetails = state.artistCache[id];
        state.tracksData = state.artistDetails.songs;
        state.artistError = false;
        state.isLoading = false;
        window.render();
        return;
    }

    state.isLoading = true;
    state.artistError = false;
    state.artistDetails = null;
    window.render();

    // 2. Setup Fetch with Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
        const res = await fetch(`${API_BASE}/artists?id=${id}`, { signal: controller.signal });
        const json = await res.json();
        clearTimeout(timeoutId);

        if (json.success && json.data) {
            const data = json.data;
            const details = {
                id: data.id,
                name: data.name,
                image: data.image[data.image.length - 1].url,
                songs: data.topSongs.map(obj => ({
                    id: obj.id,
                    title: obj.name.replace(/&quot;/g, '"'),
                    artist: obj.artists.primary.map(a => a.name).join(', '),
                    image: obj.image[obj.image.length - 1].url,
                    url: getDownloadUrlByQuality(obj.downloadUrl),
                    duration: obj.duration,
                    srcObj: obj
                })),
                albums: data.topAlbums.map(obj => ({
                    id: obj.id,
                    title: obj.name.replace(/&quot;/g, '"'),
                    year: obj.year,
                    image: obj.image[obj.image.length - 1].url
                }))
            };
            
            // 3. Cache the result
            state.artistCache[id] = details;
            state.artistDetails = details;
            state.tracksData = state.artistDetails.songs;
        } else {
            throw new Error("API returned failure status");
        }
    } catch (err) {
        console.error("Failed to fetch artist details:", err);
        state.artistError = true;
    } finally {
        state.isLoading = false;
        window.render();
    }
};

window.artistCore = {
    fetch: fetchArtistDetails,
    retry: () => fetchArtistDetails(state.currentArtistId)
};

// Initialize Audio Element
const audioObj = new Audio();
audioObj.preload = 'auto';
if (state.currentTrack) audioObj.src = state.currentTrack.url;

// Audio Event Listeners
audioObj.addEventListener('timeupdate', () => {
    state.currentTimeText = formatTime(audioObj.currentTime);
    state.durationText = formatTime(audioObj.duration);
    state.progressPercent = (audioObj.currentTime / audioObj.duration) * 100 || 0;

    const pBar1 = document.getElementById('progress-bar-full');
    if (pBar1) pBar1.style.width = state.progressPercent + "%";
    const pBar2 = document.getElementById('progress-bar-mini');
    if (pBar2) pBar2.style.width = state.progressPercent + "%";

    const timeCurr = document.getElementById('time-current');
    if (timeCurr) timeCurr.innerText = state.currentTimeText;
});

audioObj.addEventListener('loadedmetadata', () => {
    state.durationText = formatTime(audioObj.duration);
    const timeDur = document.getElementById('time-duration');
    if (timeDur) timeDur.innerText = state.durationText;
});

audioObj.addEventListener('ended', () => {
    if (state.isRepeat) {
        audioObj.currentTime = 0;
        audioObj.play();
    } else {
        window.playerCore.next();
    }
});

let debounceTimer;

// App Core
window.appCore = {
    onSearch: (e) => {
        const val = e.target.value;
        state.searchQuery = val;
        
        if (val.trim() === '') {
            state.showSuggestions = false;
            window.updateStateUI();
        }

        if (state.currentRoute === 'library') {
            // Library search is instant local filter — no API, no full re-render
            clearTimeout(debounceTimer);
            const libEl = document.getElementById('library-tracks');
            if (libEl) libEl.innerHTML = renderLibraryTracks();
            return;
        }

        // Show spinner immediately on the icon — no DOM rebuild
        const icon = document.getElementById('search-icon');
        if (icon && val.trim().length > 0) {
            icon.textContent = 'progress_activity';
            icon.classList.add('spinning');
        } else if (icon) {
            icon.textContent = 'search';
            icon.classList.remove('spinning');
        }

        // Fetch autocomplete suggestions instantly
        clearTimeout(suggestionTimer);
        suggestionTimer = setTimeout(() => {
            if (state.searchQuery.trim().length > 0) {
                fetchSuggestions(state.searchQuery.trim());
            }
        }, 150);

        // General search: debounce the API call so it only fires when user pauses typing
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = state.searchQuery.trim();
            if (query.length > 0) {
                fetchSearch(query);
                state.showSuggestions = false; // Hide suggestions once full search executes
            } else if (query.length === 0) {
                state.showSuggestions = false;
                fetchSearch('Top Hits');
            }
        }, 800); // 800ms gives time to see suggestions before auto-loading full results
    },
    applySuggestion: (text) => {
        state.searchQuery = text;
        const input = document.getElementById('main-search');
        if (input) input.value = text;
        state.showSuggestions = false;
        state.suggestions = [];
        clearTimeout(debounceTimer);
        clearTimeout(suggestionTimer);
        fetchSearch(text);
        window.updateStateUI();
    },
    clearSearch: () => {
        state.searchQuery = '';
        state.showSuggestions = false;
        // Reset to default tracks
        fetchSearch('Top Hits');
        // Clear the input value directly without a full re-render
        const input = document.getElementById('main-search');
        if (input) { input.value = ''; input.focus(); }
        // Re-render so the clear button disappears
        window.render();
    },
    toggleTheme: () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.className = state.theme;
        localStorage.setItem('theme', state.theme);
        window.render();
    },
    setQuality: (e) => {
        state.quality = e.target.value;
        localStorage.setItem('quality', state.quality);

        // Rebuild the current playing track URL just in case format drops
        if (state.currentTrack && state.currentTrack.srcObj) {
            const currentPosition = audioObj.currentTime;
            state.currentTrack.url = getDownloadUrlByQuality(state.currentTrack.srcObj.downloadUrl);
            audioObj.src = state.currentTrack.url;
            audioObj.currentTime = currentPosition;
            if (state.isPlaying) audioObj.play();
        }
    },
    playFeatured: () => {
        if (state.tracksData.length > 0) window.playerCore.play(state.tracksData[0].id);
    },
    shuffleAll: () => {
        if (state.tracksData.length === 0) return;
        state.isShuffle = true;
        window.playerCore.play(state.tracksData[Math.floor(Math.random() * state.tracksData.length)].id);
    }
};

window.playerCore = {
    play: (id) => {
        if (state.currentTrack && state.currentTrack.id === id) {
            window.playerCore.togglePlay();
            return;
        }
        
        const index = state.tracksData.findIndex(t => t.id === id);
        if (index > -1) {
            state.currentTrackIndex = index;
            state.currentTrack = state.tracksData[index];
            audioObj.src = state.currentTrack.url;
            state.isPlaying = true;
            audioObj.play().catch(e => console.error("Audio playback failed:", e));
            window.updateStateUI();
        }
    },
    togglePlay: (e) => {
        if (e) e.stopPropagation();
        if (!state.currentTrack && state.tracksData.length > 0) {
            // Provide a graceful fallback to start playing top track if nothing is loaded
            this.play(state.tracksData[0].id);
            return;
        }

        if (state.isPlaying) {
            audioObj.pause();
        } else {
            audioObj.play().catch(e => console.error(e));
        }
        state.isPlaying = !state.isPlaying;
        window.updateStateUI();
    },
    next: (e) => {
        if (e) e.stopPropagation();
        if (state.tracksData.length === 0) return;
        if (state.isShuffle) {
            state.currentTrackIndex = Math.floor(Math.random() * state.tracksData.length);
        } else {
            state.currentTrackIndex = (state.currentTrackIndex + 1) % state.tracksData.length;
        }
        state.currentTrack = state.tracksData[state.currentTrackIndex];
        audioObj.src = state.currentTrack.url;
        if (state.isPlaying) audioObj.play();
        window.render();
    },
    prev: (e) => {
        if (e) e.stopPropagation();
        if (state.tracksData.length === 0) return;
        state.currentTrackIndex = (state.currentTrackIndex - 1 + state.tracksData.length) % state.tracksData.length;
        state.currentTrack = state.tracksData[state.currentTrackIndex];
        audioObj.src = state.currentTrack.url;
        if (state.isPlaying) audioObj.play();
        window.updateStateUI();
    },
    toggleShuffle: (e) => {
        if (e) e.stopPropagation();
        state.isShuffle = !state.isShuffle;
        window.updateStateUI();
    },
    toggleRepeat: (e) => {
        if (e) e.stopPropagation();
        state.isRepeat = !state.isRepeat;
        window.updateStateUI();
    },
    seek: (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audioObj.currentTime = percent * audioObj.duration;
    },
    toggleMoreOptions: (e, id) => {
        if (e) e.stopPropagation();
        if (id) {
            // Find track in any available source
            const track = state.tracksData.find(t => t.id === id) || 
                          state.favorites.find(t => t.id === id) ||
                          (state.artistDetails && state.artistDetails.songs.find(s => s.id === id));
            if (track) state.currentTrack = track;
        }
        state.showMoreOptions = !state.showMoreOptions;
        window.render();
    },
    playNext: () => {
        state.showMoreOptions = false;
        // In this simple app, we just move current track to start or just acknowledge
        console.log("Confirming Play Next for current session.");
        window.render();
    },
    addToQueue: () => {
        state.showMoreOptions = false;
        console.log("Confirming Add to Queue for current session.");
        window.render();
    },
    toggleFavorite: (id) => {
        const track = id ? (state.tracksData.find(t => t.id === id) || state.favorites.find(t => t.id === id)) : state.currentTrack;
        if (!track) return;
        const index = state.favorites.findIndex(f => f.id === track.id);
        if (index > -1) {
            state.favorites.splice(index, 1);
        } else {
            state.favorites.push(track);
        }
        localStorage.setItem('favorites', JSON.stringify(state.favorites));
        state.showMoreOptions = false;
        window.render();
    },

    confirmAddToPlaylist: (name) => {
        const track = state.currentTrack;
        if (!track || !state.playlists[name]) return;
        if (!state.playlists[name].find(t => t.id === track.id)) {
            state.playlists[name].push(track);
            localStorage.setItem('playlists', JSON.stringify(state.playlists));
        }
        state.showPlaylistModal = false;
        window.render();
    },
    togglePlaylistModal: (show) => {
        state.showPlaylistModal = show;
        window.render();
    },
    toggleCreatePlaylistModal: (show) => {
        state.showCreatePlaylistModal = show;
        window.render();
        if (show) {
            setTimeout(() => {
                const el = document.getElementById('new-playlist-input');
                if (el) el.focus();
            }, 100);
        }
    },
    confirmCreatePlaylist: () => {
        const el = document.getElementById('new-playlist-input');
        const name = el ? el.value.trim() : '';
        if (name && !state.playlists[name]) {
            state.playlists[name] = [];
            localStorage.setItem('playlists', JSON.stringify(state.playlists));
            state.showCreatePlaylistModal = false;
            window.render();
        } else if (name) {
            alert("Playlist already exists!");
        }
    },
    createPlaylist: () => {
        window.appCore.toggleCreatePlaylistModal(true);
    },
    deletePlaylist: (name) => {
        if (name === 'My Library') {
            alert("This is a system playlist and cannot be deleted.");
            return;
        }
        if (confirm(`Are you sure you want to delete '${name}'?`)) {
            delete state.playlists[name];
            localStorage.setItem('playlists', JSON.stringify(state.playlists));
            window.render();
        }
    },
    shuffleAll: () => {
        const tracks = getFilteredTracks();
        if (tracks.length === 0) return;
        state.isShuffle = true;
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        state.tracksData = shuffled;
        window.playerCore.play(shuffled[0].id);
    },
    shufflePlaylist: (name) => {
        const tracks = state.playlists[name];
        if (!tracks || tracks.length === 0) {
            alert("This playlist is empty.");
            return;
        }
        state.isShuffle = true;
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        state.tracksData = shuffled;
        window.playerCore.play(shuffled[0].id);
    },
    toggleTheme: () => {
        state.theme = state.theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', state.theme);
        localStorage.setItem('theme', state.theme);
        window.render();
    },
    addToPlaylist: () => {
        state.showMoreOptions = false;
        state.showPlaylistModal = true;
        window.render();
    },
    smartReplace: () => {
        state.quality = 'extreme';
        localStorage.setItem('quality', 'extreme');
        if (state.currentTrack && state.currentTrack.srcObj) {
            const currentPos = audioObj.currentTime;
            state.currentTrack.url = getDownloadUrlByQuality(state.currentTrack.srcObj.downloadUrl);
            audioObj.src = state.currentTrack.url;
            audioObj.currentTime = currentPos;
            if (state.isPlaying) audioObj.play();
        }
        state.showMoreOptions = false;
        window.render();
    },
    refetchMetadata: async () => {
        if (!state.currentTrack) return;
        state.isLoading = true;
        window.render();
        try {
            const res = await fetch(`${API_BASE}/songs?id=${state.currentTrack.id}`);
            const json = await res.json();
            if (json.success && json.data && json.data.length > 0) {
                const obj = json.data[0];
                state.currentTrack.title = obj.name;
                state.currentTrack.artist = obj.artists.primary.map(a => a.name).join(', ');
                state.currentTrack.image = obj.image[obj.image.length - 1].url;
            }
        } catch (e) {
            console.error(e);
        }
        state.isLoading = false;
        state.showMoreOptions = false;
        window.render();
    },
    downloadCurrent: () => {
        if (!state.currentTrack) return;
        const link = document.createElement('a');
        link.href = state.currentTrack.url;
        link.download = `${state.currentTrack.title}.mp3`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        state.showMoreOptions = false;
        window.render();
    },
    shareCurrent: () => {
        if (navigator.share) {
            navigator.share({
                title: state.currentTrack.title,
                text: `${state.currentTrack.title} by ${state.currentTrack.artist}`,
                url: window.location.href
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
        state.showMoreOptions = false;
        window.render();
    }
};

window.router = {
    navigate: (path) => {
        window.location.hash = path;
    },
    back: () => {
        if (window.history.length > 1 && document.referrer.includes(window.location.host)) {
            window.history.back();
        } else {
            window.router.navigate('home');
        }
    }
};

const renderRecommended = () => {
    const sourceTracks = getFilteredTracks();
    if (state.isLoading) {
        return Array(4).fill(0).map(() => window.components.SkeletonCard()).join('');
    }
    if (sourceTracks.length === 0) return '<p class="text-on-surface-variant text-sm mx-6">No tracks found.</p>';
    return sourceTracks.slice(0, 4).map(track => `
    <div class="min-w-[200px] group cursor-pointer" onclick="window.playerCore.play('${track.id}')">
        <div class="relative aspect-square rounded-xl overflow-hidden mb-4 shadow-xl">
            <img alt="Album Art" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" src="${track.image}"/>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div class="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed transform scale-90 group-hover:scale-100 transition-transform duration-300">
                    <span class="material-symbols-outlined fill">${state.currentTrack?.id === track.id && state.isPlaying ? 'pause' : 'play_arrow'}</span>
                </div>
            </div>
        </div>
        <h4 class="font-headline text-lg font-bold truncate leading-tight">${track.title}</h4>
        <p class="text-on-surface-variant font-label text-sm tracking-wide mt-1 truncate hover:underline cursor-pointer" onclick="event.stopPropagation(); window.router.navigate('artist/' + '${track.srcObj?.artists?.primary?.[0]?.id || ''}')">${track.artist}</p>
    </div>`).join('');
};

const renderLatestHeat = () => {
    const sourceTracks = getFilteredTracks();
    if (state.isLoading) {
        return Array(4).fill(0).map(() => window.components.SkeletonRow()).join('');
    }
    if (sourceTracks.length === 0) return '';
    return sourceTracks.slice(4, 8).map(track => `
    <div class="flex items-center gap-4 group cursor-pointer mb-2" onclick="window.playerCore.play('${track.id}')">
        <div class="w-16 h-16 rounded-lg overflow-hidden bg-surface-container relative shrink-0">
            <img alt="Track" class="w-full h-full object-cover group-hover:opacity-50 transition-opacity" src="${track.image}"/>
            <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white fill">play_arrow</span>
            </div>
        </div>
        <div class="flex-1 min-w-0">
            <h5 class="font-headline font-bold text-on-surface truncate ${state.currentTrack?.id === track.id ? 'text-primary' : ''}">${track.title}</h5>
            <p class="text-on-surface-variant text-sm font-label truncate hover:underline cursor-pointer" onclick="event.stopPropagation(); window.router.navigate('artist/' + '${track.srcObj?.artists?.primary?.[0]?.id || ''}')">${track.artist}</p>
        </div>
        <button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors shrink-0 z-10" onclick="event.stopPropagation(); window.playerCore.toggleMoreOptions(event, '${track.id}')">more_vert</button>
    </div>`).join('');
};

const renderLibraryTracks = () => {
    const sourceTracks = getFilteredTracks();
    if (state.isLoading && sourceTracks.length === 0) {
        return Array(6).fill(0).map(() => window.components.SkeletonRow()).join('');
    }
    if (sourceTracks.length === 0) return '<p class="text-on-surface-variant text-sm py-4 text-center">No tracks matched your search.</p>';
    return sourceTracks.map((track, i) => {
        const isFav = state.favorites.some(f => f.id === track.id);
        return `
    <div class="grid grid-cols-12 gap-4 px-4 py-4 items-center group hover:bg-surface-container-high rounded-xl transition-all cursor-pointer" onclick="window.playerCore.play('${track.id}')">
        <div class="col-span-1 text-center font-label text-on-surface-variant text-sm group-hover:hidden">${i + 1}</div>
        <div class="col-span-1 text-center text-primary hidden group-hover:block">
            <span class="material-symbols-outlined text-xl fill">play_arrow</span>
        </div>
        <div class="col-span-10 md:col-span-6 flex items-center gap-4 min-w-0">
            <img class="w-12 h-12 rounded shadow-md object-cover shrink-0" src="${track.image}"/>
            <div class="min-w-0">
                <p class="font-bold truncate text-on-surface ${state.currentTrack?.id === track.id ? 'text-primary' : ''}">${track.title}</p>
                <p class="text-xs truncate text-on-surface-variant font-medium hover:underline cursor-pointer" onclick="event.stopPropagation(); window.router.navigate('artist/' + '${track.srcObj?.artists?.primary?.[0]?.id || ''}')">${track.artist}</p>
            </div>
        </div>
        <div class="hidden md:block col-span-4 text-sm text-on-surface-variant truncate">Unknown Album</div>
        <div class="hidden md:flex col-span-1 justify-end items-center gap-4">
            <span class="material-symbols-outlined text-primary text-sm ${isFav ? 'fill' : ''} hover:scale-125 transition-transform" onclick="event.stopPropagation(); window.playerCore.toggleFavorite('${track.id}')">favorite</span>
            <button class="material-symbols-outlined text-on-surface-variant text-sm hover:text-primary transition-colors z-10" onclick="event.stopPropagation(); window.playerCore.toggleMoreOptions(event, '${track.id}')">more_vert</button>
            <span class="text-sm text-on-surface-variant tabular-nums">${formatTime(track.duration)}</span>
        </div>
    </div>`;
    }).join('');
};

const renderSearchArtists = () => {
    if (state.isLoading && (!state.artistsData || state.artistsData.length === 0)) {
        return Array(6).fill(0).map(() => window.components.SkeletonCircle()).join('');
    }
    if (!state.artistsData || state.artistsData.length === 0) return '<p class="text-on-surface-variant text-sm">No artists found.</p>';
    return state.artistsData.map(artist => `
        <div class="flex flex-col items-center gap-2 group cursor-pointer min-w-[100px]" onclick="window.router.navigate('artist/${artist.id}')">
            <div class="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden shadow-lg border-2 border-transparent group-hover:border-primary transition-all">
                <img src="${artist.image}" alt="${artist.name}" class="w-full h-full object-cover group-hover:scale-110 transition-transform"/>
            </div>
            <p class="font-label text-xs sm:text-sm font-bold truncate w-full text-center group-hover:text-primary transition-colors">${artist.name}</p>
        </div>
    `).join('');
};
const renderSearchTracks = () => {
    const sourceTracks = getFilteredTracks();
    if (state.isLoading && sourceTracks.length === 0) {
        return Array(6).fill(0).map(() => window.components.SkeletonRow()).join('');
    }
    if (sourceTracks.length === 0) return '<p class="text-on-surface-variant text-sm py-4">No tracks found.</p>';
    return sourceTracks.map(track => `
    <div class="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-surface-container transition-colors" onclick="window.playerCore.play('${track.id}')">
        <div class="w-14 h-14 rounded-lg overflow-hidden relative shrink-0">
            <img alt="Track" class="w-full h-full object-cover" src="${track.image}"/>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span class="material-symbols-outlined text-white text-3xl">play_arrow</span>
            </div>
        </div>
        <div class="flex-1 min-w-0">
            <h5 class="font-headline font-bold text-on-surface truncate ${state.currentTrack?.id === track.id ? 'text-primary' : ''}">${track.title}</h5>
            <p class="text-on-surface-variant text-xs font-label truncate mt-1 cursor-pointer hover:underline" onclick="event.stopPropagation(); window.router.navigate('artist/${track.srcObj?.artists?.primary?.[0]?.id || ''}')">${track.artist}</p>
        </div>
        <button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors shrink-0 ml-2 z-10" onclick="event.stopPropagation(); window.playerCore.toggleMoreOptions(event, '${track.id}')">more_vert</button>
        <span class="text-xs text-on-surface-variant tabular-nums shrink-0 ml-2">${formatTime(track.duration)}</span>
    </div>`).join('');
};

const renderArtistSongs = () => {
    if (!state.artistDetails || !state.artistDetails.songs) return '';
    return state.artistDetails.songs.map((track, i) => `
    <div class="flex items-center gap-4 group cursor-pointer p-3 rounded-xl hover:bg-surface-container transition-colors" onclick="window.playerCore.play('${track.id}')">
        <div class="w-12 h-12 rounded-lg overflow-hidden relative shrink-0">
            <img alt="Track" class="w-full h-full object-cover" src="${track.image}"/>
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span class="material-symbols-outlined text-white text-2xl">play_arrow</span>
            </div>
        </div>
        <div class="flex-1 min-w-0">
            <h5 class="font-headline font-bold text-on-surface truncate ${state.currentTrack?.id === track.id ? 'text-primary' : ''}">${track.title}</h5>
            <p class="text-on-surface-variant text-xs font-label truncate">${track.artist}</p>
        </div>
        <button class="material-symbols-outlined text-on-surface-variant hover:text-primary transition-colors shrink-0 ml-2 z-10" onclick="event.stopPropagation(); window.playerCore.toggleMoreOptions(event, '${track.id}')">more_vert</button>
        <span class="text-xs text-on-surface-variant tabular-nums shrink-0 ml-2">${formatTime(track.duration)}</span>
    </div>`).join('');
};

const renderArtistAlbums = () => {
    if (!state.artistDetails || !state.artistDetails.albums) return '';
    return state.artistDetails.albums.map(album => `
    <div class="flex items-center gap-4 p-3 rounded-2xl bg-surface-container-high group cursor-pointer hover:bg-surface-variant transition-all">
        <img src="${album.image}" class="w-16 h-16 rounded-xl object-cover shadow-lg group-hover:scale-105 transition-transform" />
        <div class="flex-1 min-w-0">
            <h4 class="font-headline font-bold truncate">${album.title}</h4>
            <p class="text-on-surface-variant text-xs font-label uppercase tracking-widest mt-1">${album.year}</p>
        </div>
        <span class="material-symbols-outlined text-primary opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
    </div>`).join('');
};

const renderAutocompleteSuggestions = () => {
    if (!state.showSuggestions || !state.suggestions || state.suggestions.length === 0) return '';
    return `
        <div class="absolute top-full left-0 right-0 mt-2 bg-surface-container-highest backdrop-blur-3xl rounded-2xl shadow-2xl p-2 z-[60] border border-outline-variant/10">
            ${state.suggestions.map(s => `
                <div class="flex items-center gap-3 p-3 hover:bg-surface-variant/50 rounded-xl cursor-pointer transition-colors" onclick="window.appCore.applySuggestion('${s.title.replace(/'/g, "\\'")}')">
                    <span class="material-symbols-outlined text-on-surface-variant text-sm">search</span>
                    <div>
                        <p class="font-headline font-bold text-on-surface text-sm">${s.title}</p>
                        ${s.description ? `<p class="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">${s.description.substring(0, 40)}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

window.addEventListener('hashchange', () => {
    const hash = window.location.hash.slice(1);
    if (hash.startsWith('artist/')) {
        state.currentRoute = 'artist';
        const artistId = hash.split('/')[1];
        fetchArtistDetails(artistId);
    } else {
        state.currentRoute = hash || 'home';
        state.searchQuery = ''; // reset search on navigation
        window.render();
    }
});

window.updateStateUI = (preventRecursion = false) => {
    if (state.currentRoute === 'player') {
        if (!preventRecursion) {
            window.render();
        }
        return;
    }
    const rcEl = document.getElementById('recommended-tracks');
    if (rcEl) rcEl.innerHTML = renderRecommended();

    const lhEl = document.getElementById('latest-heat-tracks');
    if (lhEl) lhEl.innerHTML = renderLatestHeat();
    
    const libEl = document.getElementById('library-tracks');
    if (libEl) libEl.innerHTML = renderLibraryTracks();

    const stEl = document.getElementById('search-tracks');
    if (stEl) stEl.innerHTML = renderSearchTracks();
    
    const saEl = document.getElementById('search-artists');
    if (saEl) {
        saEl.innerHTML = renderSearchArtists();
        // Also toggle the parent section's visibility so artists appear without a full re-render
        const saSection = saEl.closest('section');
        if (saSection) {
            saSection.classList.toggle('hidden', !(state.artistsData && state.artistsData.length > 0));
        }
    }

    const asEl = document.getElementById('artist-songs');
    if (asEl) asEl.innerHTML = renderArtistSongs();

    const aaEl = document.getElementById('artist-albums');
    if (aaEl) aaEl.innerHTML = renderArtistAlbums();

    const suggEl = document.getElementById('autocomplete-suggestions');
    if (suggEl) suggEl.innerHTML = renderAutocompleteSuggestions();

    const miniWrapper = document.getElementById('mini-player-wrapper');
    if (miniWrapper && state.currentTrack) {
        miniWrapper.innerHTML = window.components.MiniPlayer(state.isPlaying, state.currentTrack, state.progressPercent);
    }

    // Stop the search spinner once results have loaded
    if (!state.isLoading) {
        const icon = document.getElementById('search-icon');
        if (icon && icon.classList.contains('spinning')) {
            icon.textContent = 'search';
            icon.classList.remove('spinning');
        }
    }
};

window.render = () => {
    // Sync initial Document theme
    document.documentElement.className = state.theme;

    const appEl = document.getElementById('app');
    let html = '';

    const isFullPlayer = state.currentRoute === 'player';

    if (!isFullPlayer) {
        html += window.components.TopAppBar;
    }

    if (state.currentRoute === 'home') {
        html += window.views.HomeView(state);
    } else if (state.currentRoute === 'search') {
        html += window.views.SearchView(state);
    } else if (state.currentRoute === 'library') {
        html += window.views.LibraryView(state);
    } else if (state.currentRoute === 'settings') {
        html += window.views.SettingsView(state);
    } else if (state.currentRoute === 'player') {
        html += window.views.PlayerView(state);
    } else if (state.currentRoute === 'artist') {
        html += window.views.ArtistView(state);
    } else {
        html += window.views.HomeView(state);
    }

    if (!isFullPlayer) {
        html += '<div id="mini-player-wrapper">';
        if (state.currentTrack) {
            html += window.components.MiniPlayer(state.isPlaying, state.currentTrack, state.progressPercent);
        }
        html += '</div>';
        html += window.components.BottomNavBar(state.currentRoute);
    }

    // Always include the More Options Menu in the root to handle global track options
    html += window.components.MoreOptionsMenu(state.showMoreOptions, state.currentTrack);
    html += window.components.PlaylistModal(state.showPlaylistModal, Object.keys(state.playlists));
    html += window.components.CreatePlaylistModal(state.showCreatePlaylistModal);

    appEl.innerHTML = html;

    // Initial render setup for track lists
    window.updateStateUI(true);
};

// Merge playerCore methods into appCore so both sets are accessible via window.appCore
Object.assign(window.appCore, window.playerCore);

// Start
document.addEventListener('DOMContentLoaded', () => {
    state.currentRoute = window.location.hash.slice(1) || 'home';
    window.render(); // Render base HTML structure first
    fetchSearch('Top Hits'); // Initial bootstrap
});
