const TopAppBar = `
<header class="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10">
    <nav class="flex items-center justify-between px-6 py-4 w-full">
        <h1 class="text-2xl font-bold tracking-tighter text-primary font-['Space_Grotesk'] tracking-tight">MUTUNES</h1>

    </nav>
</header>
`;

const BottomNavBar = (activeTab) => `
<nav class="fixed bottom-0 w-full z-50 rounded-t-[32px] bg-surface-bright/95 backdrop-blur-3xl shadow-[0_-8px_32px_rgba(0,0,0,0.15)] dark:shadow-[0_-8px_32px_rgba(0,0,0,0.5)] flex flex-col border-t border-outline-variant/10">
    <div class="flex justify-around items-center h-16 pt-2 px-8">
        <a class="flex flex-col items-center justify-center transition-all active:scale-90 duration-300 ${activeTab === 'home' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}" href="#home">
            <span class="material-symbols-outlined ${activeTab === 'home' ? 'fill' : ''}">home</span>
            <span class="font-['Manrope'] text-[10px] uppercase tracking-widest font-bold mt-1">Home</span>
        </a>
        <a class="flex flex-col items-center justify-center transition-all active:scale-90 duration-300 ${activeTab === 'search' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}" href="#search">
            <span class="material-symbols-outlined ${activeTab === 'search' ? 'fill' : ''}">search</span>
            <span class="font-['Manrope'] text-[10px] uppercase tracking-widest font-bold mt-1">Search</span>
        </a>
        <a class="flex flex-col items-center justify-center transition-all active:scale-90 duration-300 ${activeTab === 'library' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}" href="#library">
            <span class="material-symbols-outlined ${activeTab === 'library' ? 'fill' : ''}">library_music</span>
            <span class="font-['Manrope'] text-[10px] uppercase tracking-widest font-bold mt-1">Library</span>
        </a>
        <a class="flex flex-col items-center justify-center transition-all active:scale-90 duration-300 ${activeTab === 'settings' ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}" href="#settings">
            <span class="material-symbols-outlined ${activeTab === 'settings' ? 'fill' : ''}">settings</span>
            <span class="font-['Manrope'] text-[10px] uppercase tracking-widest font-bold mt-1">Settings</span>
        </a>
    </div>
    <div class="text-center pb-2 mt-1 z-50 relative pointer-events-auto">
        <a href="https://www.instagram.com/aashishverma_28?igsh=MXUzMDZ1NW15ZXp6Nw==" target="_blank" rel="noopener noreferrer" class="font-['Manrope'] text-[12px] uppercase tracking-[0.2em] text-primary/70 hover:text-primary font-bold transition-colors inline-block decoration-transparent hover:underline hover:decoration-primary">Made By Aashish Verma</a>
    </div>
</nav>
`;

const MiniPlayer = (isPlaying, track, progressPercent = 0) => `
<div id="mini-player-container" class="fixed bottom-24 left-6 right-6 z-40 bg-surface-container-highest/80 backdrop-blur-xl rounded-2xl p-3 flex items-center gap-4 shadow-2xl border border-outline-variant/10 cursor-pointer">
    <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
        <img alt="Current Art" class="w-full h-full object-cover" src="${track.image}"/>
    </div>
    <div class="flex-1 min-w-0" onclick="window.router.navigate('player')">
        <h6 class="font-headline text-sm font-bold truncate">${track.title}</h6>
        <p class="text-xs text-on-surface-variant font-label truncate hover:underline cursor-pointer" onclick="event.stopPropagation(); window.router.navigate('artist/' + '${track.srcObj?.artists?.primary?.[0]?.id || ''}')">${track.artist}</p>
    </div>
    <div class="flex items-center gap-4 px-2">
        <button class="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed shadow-lg shadow-primary/20" onclick="window.playerCore.togglePlay(event)">
            <span class="material-symbols-outlined fill">${isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
        <button class="text-on-surface hover:text-primary transition-colors" onclick="window.playerCore.next(event)">
            <span class="material-symbols-outlined fill">skip_next</span>
        </button>
    </div>
    <div class="absolute bottom-0 left-0 w-full h-[3px] bg-surface-variant overflow-hidden rounded-b-2xl">
        <div id="progress-bar-mini" class="h-full bg-gradient-to-r from-primary to-secondary shadow-[0_0_8px_rgba(129,236,255,0.6)]" style="width: ${progressPercent}%;"></div>
    </div>
</div>
`;

