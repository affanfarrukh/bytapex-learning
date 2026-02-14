// Configuration
const REFRESH_INTERVAL = 30 * 60 * 1000; // 30 minutes
const RSS_TO_JSON_API = 'https://api.rss2json.com/v1/api.json?rss_url=';

// Feed URLs
const FEEDS = [
    {
        url: 'https://news.google.com/rss/search?q=Salesforce+career+OR+interview+OR+certification&hl=en-US&gl=US&ceid=US:en',
        sourceName: 'Google News'
    },
    {
        url: 'https://www.salesforce.com/blog/feed/',
        sourceName: 'Salesforce Blog'
    },
    {
        url: 'https://admin.salesforce.com/feed',
        sourceName: 'Salesforce Admin'
    }
];

// Placeholder content for custom sections (since we can't generate this dynamically per article easily without an LLM backend)
const IMPACT_TEMPLATES = [
    "This update could appear in technical screening questions. Be ready to explain the 'why' behind it.",
    "Great talking point for behavioral interviews regarding staying current with the ecosystem.",
    "Relevant for Architect and Senior Developer roles. demonstrating awareness of platform evolution.",
    "Use this to show your passion for the Salesforce community during the interview."
];

const CANDIDATE_KNOW_TEMPLATES = [
    "Understanding this feature shows you go beyond just the basics.",
    "Review the official documentation linked here before your next interview.",
    "Think about how this impacts existing implementations you've worked on.",
    "This is a hot topic. Expect questions on how this integrates with Flow or LWC."
];

/**
 * Fetch and process news feeds
 */
async function fetchNews() {
    const newsGrid = document.getElementById('news-grid');
    const lastUpdated = document.getElementById('last-updated');

    // Show loading state if grid is empty
    if (!newsGrid.children.length || newsGrid.querySelector('.loading-state')) {
        newsGrid.innerHTML = `
            <div class="loading-state">
                <div class="spinner"></div>
                <p>Fetching latest updates...</p>
            </div>
        `;
    }

    let allArticles = [];

    try {
        // Fetch all feeds in parallel
        const feedPromises = FEEDS.map(async (feed) => {
            try {
                const response = await fetch(`${RSS_TO_JSON_API}${encodeURIComponent(feed.url)}`);
                const data = await response.json();

                if (data.status === 'ok') {
                    return data.items.map(item => ({
                        title: item.title,
                        link: item.link,
                        pubDate: new Date(item.pubDate), // Normalize date
                        description: item.description,
                        source: feed.sourceName,
                        author: item.author || feed.sourceName
                    }));
                }
                return [];
            } catch (error) {
                console.error(`Error fetching feed ${feed.url}:`, error);
                return [];
            }
        });

        const results = await Promise.all(feedPromises);
        allArticles = results.flat();

        // Sort by date descending
        allArticles.sort((a, b) => b.pubDate - a.pubDate);

        // Keep top 20 items
        allArticles = allArticles.slice(0, 20);

        renderNews(allArticles);

        // Update timestamp
        const now = new Date();
        lastUpdated.textContent = `Last updated: ${now.toLocaleTimeString()} (Auto-refreshes every 30m)`;

    } catch (error) {
        console.error('Global error fetching news:', error);
        newsGrid.innerHTML = `
            <div class="error-state">
                <p>⚠️ Failed to load news feeds. Please try refreshing the page.</p>
            </div>
        `;
    }
}

/**
 * Render news cards to the DOM
 */
function renderNews(articles) {
    const newsGrid = document.getElementById('news-grid');
    newsGrid.innerHTML = ''; // Clear loading state

    articles.forEach((article, index) => {
        const card = document.createElement('div');
        card.className = 'news-card glass-card';

        // Randomly select analysis text (simulation)
        const impactText = IMPACT_TEMPLATES[Math.floor(Math.random() * IMPACT_TEMPLATES.length)];
        const candidateText = CANDIDATE_KNOW_TEMPLATES[Math.floor(Math.random() * CANDIDATE_KNOW_TEMPLATES.length)];

        // Clean description (remove img tags for text-only summary if possible, or truncate)
        let cleanDesc = article.description || "No description available.";
        // Simple HTML strip for safety and clean look
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanDesc;
        cleanDesc = tempDiv.textContent || tempDiv.innerText || "";
        if (cleanDesc.length > 150) cleanDesc = cleanDesc.substring(0, 150) + '...';

        const dateStr = article.pubDate.toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
        });

        card.innerHTML = `
            <div class="news-meta">
                <span class="news-source">${article.source}</span>
                <span class="news-date">${dateStr}</span>
            </div>
            <h3 class="news-title"><a href="${article.link}" target="_blank">${article.title}</a></h3>
            <p class="news-desc">${cleanDesc}</p>
            
            <div class="news-analysis">
                <div class="analysis-item">
                    <h4>🔥 Interview Impact</h4>
                    <p>${impactText}</p>
                </div>
                <div class="analysis-item">
                    <h4>💡 What Candidates Should Know</h4>
                    <p>${candidateText}</p>
                </div>
            </div>

            <a href="${article.link}" target="_blank" class="read-more">Read Full Article &rarr;</a>
        `;

        // Animation stagger
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        newsGrid.appendChild(card);

        // Simple fade in loop
        setTimeout(() => {
            card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100); // 100ms stagger
    });
}

// Initial Fetch
document.addEventListener('DOMContentLoaded', () => {
    fetchNews();

    // Set auto-refresh
    setInterval(fetchNews, REFRESH_INTERVAL);
});
