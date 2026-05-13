const HomeView = (state) => `
<main class="pt-24 pb-32 px-6 max-w-7xl mx-auto">
    <!-- Hero Search Section -->
    <section class="mb-12">
        <h2 class="font-headline text-4xl md:text-6xl font-bold mb-2 leading-none tracking-tighter">
            Discover your <span class="text-primary">Sonic Pulse.</span>
        </h2>
    </section>

    <!-- Popular Categories -->
    <section class="mb-16">
        <div class="flex items-baseline justify-between mb-8">
            <h3 class="font-headline text-2xl font-bold uppercase tracking-widest">Categories</h3>
            <button class="text-primary font-label text-sm font-bold tracking-widest hover:opacity-80 transition-opacity">EXPLORE ALL</button>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="relative h-40 md:h-56 rounded-xl overflow-hidden group cursor-pointer bg-surface-container" onclick="window.router.navigate('library')">
                <img alt="Pop Category" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9VYJMMCsGdzuJPL4P6dNAjHriK3Z_Ih4-_i8rjjGhGTju-mOQ_0FhmUKKxmXv2_Vx9A2WlYYENcQ0oo_lmoC9OWaZ7TtaVjzCFZYJ6fOEVE1gb2cdA36sZdjduW2HbJzRpxZJgRcbjKaZG9W95Odfe3IFhC3E5OJ573XCnwKIcYIy0MC0OLNkSXALfk48gC8OBX9tdOMwcY-oRAclTc3atc4Dn-2B1KwL4dCnIw6aaGNrfy25Qu_jIVBTGrrymANg8eskYAKjciE"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span class="absolute bottom-4 left-4 font-headline text-xl font-bold text-white">Pop</span>
            </div>
            <div class="relative h-40 md:h-56 rounded-xl overflow-hidden group cursor-pointer bg-surface-container" onclick="window.router.navigate('library')">
                <img alt="Hip-Hop Category" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj3NdyEHn4kFKcfze4J6WBgGhT2SIaMfm526QmjDpPowOKHzQLupWTztjsUpLtZEgdKgXLYsj3emumX2VUNxEcRvRHp-YzbqoclNRF3qhNlEd9tRLKmO9-MbIoS-rLsyewbFLoIezOV3HTlyYYatP57s3USgb7IHnsgI2S_tUe2tHNq24Mul9qkxoDcCdz5gFUYlvBwl7CfvveBAkHNAnXg99kT4HPcBysAwmjkViBPIBaie0O-G3KoGHrq-yvD5kKZzKpBqSrxXI"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span class="absolute bottom-4 left-4 font-headline text-xl font-bold text-white">Hip-Hop</span>
            </div>
            <div class="relative h-40 md:h-56 rounded-xl overflow-hidden group cursor-pointer bg-surface-container md:col-span-1" onclick="window.router.navigate('library')">
                <img alt="Rock Category" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDncT7x8yrQBwnat-wzpB562rOWq-UX4k4qJeEp3HMPr-8c_-ogwpcsh_tBgVZYsbKV9Md30OEBX2PoBNKT8--6goH3XpIGWMXoUTRwjn9z5Em7gxtuKcZECifNdjieiiJ7Cz0FmDjS3YCXT8MQkLm_lpEeZQnMyEXwZssLByPhg2G337O8DNoDUi16064wIV58FvOfCFo1vUwzCssUvQm2vwCiAzpxyUGleZPIzWqkexQcFmLMgEwn0r1A5DmZFeY-JhtmV6WY8SU"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span class="absolute bottom-4 left-4 font-headline text-xl font-bold text-white">Rock</span>
            </div>
            <div class="relative h-40 md:h-56 rounded-xl overflow-hidden group cursor-pointer bg-surface-container" onclick="window.router.navigate('library')">
                <img alt="Indie Category" class="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxNJmVmLKXC4LCU5l8dTaYiZ5DZpJVzUZ34NJZiXNSt_tJJTUzEGRiOhh6z-zcx42vx5mbvHptHzk4qru-3VPrS15IjBOYVf-JBGM6FqjBalvW7epplwKXtJnvaz6hcGOi-lmdnKBlBHOYkq3LpmVVDKVtWybXvckv8PtQKDW430FXEaF862QN27wfosl6UNmEZMLY-LDkXuQpVssbH-pIAiWZW8_hYfNKRU1cBpTb0qUKNfsLVlB3A9nWJm6hVQx425N0joeCDTo"/>
                <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <span class="absolute bottom-4 left-4 font-headline text-xl font-bold text-white">Indie</span>
            </div>
        </div>
    </section>

    <!-- Recommended For You -->
    <section id="recommended-section" class="mb-16">
        <div class="flex items-baseline justify-between mb-8">
            <h3 class="font-headline text-2xl font-bold uppercase tracking-widest">Recommended For You</h3>
        </div>
        <div class="flex gap-6 overflow-x-auto no-scrollbar pb-8 -mx-6 px-6" id="recommended-tracks">
            <!-- Rendered via JS -->
        </div>
    </section>

    <!-- New Releases -->
    <section class="mb-16">
        <h3 class="font-headline text-2xl font-bold uppercase tracking-widest mb-8">Latest Heat</h3>
        <div class="flex flex-col md:flex-row gap-8">
            <div class="md:w-2/3 relative rounded-2xl overflow-hidden h-[400px] bg-surface-container group cursor-pointer" onclick="window.appCore.playFeatured()">
                <img alt="Featured Artist" class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqAYtK3WLok3jxqEI11UtWx-xmg0U5a2iklb8OcjiiSIgKFoIV3n6Oni5HWXn09dijOLTWcl-fPcm57vldgOsepL-zjAxbAEbaFxiPDjTKTM1JGRs9-wR1U7sFlLspOPcEcrU9S2Lldz7byAIWZPKRDZPiHWOJv7JtmZEuOrel82QiY-HXct2oLZPp5NW7iSRG-aWAcoDH1RRs-FY0NgB08kKBECf6G7vynpyGwyl_AVcCEL7iusaTiJ8nghV56TuYQ5aOnMc5JUo"/>
                <div class="absolute inset-0 bg-gradient-to-r from-surface-dim via-transparent to-transparent"></div>
                <div class="absolute bottom-8 left-8 right-8">
                    <span class="inline-block px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container font-label text-xs font-bold mb-4">NEW ARTIST</span>
                    <h4 class="font-headline text-4xl font-bold mb-2">CYBERPUNK LULLABIES</h4>
                    <p class="text-on-surface-variant max-w-sm mb-6">The debut album from NEXUS-7 explores the junction of organic rhythm and machine soul.</p>
                    <button class="bg-gradient-to-r from-primary to-secondary text-on-primary-fixed px-8 py-3 rounded-full font-bold transition-transform active:scale-95" onclick="event.stopPropagation(); window.appCore.playFeatured()">STREAM NOW</button>
                </div>
            </div>
            <div class="md:w-1/3 flex flex-col justify-between py-2" id="latest-heat-tracks">
                <!-- Rendered via JS -->
            </div>
        </div>
    </section>
</main>
`;

