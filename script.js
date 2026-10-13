This is the functionality: loading your music, playing tracks, skipping songs, seeking, volume adjustment, shuffle, and repeat.

javascript

const audio = document.getElementById("audio");
const fileInput = document.getElementById("file-input");
const playlist = document.getElementById("playlist");

const title = document.getElementById("song-title");
const artist = document.getElementById("song-artist");
const playBtn = document.getElementById("play");
const progress = document.getElementById("progress");
const currentTime = document.getElementById("current-time");
const duration = document.getElementById("duration");
const cover = document.getElementById("cover");
const volume = document.getElementById("volume");
const volumeValue = document.getElementById("volume-value");
const trackCount = document.getElementById("track-count");
const shuffleBtn = document.getElementById("shuffle");
const repeatBtn = document.getElementById("repeat");

let tracks = [];
let currentIndex = -1;
let shuffle = false;
let repeat = false;
let objectUrls = [];

function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";

    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);

    return `${mins}:${String(secs).padStart(2, "0")}`;
}

function renderPlaylist() {
    trackCount.textContent =
        `${tracks.length} ${tracks.length === 1 ? "track" : "tracks"}`;

    if (tracks.length === 0) {
        playlist.innerHTML = `
            <div class="empty-state">
                <span>♫</span>
                <p>Your playlist is empty</p>
                <small>Add your favorite songs to get started.</small>
            </div>`;
        return;
    }

    playlist.innerHTML = tracks.map((track, index) => `
        <div class="track ${index === currentIndex ? "selected" : ""}"
             data-index="${index}" tabindex="0" role="button"
             aria-label="Play ${escapeHTML(track.name)}">
            <span class="track-number">
                ${index === currentIndex && !audio.paused ? "♫" : String(index + 1).padStart(2, "0")}
            </span>
            <span class="track-symbol">♫</span>
            <div class="track-info">
                <h3>${escapeHTML(track.name)}</h3>
                <p>Local music</p>
            </div>
            <span class="track-duration">${formatTime(track.duration)}</span>
        </div>
    `).join("");
}

function escapeHTML(value) {
    return value.replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

fileInput.addEventListener("change", event => {
    const files = Array.from(event.target.files || [])
        .filter(file => file.type.startsWith("audio/"));

    for (const file of files) {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);

        tracks.push({
            name: file.name.replace(/\.[^/.]+$/, ""),
            url,
            duration: 0
        });
    }

    renderPlaylist();

    if (currentIndex === -1 && tracks.length > 0) {
        loadTrack(0, false);
    }

    // Allows selecting the same file again later.
    fileInput.value = "";
});

function loadTrack(index, autoplay = true) {
    if (tracks.length === 0) return;

    currentIndex = (index + tracks.length) % tracks.length;

    audio.src = tracks[currentIndex].url;
    title.textContent = tracks[currentIndex].name;
    artist.textContent = `Track ${currentIndex + 1} of ${tracks.length}`;

    progress.value = 0;
    currentTime.textContent = "0:00";
    duration.textContent = "0:00";

    renderPlaylist();

    if (autoplay) {
        playMusic();
    } else {
        playBtn.textContent = "▶";
        cover.classList.remove("playing");
    }
}

async function playMusic() {
    if (currentIndex === -1 && tracks.length > 0) {
        loadTrack(0, false);
    }

    if (!audio.src) return;

    try {
        await audio.play();
    } catch (error) {
        console.error("Unable to play audio:", error);
    }
}

function pauseMusic() {
    audio.pause();
}

playBtn.addEventListener("click", () => {
    if (audio.paused) {
        playMusic();
    } else {
        pauseMusic();
    }
});

audio.addEventListener("play", () => {
    playBtn.textContent = "Ⅱ";
    playBtn.title = "Pause";
    cover.classList.add("playing");
    renderPlaylist();
});

audio.addEventListener("pause", () => {
    playBtn.textContent = "▶";
    playBtn.title = "Play";
    cover.classList.remove("playing");
    renderPlaylist();
});

audio.addEventListener("loadedmetadata", () => {
    duration.textContent = formatTime(audio.duration);

    if (currentIndex >= 0) {
        tracks[currentIndex].duration = audio.duration;
        renderPlaylist();
    }
});

audio.addEventListener("timeupdate", () => {
    currentTime.textContent = formatTime(audio.currentTime);

    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        progress.value = (audio.currentTime / audio.duration) * 100;
    } else {
        progress.value = 0;
    }
});

progress.addEventListener("input", () => {
    if (Number.isFinite(audio.duration) && audio.duration > 0) {
        audio.currentTime = (progress.value / 100) * audio.duration;
    }
});

volume.addEventListener("input", () => {
    audio.volume = Number(volume.value);
    volumeValue.textContent = `${Math.round(audio.volume * 100)}%`;
});

audio.volume = Number(volume.value);

function nextTrack() {
    if (tracks.length === 0) return;

    if (shuffle && tracks.length > 1) {
        let next;
        do {
            next = Math.floor(Math.random() * tracks.length);
        } while (next === currentIndex);

        loadTrack(next);
    } else {
        loadTrack((currentIndex + 1) % tracks.length);
    }
}

function previousTrack() {
    if (tracks.length === 0) return;

    if (audio.currentTime > 3) {
        audio.currentTime = 0;
    } else {
        loadTrack((currentIndex - 1 + tracks.length) % tracks.length);
    }
}

document.getElementById("next").addEventListener("click", nextTrack);
document.getElementById("previous").addEventListener("click", previousTrack);

shuffleBtn.addEventListener("click", () => {
    shuffle = !shuffle;
    shuffleBtn.classList.toggle("active", shuffle);
    shuffleBtn.title = shuffle ? "Shuffle on" : "Shuffle off";
});

repeatBtn.addEventListener("click", () => {
    repeat = !repeat;
    audio.loop = repeat;
    repeatBtn.classList.toggle("active", repeat);
    repeatBtn.title = repeat ? "Repeat on" : "Repeat off";
});

audio.addEventListener("ended", () => {
    if (!repeat && tracks.length > 0) {
        nextTrack();
    }
});

playlist.addEventListener("click", event => {
    const track = event.target.closest(".track");
    if (track) {
        loadTrack(Number(track.dataset.index));
    }
});

playlist.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
        const track = event.target.closest(".track");

        if (track) {
            event.preventDefault();
            loadTrack(Number(track.dataset.index));
        }
    }
});

// Clean up local audio URLs when leaving the page.
window.addEventListener("pagehide", () => {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
});

renderPlaylist();