const MoreOptionsMenu = (show, track) => `
<div class="fixed inset-0 z-[110] transition-opacity duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" onclick="window.playerCore.toggleMoreOptions()"></div>
    <div class="absolute bottom-0 left-0 right-0 bg-surface-container-highest rounded-t-[32px] p-6 transition-transform duration-300 transform ${show ? 'translate-y-0' : 'translate-y-full'} shadow-[0_-8px_32px_rgba(0,0,0,0.4)]">
        <div class="w-12 h-1.5 bg-outline-variant/30 rounded-full mx-auto mb-8"></div>
        <div class="flex items-center gap-4 mb-8 px-2">
            <img src="${track?.image}" class="w-16 h-16 rounded-xl object-cover shadow-lg" />
            <div class="flex-1 min-w-0">
                <h3 class="font-headline text-xl font-bold truncate">${track?.title}</h3>
                <p class="text-on-surface-variant font-medium truncate">${track?.artist}</p>
            </div>
        </div>
        <div class="grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto no-scrollbar">
            <button onclick="window.playerCore.playNext()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">queue_play_next</span>
                <span class="font-bold text-sm">Play Next</span>
            </button>
            <button onclick="window.playerCore.addToQueue()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">playlist_add</span>
                <span class="font-bold text-sm">Add to Queue</span>
            </button>
            <button onclick="window.playerCore.toggleFavorite()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">favorite</span>
                <span class="font-bold text-sm">Add to Favorites</span>
            </button>
            <button onclick="window.playerCore.addToPlaylist()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">library_add</span>
                <span class="font-bold text-sm">Add to Playlist</span>
            </button>
            <button onclick="window.playerCore.smartReplace()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">auto_fix_high</span>
                <span class="font-bold text-sm">Smart Replace</span>
            </button>
            <button onclick="window.playerCore.refetchMetadata()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">refresh</span>
                <span class="font-bold text-sm">Get Latest Metadata</span>
            </button>
            <button onclick="window.playerCore.downloadCurrent()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">download</span>
                <span class="font-bold text-sm">Download</span>
            </button>
            <button onclick="window.playerCore.shareCurrent()" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-colors group text-left w-full">
                <span class="material-symbols-outlined text-on-surface-variant group-hover:text-primary">share</span>
                <span class="font-bold text-sm">Share</span>
            </button>
        </div>
    </div>
</div>
`;

const PlaylistModal = (show, playlists) => `
<div class="fixed inset-0 z-[120] transition-opacity duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" onclick="window.appCore.togglePlaylistModal(false)"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-md bg-surface-container-highest rounded-[32px] p-8 shadow-2xl border border-outline-variant/10">
        <h3 class="font-headline text-2xl font-bold mb-6 text-center">Add to Playlist</h3>
        <div class="space-y-2 max-h-[40vh] overflow-y-auto no-scrollbar mb-6">
            ${playlists.map(name => `
                <button onclick="window.appCore.confirmAddToPlaylist('${name}')" class="flex items-center gap-4 p-4 rounded-2xl hover:bg-surface-variant transition-all w-full text-left group">
                    <span class="material-symbols-outlined text-primary group-hover:scale-110 transition-transform">playlist_add</span>
                    <span class="font-bold text-sm">${name}</span>
                </button>
            `).join('')}
        </div>
        <button onclick="window.appCore.togglePlaylistModal(false)" class="w-full py-4 rounded-2xl bg-surface-variant font-bold text-sm hover:bg-outline-variant/20 transition-colors">CANCEL</button>
    </div>
</div>
`;

const CreatePlaylistModal = (show) => `
<div class="fixed inset-0 z-[130] transition-opacity duration-300 ${show ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}">
    <div class="absolute inset-0 bg-black/80 backdrop-blur-md" onclick="window.appCore.toggleCreatePlaylistModal(false)"></div>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-sm bg-surface-container-highest rounded-[32px] p-8 shadow-2xl border border-outline-variant/10 text-center">
        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="material-symbols-outlined text-primary text-3xl">add_box</span>
        </div>
        <h3 class="font-headline text-2xl font-bold mb-2">New Playlist</h3>
        <p class="text-on-surface-variant text-sm mb-8">Give your playlist a name to get started.</p>
        <input id="new-playlist-input" type="text" placeholder="Playlist Name" class="w-full bg-surface-variant/50 border border-outline-variant/20 rounded-2xl p-4 mb-8 text-center font-bold focus:outline-none focus:border-primary transition-colors" />
        <div class="flex gap-4">
            <button onclick="window.appCore.toggleCreatePlaylistModal(false)" class="flex-1 py-4 rounded-2xl bg-surface-variant font-bold text-sm">CANCEL</button>
            <button onclick="window.appCore.confirmCreatePlaylist()" class="flex-1 py-4 rounded-2xl bg-primary text-on-primary-fixed font-bold text-sm shadow-lg shadow-primary/20">CREATE</button>
        </div>
    </div>
</div>
`;

const SkeletonCard = () => `
<div class="min-w-[200px] animate-pulse">
    <div class="aspect-square rounded-xl bg-surface-container skeleton mb-4"></div>
    <div class="h-6 bg-surface-container skeleton rounded-md w-3/4 mb-2"></div>
    <div class="h-4 bg-surface-container skeleton rounded-md w-1/2"></div>
</div>
`;

const SkeletonRow = () => `
<div class="flex items-center gap-4 p-3 animate-pulse">
    <div class="w-14 h-14 rounded-lg bg-surface-container skeleton shrink-0"></div>
    <div class="flex-1 space-y-2">
        <div class="h-5 bg-surface-container skeleton rounded-md w-1/3"></div>
        <div class="h-3 bg-surface-container skeleton rounded-md w-1/4"></div>
    </div>
    <div class="w-8 h-8 rounded-full bg-surface-container skeleton shrink-0"></div>
</div>
`;

const SkeletonCircle = () => `
<div class="flex flex-col items-center gap-2 min-w-[100px] animate-pulse">
    <div class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-surface-container skeleton"></div>
    <div class="h-3 bg-surface-container skeleton rounded-md w-16 mt-1"></div>
</div>
`;

window.components = { TopAppBar, BottomNavBar, MiniPlayer, MoreOptionsMenu, PlaylistModal, CreatePlaylistModal, SkeletonCard, SkeletonRow, SkeletonCircle };