const LibraryView = (state) => `
<main class="pt-24 pb-32 px-6 max-w-7xl mx-auto">
    <section class="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div class="flex-1">
            <h2 class="font-headline text-5xl font-bold tracking-tighter mb-2">Library</h2>
            <p class="text-on-surface-variant font-medium">Your sonic archive, curated by you.</p>
        </div>
        <div class="flex items-center gap-4">
            <button onclick="window.appCore.createPlaylist()" class="bg-surface-container-highest h-14 w-14 rounded-full flex items-center justify-center text-primary active:scale-95 duration-200 cursor-pointer hover:bg-surface-container-high transition-all">
                <span class="material-symbols-outlined">add</span>
            </button>
            <div class="bg-surface-container-highest rounded-full flex items-center px-6 h-14 flex-1 md:w-80 group focus-within:ring-1 ring-primary/30 transition-all">
                <span class="material-symbols-outlined text-on-surface-variant mr-3">search</span>
                <input id="lib-search" oninput="window.appCore.onSearch(event)" style="color: var(--on-surface);" class="bg-transparent border-none focus:ring-0 text-sm font-medium w-full text-on-surface placeholder:text-on-surface-variant outline-none" placeholder="Search your library" type="text"/>
            </div>
        </div>
    </section>
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <section class="lg:col-span-4">
            <div class="flex items-center justify-between mb-8">
                <h3 class="font-headline text-2xl font-bold">Playlists</h3>
                <span class="font-label text-xs font-extrabold text-primary tracking-widest uppercase">${Object.keys(state.playlists).length} Total</span>
            </div>
            <div class="space-y-6">
                ${Object.entries(state.playlists).map(([name, tracks]) => `
                <div class="group cursor-pointer bg-surface-container/50 p-4 rounded-2xl hover:bg-surface-container transition-all" onclick="window.appCore.shufflePlaylist('${name}')">
                    <div class="relative overflow-hidden rounded-xl aspect-square mb-4 shadow-lg">
                        <img class="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" src="${tracks.length > 0 ? tracks[0].image : 'https://via.placeholder.com/300?text=Empty+Playlist'}"/>
                        <div class="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                            <span class="material-symbols-outlined text-primary scale-150 fill">play_circle</span>
                        </div>
                        <button onclick="event.stopPropagation(); window.appCore.deletePlaylist('${name}')" class="absolute top-2 right-2 w-8 h-8 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:text-error">
                            <span class="material-symbols-outlined text-sm">delete</span>
                        </button>
                    </div>
                    <div class="flex items-center justify-between">
                        <div>
                            <h4 class="font-headline text-lg font-bold truncate">${name}</h4>
                            <p class="text-on-surface-variant text-xs font-label uppercase tracking-widest">${tracks.length} Songs</p>
                        </div>
                    </div>
                </div>
                `).join('')}
            </div>
        </section>
        <section class="lg:col-span-8">
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-4">
                    <div class="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span class="material-symbols-outlined text-on-primary-fixed fill">favorite</span>
                    </div>
                    <h3 class="font-headline text-2xl font-bold">Liked Songs</h3>
                </div>
                <button class="font-label text-xs font-extrabold text-primary tracking-widest uppercase hover:opacity-70 transition-opacity" onclick="window.appCore.shuffleAll()">Shuffle All</button>
            </div>
            <div class="bg-surface-container-low rounded-3xl p-4 md:p-8 border border-outline-variant/10">
                <div class="grid grid-cols-12 gap-4 px-4 pb-6 mb-2 border-b border-outline-variant/5 text-on-surface-variant font-label text-[10px] tracking-widest uppercase font-bold">
                    <div class="col-span-1 text-center">#</div>
                    <div class="col-span-5 md:col-span-6">Title</div>
                    <div class="hidden md:block col-span-4">Album</div>
                    <div class="col-span-6 md:col-span-1 text-right">
                        <span class="material-symbols-outlined text-sm">schedule</span>
                    </div>
                </div>
                <div id="library-tracks">
                    <!-- Rendered via JS -->
                </div>
            </div>
        </section>
    </div>
</main>
`;

