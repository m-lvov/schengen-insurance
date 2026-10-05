window.sharedMenusReady = (async () => {
    let header = document.querySelector('.header');

    if (!header || header.querySelector('.burger-menu')) return;

    let response = await fetch('index.html');

    if (!response.ok) {
        throw new Error(`Unable to load shared menus: ${response.status}`);
    }

    let html = await response.text();
    let sourceDocument = new DOMParser().parseFromString(html, 'text/html');
    let fragment = document.createDocumentFragment();

    ['.burger-menu', '.route-menu'].forEach((selector) => {
        let menu = sourceDocument.querySelector(selector);

        if (!menu) {
            throw new Error(`Shared menu not found: ${selector}`);
        }

        menu.querySelectorAll('a[href^="#"]').forEach((link) => {
            let target = link.getAttribute('href');

            if (target.length > 1) link.setAttribute('href', `index.html${target}`);
        });

        fragment.append(menu);
    });

    header.append(fragment);
})();
