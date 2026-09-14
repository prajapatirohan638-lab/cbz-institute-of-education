self.addEventListener("install", function () {
    console.log("Service Worker installed");
});

self.addEventListener("activate", function () {
    console.log("Service Worker activated");
});

self.addEventListener("push", function (event) {
    const data = event.data ? event.data.json() : {};

    const title = data.title || "CBZ Institute of Education";
    const options = {
        body: data.body || "New notice available.",
        icon: "/favicon.ico",
        badge: "/favicon.ico"
    };

    event.waitUntil(
        self.registration.showNotification(title, options)
    );
});