const SettingsView = (state) => `
<main class="pt-24 pb-32 px-6 max-w-2xl mx-auto">
    <section class="mb-12">
        <h2 class="text-5xl font-headline font-bold mb-2 tracking-tight text-on-surface">Settings</h2>
        <p class="text-on-surface-variant font-body">Personalize your sonic experience.</p>
    </section>
    <div class="space-y-4">
        <!-- Appearance -->
        <div class="p-6 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors group">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">palette</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-headline font-medium text-on-surface">Appearance</h3>
                        <p class="text-sm text-on-surface-variant font-label uppercase tracking-widest">Dark mode preference</p>
                    </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" class="sr-only peer" ${state.theme === 'dark' ? 'checked' : ''} onchange="window.appCore.toggleTheme()"/>
                    <div class="w-14 h-7 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-primary peer-checked:to-secondary"></div>
                </label>
            </div>
        </div>
        <!-- Audio Quality -->
        <div class="p-6 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors">
            <div class="flex flex-col gap-6">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary">
                        <span class="material-symbols-outlined">graphic_eq</span>
                    </div>
                    <div>
                        <h3 class="text-lg font-headline font-medium text-on-surface">Audio Quality</h3>
                        <p class="text-sm text-on-surface-variant font-label uppercase tracking-widest">Streaming bitrate</p>
                    </div>
                </div>
                <div class="relative w-full">
                    <select onchange="window.appCore.setQuality(event)" class="w-full bg-surface-container-highest border-none text-on-surface py-4 px-6 rounded-xl appearance-none focus:ring-2 focus:ring-primary/50 transition-all font-body font-medium outline-none cursor-pointer">
                        <option value="low" ${state.quality === 'low' ? 'selected' : ''}>Low (64kbps)</option>
                        <option value="normal" ${state.quality === 'normal' ? 'selected' : ''}>Normal (128kbps)</option>
                        <option value="high" ${state.quality === 'high' ? 'selected' : ''}>High (256kbps)</option>
                        <option value="extreme" ${state.quality === 'extreme' ? 'selected' : ''}>Extreme (FLAC Lossless)</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</main>
`;

