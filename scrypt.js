const password = "111111";

let isAdmin = sessionStorage.getItem('isAdmin') === 'true';
let resources = JSON.parse(localStorage.getItem('resources')) || [];
let commonLinks = JSON.parse(localStorage.getItem('commonLinks')) || [];
let titleCount = 1;
let editTitleCount = 1;
let currentEditId = null;

function migrateResourceData() {
    let needsSave = false;
    resources = resources.map(resource => {
        if (resource.titles && !resource.links) {
            needsSave = true;
            return {
                ...resource,
                links: resource.titles.map(title => ({
                    name: title,
                    url: resource.videoLink
                })),
                titles: undefined
            };
        }
        return resource;
    });
    
    if (needsSave) {
        localStorage.setItem('resources', JSON.stringify(resources));
    }
}

function migrateQuickLinksData() {
    let needsSave = false;
    commonLinks = commonLinks.map(link => {
        if (!link.buttonText) {
            needsSave = true;
            return {
                ...link,
                buttonText: 'Open in new tab'
            };
        }
        return link;
    });
    
    if (needsSave) {
        localStorage.setItem('commonLinks', JSON.stringify(commonLinks));
    }
}

const themeToggle = document.getElementById('themeToggle');
const addResourceBtn = document.getElementById('addResourceBtn');
const addQuickLinkBtn = document.getElementById('addQuickLinkBtn');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resourcesContainer = document.getElementById('resourcesContainer');
const quickLinksContainer = document.getElementById('quickLinksContainer');
const quickLinksSection = document.getElementById('quickLinksSection');

const passwordModal = document.getElementById('passwordModal');
const addResourceModal = document.getElementById('addResourceModal');
const resourceDetailModal = document.getElementById('resourceDetailModal');
const addQuickLinkModal = document.getElementById('addQuickLinkModal');
const editResourceModal = document.getElementById('editResourceModal');

const passwordInput = document.getElementById('passwordInput');
const passwordSubmit = document.getElementById('passwordSubmit');
const outsideName = document.getElementById('outsideName');
const videoLinkInput = document.getElementById('videoLinkInput');
const titlesContainer = document.getElementById('titlesContainer');
const addTitleBtn = document.getElementById('addTitleBtn');
const publishBtn = document.getElementById('publishBtn');

const quickLinkName = document.getElementById('quickLinkName');
const quickLinkUrl = document.getElementById('quickLinkUrl');
const quickLinkDesc = document.getElementById('quickLinkDesc');
const quickLinkButtonText = document.getElementById('quickLinkButtonText');
const saveQuickLinkBtn = document.getElementById('saveQuickLinkBtn');

const editOutsideName = document.getElementById('editOutsideName');
const editVideoLinkInput = document.getElementById('editVideoLinkInput');
const editTitlesContainer = document.getElementById('editTitlesContainer');
const editAddTitleBtn = document.getElementById('editAddTitleBtn');
const updateBtn = document.getElementById('updateBtn');

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme === 'dark' ? 'dark-theme' : '';
}

themeToggle.onclick = () => {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.body.className = newTheme === 'dark' ? 'dark-theme' : '';
    localStorage.setItem('theme', newTheme);
};

function openModal(modal) {
    modal.classList.add('active');
    modal.style.display = 'flex';
}

function closeModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.style.display = 'none', 200);
}

document.getElementById('closePasswordModal').onclick = () => closeModal(passwordModal);
document.getElementById('closeAddResource').onclick = () => closeModal(addResourceModal);
document.getElementById('closeResourceDetail').onclick = () => closeModal(resourceDetailModal);
document.getElementById('closeQuickLink').onclick = () => closeModal(addQuickLinkModal);
document.getElementById('closeEditResource').onclick = () => closeModal(editResourceModal);

document.getElementById('cancelPassword').onclick = () => closeModal(passwordModal);
document.getElementById('cancelAdd').onclick = () => closeModal(addResourceModal);
document.getElementById('cancelQuickLink').onclick = () => closeModal(addQuickLinkModal);
document.getElementById('cancelEdit').onclick = () => closeModal(editResourceModal);

document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            closeModal(overlay.parentElement);
        }
    };
});

