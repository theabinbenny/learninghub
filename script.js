document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);

    // Initial load
    if (document.body.dataset.page === 'index') {
        loadFolders();
    } else if (document.body.dataset.page === 'folder') {
        loadVideos(params.get('folder'));
    } else if (document.body.dataset.page === 'details') {
        loadDetails(params.get('folder'), params.get('video'));
    }
});

async function loadFolders() {
    const grid = document.getElementById('folder-grid');
    try {
        const response = await fetch('data/manifest.json');
        const data = await response.json();
        
        grid.innerHTML = Object.keys(data).map(folder => `
            <div class="card fade-in" onclick="window.location.href='folder.html?folder=${folder}'">
                <h3>${folder.charAt(0).toUpperCase() + folder.slice(1)}</h3>
                <p>${data[folder].length} Videos</p>
            </div>
        `).join('');
    } catch (e) {
        console.error('Failed to load folders:', e);
        grid.innerHTML = '<p>Error loading folders. Make sure website/data/manifest.json exists.</p>';
    }
}

async function loadVideos(folderName) {
    const grid = document.getElementById('video-grid');
    const title = document.getElementById('folder-title');
    title.innerText = folderName.charAt(0).toUpperCase() + folderName.slice(1);

    try {
        const response = await fetch('data/manifest.json');
        const manifest = await response.json();
        const videos = manifest[folderName] || [];

        for (const videoFile of videos) {
            const videoData = await fetch(`data/${folderName}/${videoFile}`).then(r => r.json());
            const videoId = extractVideoId(videoData.video_link);
            
            const card = document.createElement('div');
            card.className = 'card fade-in';
            card.onclick = () => window.location.href = `details.html?folder=${folderName}&video=${videoFile}`;
            card.innerHTML = `
                <iframe class="video-preview" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>
                <h3>${videoData.video_title}</h3>
                <p>Click to view details</p>
            `;
            grid.appendChild(card);
        }
    } catch (e) {
        console.error('Failed to load videos:', e);
        grid.innerHTML = '<p>Error loading videos.</p>';
    }
}

async function loadDetails(folder, videoFile) {
    const container = document.getElementById('details-container');
    try {
        const response = await fetch(`data/${folder}/${videoFile}`);
        const data = await response.json();
        const videoId = extractVideoId(data.video_link);

        document.getElementById('video-title').innerText = data.video_title;
        document.getElementById('video-header').innerHTML = `
            <iframe width="100%" height="500" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen style="border-radius: 20px; margin-bottom: 2rem;"></iframe>
        `;

        const chunksContainer = document.getElementById('chunks-container');
        Object.keys(data).forEach(key => {
            if (key.startsWith('chunk_')) {
                const chunk = data[key];
                const chunkEl = renderChunk(key, chunk);
                chunksContainer.appendChild(chunkEl);
            }
        });

    } catch (e) {
        console.error('Failed to load details:', e);
        container.innerHTML = '<p>Error loading details.</p>';
    }
}

function renderChunk(id, chunk) {
    const div = document.createElement('div');
    div.className = 'chunk-card fade-in'; // Removed 'expanded' to keep it minimized by default
    div.id = `card-${id}`;
    
    // Key Points
    const keyPointsHtml = Object.entries(chunk.key_points || {}).map(([key, value]) => `
        <li><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</li>
    `).join('');

    // MCQs
    let mcqHtml = '';
    if (chunk.multiple_choice_questions) {
        mcqHtml = `
            <div class="mcq-section">
                <h4>Learn from Multiple Choice</h4>
                ${Object.entries(chunk.multiple_choice_questions).map(([cat, qs]) => `
                    ${qs.map((q, qIndex) => `
                        <div class="mcq-container" data-answer="${q.answer}">
                            <p style="margin-bottom: 1rem; font-weight: 500;">${q.question_1 || q.question_2 || q.question_3 || q.question_4}</p>
                            ${q.options.map(opt => `
                                <div class="option" onclick="handleOptionClick(this, '${q.answer}')">${opt}</div>
                            `).join('')}
                        </div>
                    `).join('')}
                `).join('')}
            </div>
        `;
    }

    div.innerHTML = `
        <div class="chunk-card-header" onclick="toggleChunkCard('${id}')">
            <h2>${id.replace('_', ' ').toUpperCase()}</h2>
            <svg class="toggle-arrow" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5H7z"/>
            </svg>
        </div>
        
        <div class="chunk-card-body">
            <div class="chunk-section">
                <h4>Summary</h4>
                <p>${chunk.summary_text}</p>
            </div>

            ${chunk.overlap_text ? `
            <div class="chunk-section">
                <h4>Relation with Previous Chunk</h4>
                <p>${chunk.overlap_text}</p>
            </div>` : ''}

            <div class="chunk-section">
                <h4>Key Points</h4>
                <ul class="key-points">${keyPointsHtml}</ul>
            </div>

            <div class="chunk-section">
                <h4>Input Text</h4>
                <div class="expandable-text">
                    <div class="text-content" id="content-${id}">${chunk.input_text}</div>
                    <button class="expand-btn" onclick="toggleExpand('content-${id}', this)">Expand</button>
                </div>
            </div>

            ${mcqHtml}
        </div>
    `;
    return div;
}

function toggleChunkCard(id) {
    const card = document.getElementById(`card-${id}`);
    card.classList.toggle('expanded');
}

function toggleExpand(id, btn) {
    const el = document.getElementById(id);
    if (el.classList.contains('expanded')) {
        el.classList.remove('expanded');
        btn.innerText = 'Expand';
    } else {
        el.classList.add('expanded');
        btn.innerText = 'Minimize';
    }
}

function handleOptionClick(el, correctAnswer) {
    const options = el.parentElement.querySelectorAll('.option');
    options.forEach(opt => opt.classList.remove('selected', 'correct', 'wrong'));
    
    el.classList.add('selected');
    if (el.innerText === correctAnswer) {
        el.classList.add('correct');
    } else {
        el.classList.add('wrong');
        // Briefly show correct answer
        options.forEach(opt => {
            if (opt.innerText === correctAnswer) opt.classList.add('correct');
        });
    }
}

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