const PlayerView = (state) => `
<div class="fixed inset-0 z-[100] bg-surface-dim overflow-hidden animation-fade-in">
    <div class="absolute inset-0">
        <div class="absolute inset-0 opacity-40 scale-110 blur-[100px]" style="background-image: url('${state.currentTrack.image}'); background-size: cover; background-position: center; transition: background-image 0.5s ease;"></div>
        <div class="absolute inset-0 bg-gradient-to-b from-surface-dim/40 via-surface-dim/80 to-surface-dim"></div>
    </div>
    
    <main class="relative z-10 h-screen w-full flex flex-col px-8 py-12 md:px-24 md:py-16 max-w-7xl mx-auto">
        <header class="flex justify-between items-center mb-8">
            <button class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-bright/40 backdrop-blur-xl text-on-surface hover:bg-surface-bright/60 transition-all active:scale-90 cursor-pointer" onclick="window.router.back()">
                <span class="material-symbols-outlined">expand_more</span>
            </button>
            <div class="text-center">
                <span class="font-label text-[10px] uppercase tracking-[0.3em] text-on-surface-variant mb-1 block">Playing from Library</span>
                <h2 class="font-headline text-sm font-bold tracking-tight text-primary uppercase">MUTUNES ACTIVE</h2>
            </div>
            <button class="w-12 h-12 flex items-center justify-center rounded-full bg-surface-bright/40 backdrop-blur-xl text-on-surface hover:bg-surface-bright/60 transition-all active:scale-90 cursor-pointer" onclick="window.playerCore.toggleMoreOptions()">
                <span class="material-symbols-outlined">more_vert</span>
            </button>
        </header>

        <section class="flex-grow flex flex-col items-center justify-center gap-12">
            <div class="relative group w-full max-w-[420px] aspect-square">
                <div class="absolute -inset-4 bg-primary/20 blur-[64px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div class="relative w-full h-full rounded-[2.5rem] overflow-hidden shadow-[0_24px_80px_rgba(0,0,0,0.6)] transform transition-transform duration-500 group-hover:scale-[1.02]">
                    <img alt="Album Art" class="w-full h-full object-cover" src="${state.currentTrack.image}"/>
                </div>
            </div>
            <div class="w-full max-w-[420px] space-y-2">
                <div class="flex justify-between items-end">
                    <div class="space-y-1">
                        <h1 class="font-headline text-4xl md:text-5xl font-bold tracking-tighter leading-none">${state.currentTrack.title}</h1>
                        <p class="font-body text-xl text-primary font-medium opacity-90 cursor-pointer hover:underline" onclick="window.router.navigate('artist/' + '${state.currentTrack.srcObj?.artists?.primary?.[0]?.id || ''}')">${state.currentTrack.artist}</p>
                    </div>
                    <button class="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">
                        <span class="material-symbols-outlined text-3xl fill">favorite</span>
                    </button>
                </div>
            </div>
        </section>

        <section class="mt-auto w-full max-w-2xl mx-auto space-y-8">
            <div class="space-y-3">
                <div class="relative w-full h-2 bg-surface-variant rounded-full group cursor-pointer" onclick="window.playerCore.seek(event)">
                    <!-- Active Track -->
                    <div id="progress-bar-full" class="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full" style="width: ${state.progressPercent}%">
                        <div class="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(129,236,255,0.8)] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                </div>
                <div class="flex justify-between font-label text-[10px] font-bold tracking-widest text-on-surface-variant">
                    <span id="time-current">${state.currentTimeText}</span>
                    <span id="time-duration">${state.durationText}</span>
                </div>
            </div>
            
            <div class="flex items-center justify-between">
                <button class="${state.isShuffle ? 'text-primary' : 'text-on-surface-variant'} hover:text-primary transition-colors cursor-pointer" onclick="window.playerCore.toggleShuffle(event)">
                    <span class="material-symbols-outlined text-2xl">shuffle</span>
                </button>
                <div class="flex items-center gap-8 md:gap-12">
                    <button class="text-on-surface hover:text-primary transition-all active:scale-90 cursor-pointer" onclick="window.playerCore.prev(event)">
                        <span class="material-symbols-outlined text-4xl fill">skip_previous</span>
                    </button>
                    <!-- Play Button -->
                    <button class="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-on-primary-fixed shadow-[0_12px_40px_rgba(16,213,255,0.3)] hover:shadow-[0_12px_50px_rgba(16,213,255,0.5)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer" onclick="window.playerCore.togglePlay(event)">
                        <span class="material-symbols-outlined text-5xl fill">${state.isPlaying ? 'pause' : 'play_arrow'}</span>
                    </button>
                    <button class="text-on-surface hover:text-primary transition-all active:scale-90 cursor-pointer" onclick="window.playerCore.next(event)">
                        <span class="material-symbols-outlined text-4xl fill">skip_next</span>
                    </button>
                </div>
                <button class="${state.isRepeat ? 'text-primary' : 'text-on-surface-variant'} hover:text-primary transition-colors cursor-pointer" onclick="window.playerCore.toggleRepeat(event)">
                    <span class="material-symbols-outlined text-2xl">repeat</span>
                </button>
            </div>
        </section>
        <div class="mt-8 mb-4 text-center w-full z-50">
            <a href="https://www.instagram.com/aashishverma_28?igsh=MXUzMDZ1NW15ZXp6Nw==" target="_blank" rel="noopener noreferrer" class="font-['Manrope'] text-[12px] uppercase tracking-[0.2em] text-primary/70 hover:text-primary font-bold drop-shadow-md transition-colors inline-block decoration-transparent hover:underline hover:decoration-primary pointer-events-auto">Made By Aashish Verma</a>
        </div>
    </main>
</div>
<style>
.animation-fade-in {
    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
</style>
${window.components.MoreOptionsMenu(state.showMoreOptions, state.currentTrack)}
`;