addResourceBtn.onclick = () => {
    if (isAdmin) {
        openModal(addResourceModal);
    } else {
        openModal(passwordModal);
    }
};

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        if (isAdmin) {
            openModal(addResourceModal);
        } else {
            openModal(passwordModal);
        }
    }
});

passwordSubmit.onclick = () => {
    if (passwordInput.value === password) {
        isAdmin = true;
        sessionStorage.setItem('isAdmin', 'true');
        closeModal(passwordModal);
        openModal(addResourceModal);
        updateAdminUI();
    } else {
        showNotification('Incorrect password. Please try again.', 'error');
        passwordInput.value = '';
    }
};

passwordInput.onkeypress = (e) => {
    if (e.key === 'Enter') passwordSubmit.click();
};

addTitleBtn.onclick = () => {
    titleCount++;
    const titleGroup = document.createElement('div');
    titleGroup.className = 'title-input-group';
    titleGroup.innerHTML = `
        <input type="text" class="link-name-input" placeholder="Link Name (e.g., Download PDF)">
        <input type="text" class="link-url-input" placeholder="Link URL (https://...)">
    `;
    titlesContainer.appendChild(titleGroup);
};

publishBtn.onclick = () => {
    const displayName = outsideName.value.trim();
    const videoLink = videoLinkInput.value.trim();
    const linkGroups = document.querySelectorAll('#titlesContainer .title-input-group');
    const links = [];
    
    linkGroups.forEach(group => {
        const nameInput = group.querySelector('.link-name-input');
        const urlInput = group.querySelector('.link-url-input');
        const name = nameInput ? nameInput.value.trim() : '';
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (name && url) {
            links.push({ name, url });
        }
    });

    if (!displayName) {
        showNotification('Please enter a display name!', 'error');
        return;
    }

    if (!videoLink) {
        showNotification('Please enter a video link!', 'error');
        return;
    }

    if (links.length === 0) {
        showNotification('Please enter at least one link with both name and URL!', 'error');
        return;
    }

    const resource = {
        id: Date.now(),
        outsideName: displayName,
        videoLink,
        links
    };

    resources.push(resource);
    localStorage.setItem('resources', JSON.stringify(resources));

    outsideName.value = '';
    videoLinkInput.value = '';
    titlesContainer.innerHTML = `
        <div class="title-input-group">
            <input type="text" class="link-name-input" placeholder="Link Name (e.g., Download PDF)">
            <input type="text" class="link-url-input" placeholder="Link URL (https://...)">
        </div>
    `;
    titleCount = 1;

    closeModal(addResourceModal);
    displayResources();
    showNotification('Resource published successfully!', 'success');
};

searchBtn.onclick = () => {
    const searchQuery = searchInput.value.trim();
    if (!searchQuery) {
        showNotification('Please enter a video link to search!', 'error');
        return;
    }

    const foundResource = resources.find(r => r.videoLink === searchQuery);
    if (foundResource) {
        showResourceDetail(foundResource);
    } else {
        showNotification('No resource found for this link!', 'error');
    }
};

searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') searchBtn.click();
};

function showResourceDetail(resource) {
    const content = document.getElementById('resourceContent');
    const links = resource.links || [];
    document.getElementById('resourceDetailTitle').textContent = resource.outsideName || (links.length > 0 ? links[0].name : 'Resource');
    
    content.innerHTML = `
        <div class="unlock-section">
            <button class="unlock-btn" id="unlockBtn">Unlock Resources</button>
            <div id="timerDiv" style="display: none;"></div>
            <div id="linksDiv" style="display: none;"></div>
        </div>
    `;

    const unlockBtn = document.getElementById('unlockBtn');
    const timerDiv = document.getElementById('timerDiv');
    const linksDiv = document.getElementById('linksDiv');

    unlockBtn.onclick = () => {
        unlockBtn.disabled = true;
        unlockBtn.textContent = 'Unlocking...';
        timerDiv.style.display = 'block';

        let timeLeft = 10;
        timerDiv.innerHTML = `<div class="timer">${timeLeft}</div>`;

        const countdown = setInterval(() => {
            timeLeft--;
            timerDiv.innerHTML = `<div class="timer">${timeLeft}</div>`;

            if (timeLeft <= 0) {
                clearInterval(countdown);
                timerDiv.style.display = 'none';
                unlockBtn.style.display = 'none';
                linksDiv.style.display = 'block';

                let linksHTML = '<div class="links-list">';
                links.forEach((link) => {
                    linksHTML += `
                        <div class="link-card">
                            <h4>${link.name}</h4>
                            <div class="link-actions">
                                <button class="copy-btn" onclick="copyLink('${link.url}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                    Copy Link
                                </button>
                                <button class="open-btn" onclick="openLink('${link.url}')">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                    Open Link
                                </button>
                            </div>
                        </div>
                    `;
                });
                linksHTML += '</div>';
                linksDiv.innerHTML = linksHTML;
            }
        }, 1000);
    };

    openModal(resourceDetailModal);
}

function copyLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Link copied to clipboard!', 'success');
    }).catch(() => {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showNotification('Link copied to clipboard!', 'success');
    });
}

function openLink(link) {
    window.open(link, '_blank');
}

function displayResources() {
    if (resources.length === 0) {
        resourcesContainer.innerHTML = `
            <div class="no-resources">
                <svg class="no-resources-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <h3>No resources yet</h3>
                <p>Add your first resource to get started</p>
            </div>
        `;
        return;
    }

    resourcesContainer.innerHTML = '';
    resources.forEach((resource) => {
        const links = resource.links || [];
        const linksCount = links.length;
        const displayName = resource.outsideName || (links.length > 0 ? links[0].name : 'Untitled');
        
        const card = document.createElement('div');
        card.className = 'resource-card';
        card.innerHTML = `
            <div class="resource-header">
                <div class="resource-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                </div>
                ${isAdmin ? `
                    <div class="resource-menu">
                        <button class="icon-btn" onclick="editResource(${resource.id})" title="Edit">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="icon-btn delete" onclick="deleteResource(${resource.id})" title="Delete">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                ` : ''}
            </div>
            <div class="resource-info">
                <h3>${displayName}</h3>
                <div class="resource-link">${resource.videoLink}</div>
            </div>
            <div class="resource-footer">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                ${linksCount} ${linksCount === 1 ? 'link' : 'links'}
            </div>
        `;

        card.onclick = (e) => {
            if (!e.target.closest('.resource-menu')) {
                showResourceDetail(resource);
            }
        };

        resourcesContainer.appendChild(card);
    });
}

function editResource(id) {
    currentEditId = id;
    const resource = resources.find(r => r.id === id);
    const links = resource.links || [];
    
    editOutsideName.value = resource.outsideName || '';
    editVideoLinkInput.value = resource.videoLink;
    editTitlesContainer.innerHTML = '';
    
    links.forEach((link, index) => {
        const titleGroup = document.createElement('div');
        titleGroup.className = 'title-input-group';
        titleGroup.innerHTML = `
            <input type="text" class="edit-link-name-input" placeholder="Link Name (e.g., Download PDF)" value="${link.name}">
            <input type="text" class="edit-link-url-input" placeholder="Link URL (https://...)" value="${link.url}">
        `;
        editTitlesContainer.appendChild(titleGroup);
    });
    
    editTitleCount = links.length;
    openModal(editResourceModal);
}

function deleteResource(id) {
    if (confirm('Are you sure you want to delete this resource?')) {
        resources = resources.filter(r => r.id !== id);
        localStorage.setItem('resources', JSON.stringify(resources));
        displayResources();
        showNotification('Resource deleted successfully!', 'success');
    }
}

editAddTitleBtn.onclick = () => {
    editTitleCount++;
    const titleGroup = document.createElement('div');
    titleGroup.className = 'title-input-group';
    titleGroup.innerHTML = `
        <input type="text" class="edit-link-name-input" placeholder="Link Name (e.g., Download PDF)">
        <input type="text" class="edit-link-url-input" placeholder="Link URL (https://...)">
    `;
    editTitlesContainer.appendChild(titleGroup);
};

