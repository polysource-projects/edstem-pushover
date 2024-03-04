import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let cache = null;

const writeCache = (newCache) => {
    cache = newCache;
    fs.writeFileSync("cache.json", JSON.stringify(newCache, null, 4), "utf-8");
};

const resetCache = () => writeCache({
    lastThreadId: 0
});

const edstemSynchronization = async () => {

    fetch('https://eu.edstem.org/api/courses/1101/threads?limit=2&sort=new', {
        headers: {
            'X-Token': process.env.EDSTEM_TOKEN
        }
    })
    .then((data) => data.json())
    .then((data) => {
        let lastThread = data.threads[1];
        console.log(data.threads)
        if (lastThread.id !== cache.lastThreadId) {
            sendNotification({
                title: `CS-108 Nouveau post !`,
                message: lastThread.title,
                url: `https://edstem.org/eu/courses/1101/discussion/${lastThread.id}`,
                priority: 0
            });
    
            writeCache({
                ...cache,
                lastThreadId: lastThread.id
            });
        }
    })


};

// Si le fichier cache n'existe pas, on le créé
if (!fs.existsSync("cache.json")) {
    resetCache();
} else {
    // S'il existe, on essaie de le parser et si ça échoue on le reset pour éviter les erreurs
    try {
        cache = JSON.parse(fs.readFileSync("cache.json", "utf-8"));
    } catch {
        resetCache();
    }
}

const sendNotification = async (notification) => {

    const appToken = process.env.APP_TOKEN;
    const groupToken = process.env.GROUP_TOKEN;

    const pushUrl = 'https://api.pushover.net/1/messages.json';

    const response = await fetch(pushUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            token: appToken,
            user: groupToken,
            ...notification
        })
    });

    const content = await response.json();
    console.log(content)

    if (content.status !== 1) {
        throw new Error('Pushover API error');
    }
}

edstemSynchronization();
setInterval(() => edstemSynchronization(), 60_000);