const SearchView = (state) => `
<main class="pt-24 pb-32 px-6 max-w-7xl mx-auto">
    <section class="mb-8 relative group">
        <div class="absolute inset-y-0 left-6 flex items-center pointer-events-none z-10">
            <span id="search-icon" class="material-symbols-outlined text-on-surface-variant group-focus-within:text-primary transition-colors">${state.isLoading && state.searchQuery ? 'progress_activity' : 'search'}</span>
        </div>
        <input
            id="main-search"
            oninput="window.appCore.onSearch(event)"
            value="${(state.searchQuery || '').replace(/"/g, '&quot;')}"
            style="color: var(--on-surface);"
            class="w-full bg-surface-container-highest/80 text-on-surface backdrop-blur-xl border-none rounded-2xl py-6 pl-16 pr-14 text-xl font-headline focus:ring-2 focus:ring-primary/50 placeholder:text-on-surface-variant transition-all outline-none shadow-2xl"
            placeholder="Search for artists and songs..."
            type="text"
            autocomplete="off"
            spellcheck="false"
        />
        ${state.searchQuery ? `
        <button
            onclick="window.appCore.clearSearch()"
            class="absolute inset-y-0 right-6 flex items-center text-on-surface-variant hover:text-primary transition-colors"
        >
            <span class="material-symbols-outlined">close</span>
        </button>` : ''}
        <div id="autocomplete-suggestions"></div>
    </section>

    <section class="mb-12 ${state.artistsData && state.artistsData.length > 0 ? '' : 'hidden'}">
        <h3 class="font-headline text-2xl font-bold uppercase tracking-widest mb-6">Suggested Artists</h3>
        <div class="flex gap-6 overflow-x-auto no-scrollbar pb-6 -mx-6 px-6" id="search-artists">
            <!-- Rendered via JS -->
        </div>
    </section>

    <section>
        <h3 class="font-headline text-2xl font-bold uppercase tracking-widest mb-6">Top Songs</h3>
        <div class="bg-surface-container-low rounded-3xl p-4 md:p-6 border border-outline-variant/10 shadow-lg">
            <div id="search-tracks" class="space-y-1">
                <!-- Rendered via JS -->
            </div>
        </div>
    </section>
</main>
`;

