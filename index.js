import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

let cache = null;

const writeCache = (newCache) => {
    cache = newCache;
    fs.writeFileSync("cache.json", JSON.stringify(newCache, null, 4), "utf-8");
};

const resetCache = () => writeCache({
    lastThreadIds: {
        'CS108': [],
        'COM102': [],
        'CS173': [],
        'MA106': []
    },
    lastNotificationIds: []
});

const courseIds = {
    'CS108': '1101',
    'COM102': '1182',
    'CS173': '1095',
    'MA106': '1153'
};

const edstemSynchronization = async () => {

    const lastThreadIds = cache.lastThreadIds;

    for (const [course, id] of Object.entries(courseIds)) {
        console.log(course, id);
        const threads = (await (await fetch(`https://eu.edstem.org/api/courses/${id}/threads?limit=2&sort=new&filter=unresolved`, {
            headers: {
                'X-Token': process.env.EDSTEM_TOKEN
            }
        })).json()).threads;
        console.log(threads);
        let lastThread = threads[0];
        if (!cache.lastThreadIds[course].includes(lastThread.id)) {
            cache.lastThreadIds[course].push(lastThread.id);
            sendNotification({
                title: `${course} Question`,
                message: lastThread.title,
                url: `https://edstem.org/eu/courses/1101/discussion/${lastThread.id}`,
                url_title: 'Let\'s Edstem this question!',
                priority: 0
            }, process.env[`${course}_GROUP_TOKEN`]);
        }
    }

    const notifications = (await (await fetch('https://notes.eu.edstem.org/api/browser/before?id=1707056513', {
        headers: {
            'X-Token': process.env.EDSTEM_TOKEN
        }
    })).json()).notes;
    let lastNotification = notifications[0];
    if (lastNotification.id !== cache.lastNotificationId) {
        sendNotification({
            title: `ED Notification`,
            message: JSON.parse(lastNotification.body).thread.title,
            url: `https://edstem.org/eu/courses/1101/discussion/${JSON.parse(lastNotification.body).thread.id}`,
            url_title: 'Let\'s answer this guy!',
            priority: 0
        }, process.env.NOTIFICATIONS_GROUP_TOKEN);
    }

    writeCache({
        ...cache,
        lastNotificationId: lastNotification.id,
        lastThreadIds
    });

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

const sendNotification = async (notification, groupToken) => {

    const appToken = process.env.APP_TOKEN;

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
    }).catch(() => {});

    const content = await response.json();
    console.log(content)

    /*
    if (content.status !== 1) {
        throw new Error('Pushover API error');
    }*/
}

edstemSynchronization();
setInterval(() => edstemSynchronization(), 60_000);