updateBtn.onclick = () => {
    const displayName = editOutsideName.value.trim();
    const videoLink = editVideoLinkInput.value.trim();
    const linkGroups = document.querySelectorAll('#editTitlesContainer .title-input-group');
    const links = [];
    
    linkGroups.forEach(group => {
        const nameInput = group.querySelector('.edit-link-name-input');
        const urlInput = group.querySelector('.edit-link-url-input');
        const name = nameInput ? nameInput.value.trim() : '';
        const url = urlInput ? urlInput.value.trim() : '';
        
        if (name && url) {
            links.push({ name, url });
        }
    });

    if (!displayName) {
        showNotification('Please enter a display name!', 'error');
        return;
    }

    if (!videoLink) {
        showNotification('Please enter a video link!', 'error');
        return;
    }

    if (links.length === 0) {
        showNotification('Please enter at least one link with both name and URL!', 'error');
        return;
    }

    const resourceIndex = resources.findIndex(r => r.id === currentEditId);
    resources[resourceIndex].outsideName = displayName;
    resources[resourceIndex].videoLink = videoLink;
    resources[resourceIndex].links = links;
    delete resources[resourceIndex].titles;
    
    localStorage.setItem('resources', JSON.stringify(resources));
    closeModal(editResourceModal);
    displayResources();
    showNotification('Resource updated successfully!', 'success');
};

function displayCommonLinks() {
    if (commonLinks.length === 0) {
        if (!isAdmin) {
            quickLinksContainer.innerHTML = `
                <div class="no-resources">
                    <p>No quick links available</p>
                </div>
            `;
        } else {
            quickLinksContainer.innerHTML = `
                <div class="no-resources">
                    <p>No quick links yet. Click "Add Link" above to create your first one!</p>
                </div>
            `;
        }
        return;
    }

    quickLinksContainer.innerHTML = '';
    commonLinks.forEach(link => {
        let hostname;
        try {
            hostname = new URL(link.url).hostname;
        } catch (e) {
            hostname = link.url;
        }
        
        const linkEl = document.createElement('div');
        linkEl.className = 'quick-link-item';
        linkEl.innerHTML = `
            <div class="quick-link-content">
                <div class="quick-link-main">
                    <svg class="quick-link-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                    </svg>
                    <span class="quick-link-title">${link.name}</span>
                    <span class="quick-link-url">${hostname}</span>
                </div>
                ${link.description ? `<div class="quick-link-desc">${link.description}</div>` : ''}
                <button class="quick-link-action-btn" onclick="window.open('${link.url}', '_blank')">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    ${link.buttonText || 'Open in new tab'}
                </button>
            </div>
            ${isAdmin ? `
                <div class="quick-link-actions">
                    <button class="icon-btn delete" onclick="deleteCommonLink(${link.id})" title="Delete">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            ` : ''}
        `;
        
        quickLinksContainer.appendChild(linkEl);
    });
}

addQuickLinkBtn.onclick = () => {
    openModal(addQuickLinkModal);
};

saveQuickLinkBtn.onclick = () => {
    const name = quickLinkName.value.trim();
    const url = quickLinkUrl.value.trim();
    const description = quickLinkDesc.value.trim();
    const buttonText = quickLinkButtonText.value.trim() || 'Open in new tab';

    if (!name || !url) {
        showNotification('Please fill in name and URL!', 'error');
        return;
    }

    commonLinks.push({
        id: Date.now(),
        name,
        url,
        description,
        buttonText
    });

    localStorage.setItem('commonLinks', JSON.stringify(commonLinks));
    closeModal(addQuickLinkModal);
    quickLinkName.value = '';
    quickLinkUrl.value = '';
    quickLinkDesc.value = '';
    quickLinkButtonText.value = '';
    displayCommonLinks();
    showNotification('Quick link added successfully!', 'success');
};

function deleteCommonLink(id) {
    if (confirm('Delete this quick link?')) {
        commonLinks = commonLinks.filter(l => l.id !== id);
        localStorage.setItem('commonLinks', JSON.stringify(commonLinks));
        displayCommonLinks();
        showNotification('Quick link deleted successfully!', 'success');
    }
}

function updateAdminUI() {
    if (isAdmin) {
        addResourceBtn.style.display = 'flex';
        addQuickLinkBtn.style.display = 'flex';
    } else {
        addResourceBtn.style.display = 'none';
        addQuickLinkBtn.style.display = 'none';
    }
    displayResources();
    displayCommonLinks();
}

function showNotification(message, type) {
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) {
        existingNotif.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = type === 'success' 
        ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>'
        : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
    
    notification.innerHTML = `
        <div class="notification-icon">${icon}</div>
        <div class="notification-message">${message}</div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

migrateResourceData();
migrateQuickLinksData();
initTheme();

if (isAdmin) {
    updateAdminUI();
} else {
    displayResources();
    displayCommonLinks();
}