const ArtistView = (state) => {
    if (state.artistError) {
        return `
        <main class="pt-24 pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] animation-fade-in">
            <div class="bg-surface-container rounded-[2rem] p-12 text-center max-w-md shadow-2xl border border-outline-variant/10">
                <div class="w-20 h-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto mb-6">
                    <span class="material-symbols-outlined text-4xl">cloud_off</span>
                </div>
                <h2 class="font-headline text-3xl font-bold mb-4">Signal Lost</h2>
                <p class="text-on-surface-variant mb-8 font-medium">We couldn't reach the artist frequencies. The connection might be weak or the API is taking a break.</p>
                <button onclick="window.artistCore.retry()" class="bg-primary text-on-primary-fixed px-10 py-4 rounded-full font-bold shadow-lg hover:shadow-primary/30 transition-all active:scale-95 flex items-center gap-2 mx-auto">
                    <span class="material-symbols-outlined">refresh</span>
                    RETRY CONNECTION
                </button>
            </div>
        </main>`;
    }

    const isLoading = state.isLoading && !state.artistDetails;

    return `
<main class="pt-24 pb-32 px-6 max-w-7xl mx-auto animation-fade-in">
    <!-- Artist Header -->
    <section class="relative mb-12 rounded-[2.5rem] overflow-hidden group h-[300px] md:h-[450px] shadow-2xl ${isLoading ? 'bg-surface-container animate-pulse' : ''}">
        ${!isLoading ? `
        <div class="absolute inset-0">
            <img src="${state.artistDetails?.image || ''}" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 opacity-60" />
            <div class="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
        </div>
        
        <div class="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row items-end gap-8">
            <div class="w-32 h-32 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-surface-container-highest shadow-2xl shrink-0">
                <img src="${state.artistDetails?.image || ''}" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 pb-4">
                <div class="flex items-center gap-2 mb-2">
                    <span class="material-symbols-outlined text-primary text-sm fill">verified</span>
                    <span class="font-label text-[10px] uppercase tracking-[0.3em] font-extrabold text-on-surface-variant">Verified Artist</span>
                </div>
                <h2 class="font-headline text-5xl md:text-7xl font-bold tracking-tighter mb-4">${state.artistDetails?.name || ''}</h2>
                <div class="flex items-center gap-6">
                    <button class="bg-primary text-on-primary-fixed px-8 py-3 rounded-full font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-95 flex items-center gap-2">
                        <span class="material-symbols-outlined fill">play_arrow</span>
                        PLAY TOP TRACKS
                    </button>
                    <button class="border border-outline h-12 w-12 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors">
                        <span class="material-symbols-outlined">favorite</span>
                    </button>
                </div>
            </div>
        </div>
        ` : ''}
    </section>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <!-- Top Songs -->
        <section class="lg:col-span-8">
            <div class="flex items-center justify-between mb-8">
                <h3 class="font-headline text-2xl font-bold uppercase tracking-widest">Top Songs</h3>
                <button class="text-primary font-label text-xs font-bold tracking-widest hover:opacity-80 transition-opacity">SEE ALL</button>
            </div>
            <div class="bg-surface-container-low rounded-3xl p-4 md:p-6 border border-outline-variant/10 shadow-lg">
                <div id="artist-songs" class="space-y-1">
                    ${isLoading ? `
                        <div class="space-y-1 py-1">
                            ${[1, 2, 3, 4, 5].map(() => window.components.SkeletonRow()).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        </section>

        <!-- Albums -->
        <section class="lg:col-span-4">
            <div class="flex items-center justify-between mb-8">
                <h3 class="font-headline text-2xl font-bold uppercase tracking-widest">Albums</h3>
            </div>
            <div id="artist-albums" class="grid grid-cols-1 gap-6">
                ${isLoading ? `
                    <div class="space-y-6">
                        ${[1, 2, 3].map(() => `
                            <div class="h-24 rounded-2xl bg-surface-container skeleton animate-pulse"></div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        </section>
    </div>
</main>`;
};

window.views = { HomeView, SearchView, LibraryView, SettingsView, PlayerView, ArtistView };

