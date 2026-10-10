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

function initHeaderMenus() {
    let header = document.querySelector('.header');

    if (!header || header.dataset.menusInitialized === 'true') return;

    header.dataset.menusInitialized = 'true';

    let burgerButton = header.querySelector('.header__burger');
    let burgerMenu = header.querySelector('.burger-menu');
    let routeButton = header.querySelector('.header__route');
    let routeMenu = header.querySelector('.route-menu');
    let headerNav = header.querySelector('.header__nav');
    let languageButton = header.querySelector('.header__language');
    let burgerDialog = burgerMenu?.querySelector('.burger-menu__dialog');
    let sheetMenuMedia = window.matchMedia('(max-width: 1100px)');
    let headerNavMedia = window.matchMedia('(max-width: 968px)');
    let languageMedia = window.matchMedia('(max-width: 500px)');
    let finePointerMedia = window.matchMedia('(hover: hover) and (pointer: fine)');

    function createMoveAnchor(element, name) {
        if (!element?.parentNode) return null;

        let anchor = document.createComment(name);
        element.parentNode.insertBefore(anchor, element);

        return anchor;
    }

    function restoreAfterAnchor(element, anchor) {
        if (!element || !anchor?.parentNode) return;

        anchor.parentNode.insertBefore(element, anchor.nextSibling);
    }

    let headerNavAnchor = createMoveAnchor(headerNav, 'header navigation');
    let routeButtonAnchor = createMoveAnchor(routeButton, 'header route');
    let languageButtonAnchor = createMoveAnchor(languageButton, 'header language');
    let mobileHeader = null;
    let mobileActions = null;
    let mobileNavigation = null;

    if (burgerDialog) {
        mobileHeader = document.createElement('div');
        mobileHeader.className = 'burger-menu__mobile-header';
        mobileHeader.hidden = true;

        mobileActions = document.createElement('div');
        mobileActions.className = 'burger-menu__mobile-actions';

        mobileNavigation = document.createElement('div');
        mobileNavigation.className = 'burger-menu__mobile-navigation';

        mobileHeader.append(mobileActions, mobileNavigation);
        burgerDialog.prepend(mobileHeader);
    }

    function syncMobileHeader() {
        if (!mobileHeader || !mobileActions || !mobileNavigation) return;

        if (sheetMenuMedia.matches && routeButton) {
            mobileActions.append(routeButton);
        } else {
            restoreAfterAnchor(routeButton, routeButtonAnchor);
        }

        if (headerNavMedia.matches && headerNav) {
            mobileNavigation.append(headerNav);
        } else {
            restoreAfterAnchor(headerNav, headerNavAnchor);
        }

        if (languageMedia.matches && languageButton) {
            mobileActions.append(languageButton);
        } else {
            restoreAfterAnchor(languageButton, languageButtonAnchor);
        }

        mobileHeader.hidden = !mobileActions.children.length && !mobileNavigation.children.length;
    }

    function syncMenuScrollLock() {
        let hasOpenSheet = sheetMenuMedia.matches && (
            (burgerMenu && !burgerMenu.hidden) ||
            (routeMenu && !routeMenu.hidden)
        );

        document.body.classList.toggle('menu-sheet-open', Boolean(hasOpenSheet));
    }

    function closeBurgerMenu() {
        if (!burgerMenu || !burgerButton) return;

        burgerMenu.hidden = true;
        burgerButton.classList.remove('header__burger--active');
        syncMenuScrollLock();
    }

    function closeRouteMenu() {
        if (!routeMenu || !routeButton) return;

        routeMenu.hidden = true;
        routeButton.classList.remove('header__route--active');
        syncMenuScrollLock();
    }

    syncMobileHeader();

    if (burgerButton && burgerMenu) {
        burgerButton.addEventListener('click', () => {
            let willOpen = burgerMenu.hidden;

            if (willOpen) closeRouteMenu();

            burgerMenu.hidden = !willOpen;
            burgerButton.classList.toggle('header__burger--active', willOpen);
            syncMenuScrollLock();
        });

        let burgerOverlay = burgerMenu.querySelector('.burger-menu__overlay');

        if (burgerOverlay) {
            burgerOverlay.addEventListener('click', closeBurgerMenu);
        }

        burgerMenu.addEventListener('click', (event) => {
            if (event.target.closest('a')) closeBurgerMenu();
        });
    }

    if (routeButton && routeMenu) {
        routeButton.addEventListener('click', () => {
            let willOpen = routeMenu.hidden;

            if (willOpen) {
                closeBurgerMenu();
                resetRouteCascade();
            }

            routeMenu.hidden = !willOpen;
            routeButton.classList.toggle('header__route--active', willOpen);
            syncMenuScrollLock();
        });

        let routeOverlay = routeMenu.querySelector('.route-menu__overlay');

        if (routeOverlay) {
            routeOverlay.addEventListener('click', closeRouteMenu);
        }
    }

    let routeTabs = document.querySelectorAll('.route-menu__tab');
    let routePanels = document.querySelectorAll('.route-menu__panel');
    let routeRegionTabs = document.querySelectorAll('[data-region-tab]');
    let routeRegionPanels = document.querySelectorAll('[data-region-panel]');
    let routeCountryTabs = document.querySelectorAll('[data-countries-tab]');
    let routeCountryPanels = document.querySelectorAll('[data-countries-panel]');
    let routeRegionsColumn = document.querySelector('.route-menu__regions');
    let routeSubregionsColumn = document.querySelector('.route-menu__subregions');
    let routeCountriesColumn = document.querySelector('.route-menu__countries');
    let routeHoverDelay = 180;
    let routeRegionHoverTimer = null;
    let routeCountryHoverTimer = null;

    function clearRegionHoverTimer() {
        if (!routeRegionHoverTimer) return;

        clearTimeout(routeRegionHoverTimer);
        routeRegionHoverTimer = null;
    }

    function clearCountryHoverTimer() {
        if (!routeCountryHoverTimer) return;

        clearTimeout(routeCountryHoverTimer);
        routeCountryHoverTimer = null;
    }

    function resetCountryLevel() {
        clearCountryHoverTimer();

        routeCountryTabs.forEach((tab) => {
            tab.classList.remove('route-menu__option--active');
        });

        routeCountryPanels.forEach((panel) => {
            panel.hidden = true;
        });

        if (routeCountriesColumn) routeCountriesColumn.hidden = true;
    }

    function resetRegionLevel() {
        clearRegionHoverTimer();
        resetCountryLevel();

        routeRegionTabs.forEach((tab) => {
            tab.classList.remove('route-menu__option--active');
        });

        routeRegionPanels.forEach((panel) => {
            panel.hidden = true;
        });

        if (routeSubregionsColumn) routeSubregionsColumn.hidden = true;
    }

    function resetRouteCascade() {
        resetRegionLevel();
    }

    function isInsideColumn(column, target) {
        return column && target instanceof Node && column.contains(target);
    }

    function activateRouteTab(activeTab) {
        let activePanelName = activeTab.dataset.routeTab;

        resetRouteCascade();

        routeTabs.forEach((tab) => {
            tab.classList.toggle('route-menu__tab--active', tab === activeTab);
        });

        routePanels.forEach((panel) => {
            panel.hidden = panel.dataset.routePanel !== activePanelName;
        });
    }

    function activateCountryGroup(activeTab) {
        clearCountryHoverTimer();

        let activePanelName = activeTab.dataset.countriesTab;

        routeCountryTabs.forEach((tab) => {
            tab.classList.toggle('route-menu__option--active', tab === activeTab);
        });

        routeCountryPanels.forEach((panel) => {
            panel.hidden = panel.dataset.countriesPanel !== activePanelName;
        });

        if (routeCountriesColumn) routeCountriesColumn.hidden = false;
    }

    function activateRegion(activeTab) {
        clearRegionHoverTimer();

        let activePanelName = activeTab.dataset.regionTab;

        resetCountryLevel();

        routeRegionTabs.forEach((tab) => {
            tab.classList.toggle('route-menu__option--active', tab === activeTab);
        });

        routeRegionPanels.forEach((panel) => {
            panel.hidden = panel.dataset.regionPanel !== activePanelName;
        });

        if (routeSubregionsColumn) routeSubregionsColumn.hidden = false;
    }

    function scheduleRegionActivation(tab) {
        let activeTab = document.querySelector('[data-region-tab].route-menu__option--active');

        if (!activeTab) {
            activateRegion(tab);
            return;
        }

        if (activeTab === tab) return;

        clearRegionHoverTimer();
        routeRegionHoverTimer = setTimeout(() => {
            activateRegion(tab);
        }, routeHoverDelay);
    }

    function scheduleCountryActivation(tab) {
        let activeTab = document.querySelector('[data-countries-tab].route-menu__option--active');

        if (!activeTab) {
            activateCountryGroup(tab);
            return;
        }

        if (activeTab === tab) return;

        clearCountryHoverTimer();
        routeCountryHoverTimer = setTimeout(() => {
            activateCountryGroup(tab);
        }, routeHoverDelay);
    }

    routeTabs.forEach((tab) => {
        tab.addEventListener('mouseenter', () => {
            if (finePointerMedia.matches) activateRouteTab(tab);
        });
        tab.addEventListener('click', () => activateRouteTab(tab));
    });

    routeRegionTabs.forEach((tab) => {
        tab.addEventListener('mouseenter', () => {
            if (finePointerMedia.matches) scheduleRegionActivation(tab);
        });
        tab.addEventListener('click', () => activateRegion(tab));
    });

    routeCountryTabs.forEach((tab) => {
        tab.addEventListener('mouseenter', () => {
            if (finePointerMedia.matches) scheduleCountryActivation(tab);
        });
        tab.addEventListener('click', () => activateCountryGroup(tab));
    });

    if (routeRegionsColumn) {
        routeRegionsColumn.addEventListener('mouseleave', (event) => {
            if (!finePointerMedia.matches) return;

            if (
                isInsideColumn(routeSubregionsColumn, event.relatedTarget) ||
                isInsideColumn(routeCountriesColumn, event.relatedTarget)
            ) return;

            resetRegionLevel();
        });
    }

    if (routeSubregionsColumn) {
        routeSubregionsColumn.addEventListener('mouseenter', () => {
            if (finePointerMedia.matches) clearRegionHoverTimer();
        });
        routeSubregionsColumn.addEventListener('mouseleave', (event) => {
            if (!finePointerMedia.matches) return;

            if (isInsideColumn(routeCountriesColumn, event.relatedTarget)) return;

            resetRegionLevel();
        });
    }

    if (routeCountriesColumn) {
        routeCountriesColumn.addEventListener('mouseenter', () => {
            if (!finePointerMedia.matches) return;

            clearRegionHoverTimer();
            clearCountryHoverTimer();
        });
        routeCountriesColumn.addEventListener('mouseleave', () => {
            if (finePointerMedia.matches) resetCountryLevel();
        });
    }

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;

        closeBurgerMenu();
        closeRouteMenu();
    });

    let routeMenuBreakpoint = window.matchMedia('(max-width: 1100px)');

    routeMenuBreakpoint.addEventListener('change', (event) => {
        if (event.matches) closeRouteMenu();
    });

    [sheetMenuMedia, headerNavMedia, languageMedia].forEach((media) => {
        media.addEventListener('change', () => {
            syncMobileHeader();
            syncMenuScrollLock();
        });
    });

    let burgerTabs = document.querySelectorAll('.burger-menu__tab');
    let burgerTabsList = document.querySelector('.burger-menu__tabs');
    let burgerPanels = document.querySelectorAll('.burger-menu__panel');


    function updateMenuPanelHeight(activeTab, activePanel) {
        let panelHeight = activeTab.offsetTop + activeTab.offsetHeight;

        activePanel.style.setProperty(
            '--panel-min-height',
            `${panelHeight}px`
        );
    }


    function activateBurgerTab(activeTab) {
        let activePanelName = activeTab.dataset.menuTab;

        burgerTabs.forEach((tab) => {
            tab.classList.toggle(
                'burger-menu__tab--active',
                tab === activeTab
            );
        });

        burgerPanels.forEach((panel) => {
            panel.hidden = panel.dataset.menuPanel !== activePanelName;
        });

        let activePanel = document.querySelector(`[data-menu-panel="${activePanelName}"]`);

        if (!activePanel) return;

        updateMenuPanelHeight(activeTab, activePanel);
    }

    burgerTabs.forEach((tab) => {
        tab.addEventListener('mouseenter', () => {
            if (finePointerMedia.matches) activateBurgerTab(tab);
        });
        tab.addEventListener('click', () => activateBurgerTab(tab));
    });

}

if (window.sharedMenusReady) {
    window.sharedMenusReady
        .then(initHeaderMenus)
        .catch((error) => {
            console.error(error);
            initHeaderMenus();
        });
} else {
    initHeaderMenus();
}






let whyChoseSlider = document.querySelector('.why-chose__slider');
let whyChoseSwiper = null;
let whyChoseMedia = window.matchMedia('(max-width: 648px)');

function setWhyChoseSlider() {
    if (whyChoseMedia.matches && !whyChoseSwiper && typeof Swiper !== 'undefined') {
        whyChoseSwiper = new Swiper(whyChoseSlider, {
            slidesPerView: 'auto',
            spaceBetween: 8,
            loop: true,
            speed: 500,
            grabCursor: true,
        });
    }

    if (!whyChoseMedia.matches && whyChoseSwiper) {
        whyChoseSwiper.destroy(true, true);
        whyChoseSwiper = null;
    }
}

if (whyChoseSlider) {
    setWhyChoseSlider();
    whyChoseMedia.addEventListener('change', setWhyChoseSlider);
}


// Both layouts use the same countries, dates and traveler count.
let mobileForm = document.querySelector('.hero-mobile-form');
let mobileTripTabs = document.querySelectorAll('.hero-mobile-form__tab');
let mobileCountry = mobileForm?.querySelector('.hero-mobile-form__country');
let mobileCountryToggle = mobileForm?.querySelector('.hero-mobile-form__field--select');
let mobileCountryValue = mobileForm?.querySelector('.hero-mobile-form__country-value');
let mobileCountryDropdown = mobileForm?.querySelector('.hero-mobile-form__country-dropdown');
let mobileCountrySearch = mobileForm?.querySelector('.hero-mobile-form__country-search');
let mobileCountryOptions = mobileForm?.querySelector('.hero-mobile-form__country-options');
let mobileCountryEmpty = mobileForm?.querySelector('.hero-mobile-form__country-empty');
let mobileDate = mobileForm?.querySelector('.hero-mobile-form__date');
let mobileDateButton = mobileForm?.querySelector('.hero-mobile-form__field--date');
let mobileDateValue = mobileForm?.querySelector('.hero-mobile-form__date-value');
let mobileCalendar = mobileForm?.querySelector('.hero-mobile-form__calendar');
let mobileMonth = mobileCalendar?.querySelector('.calendar__month');
let passengerValue = mobileForm?.querySelector('.hero-mobile-form__passenger-value');
let mobileMinus = mobileForm?.querySelector('.hero-mobile-form__counter-btn--minus');
let mobileAge = mobileForm?.querySelector('.hero-mobile-form__age');
let mobileStatus = mobileForm?.querySelector('.hero-mobile-form__status');
let mobileFormSubmitted = false;


let insuranceSlider = document.querySelector('.insurance__slider');
let insuranceSwiper = null;
let insuranceMedia = window.matchMedia('(max-width: 648px)');

function setInsuranceSlider() {
    if (insuranceMedia.matches && !insuranceSwiper && typeof Swiper !== 'undefined') {
        insuranceSwiper = new Swiper(insuranceSlider, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,

            pagination: {
                el: '.insurance__pagination',
                clickable: true,
            },
        });
    }
    if (!insuranceMedia.matches && insuranceSwiper) {
        insuranceSwiper.destroy(true, true);
        insuranceSwiper = null;
    }
}
if (insuranceSlider) {
    setInsuranceSlider();
    insuranceMedia.addEventListener('change', setInsuranceSlider);
}


let countriesSlider = document.querySelector('.countries__slider');
let countriesSwiper = null;
let countriesMedia = window.matchMedia('(max-width: 648px)');

function setCountriesSlider() {
    if (countriesMedia.matches && !countriesSwiper && typeof Swiper !== 'undefined') {
        countriesSwiper = new Swiper(countriesSlider, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,

            pagination: {
                el: '.countries__pagination',
                clickable: true,
            },
        });
    }

    if (!countriesMedia.matches && countriesSwiper) {
        countriesSwiper.destroy(true, true);
        countriesSwiper = null;
    }
}

if (countriesSlider) {
    setCountriesSlider();
    countriesMedia.addEventListener('change', setCountriesSlider);
}


let stepsSlider = document.querySelector('.steps__slider');
let stepsSwiper = null;
let stepsMedia = window.matchMedia('(max-width: 648px)');

function setStepsSlider() {
    if (stepsMedia.matches && !stepsSwiper && typeof Swiper !== 'undefined') {
        stepsSwiper = new Swiper(stepsSlider, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,

            pagination: {
                el: '.steps__pagination',
                clickable: true,
            },
        });
    }

    if (!stepsMedia.matches && stepsSwiper) {
        stepsSwiper.destroy(true, true);
        stepsSwiper = null;
    }
}

if (stepsSlider) {
    setStepsSlider();
    stepsMedia.addEventListener('change', setStepsSlider);
}


let benefitsSlider = document.querySelector('.benefits__slider');
let benefitsSwiper = null;
let benefitsMedia = window.matchMedia('(max-width: 648px)');

function setBenefitsSlider() {
    if (benefitsMedia.matches && !benefitsSwiper && typeof Swiper !== 'undefined') {
        benefitsSwiper = new Swiper(benefitsSlider, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,

            pagination: {
                el: '.benefits__pagination',
                clickable: true,
            },
        });
    }

    if (!benefitsMedia.matches && benefitsSwiper) {
        benefitsSwiper.destroy(true, true);
        benefitsSwiper = null;
    }
}

if (benefitsSlider) {
    setBenefitsSlider();
    benefitsMedia.addEventListener('change', setBenefitsSlider);
}


let insuranceTermsSlider = document.querySelector('.insurance-terms__slider');
let insuranceTermsSwiper = null;
let insuranceTermsMedia = window.matchMedia('(max-width: 648px)');

function setInsuranceTermsSlider() {
    if (insuranceTermsMedia.matches && !insuranceTermsSwiper && typeof Swiper !== 'undefined') {
        insuranceTermsSwiper = new Swiper(insuranceTermsSlider, {
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,

            pagination: {
                el: '.insurance-terms__pagination',
                clickable: true,
            },
        });
    }

    if (!insuranceTermsMedia.matches && insuranceTermsSwiper) {
        insuranceTermsSwiper.destroy(true, true);
        insuranceTermsSwiper = null;
    }
}

if (insuranceTermsSlider) {
    setInsuranceTermsSlider();
    insuranceTermsMedia.addEventListener('change', setInsuranceTermsSlider);
}


function animateDisclosure(element, button, changeState, isClosing = false) {
    if (!element || !button || button.disabled) return;

    let section = element.closest('section') || element;
    let startScroll = window.scrollY;
    let sectionTop = section.getBoundingClientRect().top + startScroll;
    let startHeight = element.getBoundingClientRect().height;

    element.style.height = `${startHeight}px`;
    element.style.overflow = 'hidden';

    changeState();

    element.style.height = 'auto';
    let endHeight = element.getBoundingClientRect().height;
    element.style.height = `${startHeight}px`;

    let reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    button.disabled = true;

    let animation = element.animate(
        [
            { height: `${startHeight}px` },
            { height: `${endHeight}px` },
        ],
        {
            duration: reducedMotion ? 0 : 700,
            easing: 'ease-in-out',
        }
    );

    if (isClosing && startScroll > sectionTop) {
        function followCollapse() {
            let progress = animation.effect.getComputedTiming().progress;

            if (progress === null) {
                progress = animation.playState === 'finished' ? 1 : 0;
            }

            window.scrollTo({
                top: startScroll + (sectionTop - startScroll) * progress,
                behavior: 'instant',
            });

            if (animation.playState !== 'finished') {
                requestAnimationFrame(followCollapse);
            }
        }

        requestAnimationFrame(followCollapse);
    }

    animation.onfinish = () => {
        element.style.height = '';
        element.style.overflow = '';
        button.disabled = false;
    };
}


let expertReadMore = document.querySelector('.expert__read-more');
let expertText = document.querySelector('.expert__text');

expertReadMore?.addEventListener('click', () => {
    let isOpen = !expertText.classList.contains('expert__text--open');

    expertReadMore.textContent = isOpen ? 'Show less' : 'Read more';
    expertReadMore.setAttribute('aria-expanded', String(isOpen));

    animateDisclosure(expertText, expertReadMore, () => {
        expertText.classList.toggle('expert__text--open', isOpen);
    }, !isOpen);
});


let schengenCountriesGrid = document.querySelector('.shengen-contries__grid');
let schengenCountriesMore = document.querySelector('.shengen-contries__more');

schengenCountriesMore?.addEventListener('click', () => {
    let isOpen = !schengenCountriesGrid.classList.contains('shengen-contries__grid--open');

    schengenCountriesMore.textContent = isOpen ? 'Show less' : 'Read more';
    schengenCountriesMore.setAttribute('aria-expanded', String(isOpen));

    animateDisclosure(schengenCountriesGrid, schengenCountriesMore, () => {
        schengenCountriesGrid.classList.toggle('shengen-contries__grid--open', isOpen);
    }, !isOpen);
});


let reviewsSection = document.querySelector('.reviews');
let reviewsBtn = document.querySelector('.reviews__btn');
let reviewsItem = document.querySelectorAll('.reviews__item[hidden]');
let reviewsCards = document.querySelectorAll('.reviews__item');
let reviewsMobileCards = Array.from(reviewsCards).slice(0, 4);
let reviewsList = document.querySelector('.reviews__list');
let reviewsExpendet = false;
let reviewsSlider = document.querySelector('.reviews__slider');
let reviewsSwiper = null;
let reviewsMedia = window.matchMedia('(max-width: 648px)');

function setReviewsSliderReserve() {
    if (!reviewsSlider || !reviewsMedia.matches) {
        reviewsSlider?.style.removeProperty('--reviews-card-height');
        return;
    }

    reviewsSlider.style.removeProperty('--reviews-card-height');

    let maxCardHeight = Math.max(
        ...reviewsMobileCards.map((card) => card.scrollHeight)
    );

    reviewsSlider.style.setProperty(
        '--reviews-card-height',
        `${Math.ceil(maxCardHeight)}px`
    );
}

function setReviewsSlider() {
    if (reviewsMedia.matches && !reviewsSwiper && typeof Swiper !== 'undefined') {
        reviewsList.classList.add('swiper-wrapper');

        reviewsCards.forEach((item) => {
            let isMobileSlide = reviewsMobileCards.includes(item);

            item.hidden = !isMobileSlide;
            item.classList.toggle('reviews__item--mobile', isMobileSlide);
            item.classList.toggle('swiper-slide', isMobileSlide);

            if (!isMobileSlide) item.remove();
        });
        reviewsBtn.hidden = true;
        setReviewsSliderReserve();

        reviewsSwiper = new Swiper(reviewsSlider, {
            slidesPerView: 1,
            spaceBetween: 20,
            speed: 450,
            loop: true,
            grabCursor: true,

            pagination: {
                el: '.reviews__pagination',
                clickable: true,
            },
        });
    }

    if (!reviewsMedia.matches && reviewsSwiper) {
        reviewsSwiper.destroy(true, true);
        reviewsSwiper = null;
        reviewsSlider.style.removeProperty('--reviews-card-height');
        reviewsList.classList.remove('swiper-wrapper');

        reviewsCards.forEach((item, index) => {
            reviewsList.append(item);
            item.classList.remove('reviews__item--mobile');
            item.classList.remove('swiper-slide');
            item.hidden = index >= 4 && !reviewsExpendet;
        });
        reviewsBtn.hidden = false;
    }
}

if (reviewsSlider) {
    setReviewsSlider();
    reviewsMedia.addEventListener('change', setReviewsSlider);

    window.addEventListener('resize', () => {
        if (!reviewsMedia.matches) return;

        setReviewsSliderReserve();
        reviewsSwiper?.update();
    });

    document.fonts?.ready.then(() => {
        if (!reviewsMedia.matches) return;

        setReviewsSliderReserve();
        reviewsSwiper?.update();
    });
}

reviewsBtn?.addEventListener('click', () => {
    let startScroll = window.scrollY;
    let sectionTop = reviewsSection.getBoundingClientRect().top + startScroll;

    let startHeight = reviewsList.getBoundingClientRect().height;

    reviewsSection.style.minHeight = `${reviewsSection.getBoundingClientRect().height}px`;

    reviewsExpendet = !reviewsExpendet;

    reviewsItem.forEach((item) => {
        item.hidden = !reviewsExpendet;

    });

    let endHeight = reviewsList.getBoundingClientRect().height;

    if (!reviewsExpendet) {
        reviewsItem.forEach((item) => {
            item.hidden = false;
        });
    }

    reviewsBtn.disabled = true;

    let reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;


    let animation = reviewsList.animate([

        { height: `${startHeight}px` },
        { height: `${endHeight}px` },
    ],
        {
            duration: reducedMotion ? 0 : 700,
            easing: 'ease-in-out'
        });

    reviewsSection.style.minHeight = '';

    if (!reviewsExpendet && startScroll > sectionTop) {
        function followCollapse() {
            let progress = animation.effect.getComputedTiming().progress;

            if (progress === null) {
                progress = animation.playState === 'finished' ? 1 : 0;
            }

            window.scrollTo({
                top: startScroll + (sectionTop - startScroll) * progress,
                behavior: 'instant'
            });

            if (animation.playState !== 'finished') {
                requestAnimationFrame(followCollapse);
            }
        }
        requestAnimationFrame(followCollapse);
    }

    animation.onfinish = () => {
        reviewsItem.forEach((item) => {
            item.hidden = !reviewsExpendet;
        });

        reviewsBtn.textContent = reviewsExpendet
            ? 'Close all reviews'
            : 'See all reviews';

        reviewsBtn.disabled = false;
    };

});


let rulesSlider = document.querySelector('.rules__slider');
let rulesSwiper = null;
let rulesMedia = window.matchMedia('(max-width: 648px)');

function setRulesSlider() {
    if (rulesMedia.matches && !rulesSwiper && typeof Swiper !== 'undefined') {
        rulesSwiper = new Swiper(rulesSlider, {
            wrapperClass: 'rules__list',
            slideClass: 'rules__item',
            slidesPerView: 1,
            spaceBetween: 20,
            loop: true,

            pagination: {
                el: '.rules__pagination',
                clickable: true,
            },
        });
    }

    if (!rulesMedia.matches && rulesSwiper) {
        rulesSwiper.destroy(true, true);
        rulesSwiper = null;
    }
}

if (rulesSlider) {
    setRulesSlider();
    rulesMedia.addEventListener('change', setRulesSlider);
}


let policySlider = document.querySelector('.policy__slider');
let policySwiper = null;

function setPolicySlider() {
    if (!policySwiper && policySlider && typeof Swiper !== 'undefined') {
        policySwiper = new Swiper(policySlider, {
            wrapperClass: 'policy__grid',
            slideClass: 'policy__card',
            slidesPerView: 1,
            spaceBetween: 8,
            speed: 500,
            loop: true,
            grabCursor: true,
            navigation: {
                prevEl: '.policy__button-prev',
                nextEl: '.policy__button-next',
            },
            pagination: {
                el: '.policy__pagination',
                clickable: true,
            },
            breakpoints: {
                649: {
                    slidesPerView: 2,
                },
                1301: {
                    slidesPerView: 3,
                    spaceBetween: 24,
                },
            },
        });
    }
}

if (policySlider) {
    setPolicySlider();
}


let powersSlider = document.querySelector('.powers__slider');
let powersSwiper = null;
let powersMedia = window.matchMedia('(max-width: 648px)');

function setPowersSlider() {
    if (powersMedia.matches && !powersSwiper && powersSlider && typeof Swiper !== 'undefined') {
        powersSwiper = new Swiper(powersSlider, {
            wrapperClass: 'powers__cards',
            slideClass: 'powers__card',
            slidesPerView: 1,
            spaceBetween: 20,
            speed: 500,
            loop: true,
            grabCursor: true,
            pagination: {
                el: '.powers__pagination',
                clickable: true,
            },
        });
    }

    if (!powersMedia.matches && powersSwiper) {
        powersSwiper.destroy(true, true);
        powersSwiper = null;
    }
}

if (powersSlider) {
    setPowersSlider();
    powersMedia.addEventListener('change', setPowersSlider);
}


let teamSlider = document.querySelector('.team__slider');
let teamSwiper = null;
let teamMedia = window.matchMedia('(max-width: 648px)');

function setTeamSlider() {
    if (teamMedia.matches && !teamSwiper && teamSlider && typeof Swiper !== 'undefined') {
        teamSwiper = new Swiper(teamSlider, {
            wrapperClass: 'team__list',
            slideClass: 'team__item',
            slidesPerView: 1,
            spaceBetween: 20,
            speed: 500,
            loop: true,
            grabCursor: true,
            pagination: {
                el: '.team__pagination',
                clickable: true,
            },
        });
    }

    if (!teamMedia.matches && teamSwiper) {
        teamSwiper.destroy(true, true);
        teamSwiper = null;
    }
}

if (teamSlider) {
    setTeamSlider();
    teamMedia.addEventListener('change', setTeamSlider);
}


let trustedCompaniesSlider = document.querySelector('.trusted-companies__slider');
let trustedCompaniesSwiper = null;
let trustedCompaniesMedia = window.matchMedia('(max-width: 648px)');

function setTrustedCompaniesSlider() {
    if (trustedCompaniesMedia.matches && !trustedCompaniesSwiper && trustedCompaniesSlider && typeof Swiper !== 'undefined') {
        trustedCompaniesSwiper = new Swiper(trustedCompaniesSlider, {
            wrapperClass: 'trusted-companies__list',
            slideClass: 'trusted-companies__item',
            slidesPerView: 'auto',
            spaceBetween: 20,
            speed: 500,
            loop: true,
            grabCursor: true,
            pagination: {
                el: '.trusted-companies__pagination',
                clickable: true,
                dynamicBullets: true,
                dynamicMainBullets: 3,
            },
        });
    }

    if (!trustedCompaniesMedia.matches && trustedCompaniesSwiper) {
        trustedCompaniesSwiper.destroy(true, true);
        trustedCompaniesSwiper = null;
    }
}

if (trustedCompaniesSlider) {
    setTrustedCompaniesSlider();
    trustedCompaniesMedia.addEventListener('change', setTrustedCompaniesSlider);
}


let faqItems = document.querySelectorAll('.faq__item');
let faqMedia = window.matchMedia('(max-width: 648px)');
let faqIsAnimating = false;

function animateFaqItem(item, isOpen) {
    let question = item.querySelector('.faq__question');
    let answer = item.querySelector('.faq__answer');
    let startHeight = item.getBoundingClientRect().height;
    let startPadding = getComputedStyle(question).padding;
    let reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches;

    if (isOpen) {
        answer.hidden = false;
        item.classList.add('faq__item--open');
    } else {
        item.classList.remove('faq__item--open');
        answer.hidden = true;
    }

    question.setAttribute('aria-expanded', String(isOpen));

    item.style.height = 'auto';
    let endHeight = item.getBoundingClientRect().height;
    let endPadding = getComputedStyle(question).padding;

    if (!isOpen) answer.hidden = false;

    item.style.height = `${startHeight}px`;
    item.style.overflow = 'hidden';

    let options = {
        duration: reducedMotion ? 0 : 550,
        easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
    };

    let heightAnimation = item.animate(
        [
            { height: `${startHeight}px` },
            { height: `${endHeight}px` },
        ],
        options
    );

    let paddingAnimation = question.animate(
        [
            { padding: startPadding },
            { padding: endPadding },
        ],
        options
    );

    return Promise.all([
        heightAnimation.finished,
        paddingAnimation.finished,
    ]).finally(() => {
        answer.hidden = !isOpen;
        item.style.height = '';
        item.style.overflow = '';
    });
}

function normalizeFaq() {
    if (!faqMedia.matches) return;

    document.querySelectorAll('.faq__item--open').forEach((item, index) => {
        if (index === 0) return;

        item.classList.remove('faq__item--open');
        item.querySelector('.faq__answer').hidden = true;
        item.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
    });
}

normalizeFaq();
faqMedia.addEventListener('change', normalizeFaq);

document.querySelectorAll('.faq__question').forEach((question) => {
    question.setAttribute(
        'aria-expanded',
        String(question.closest('.faq__item').classList.contains('faq__item--open'))
    );

    question.addEventListener('click', async () => {
        if (faqIsAnimating) return;

        let item = question.closest('.faq__item');
        let willOpen = !item.classList.contains('faq__item--open');
        let animations = [];

        faqItems.forEach((faqItem) => {
            if (faqItem.classList.contains('faq__item--open')) {
                animations.push(animateFaqItem(faqItem, false));
            }
        });

        if (willOpen) {
            animations.push(animateFaqItem(item, true));
        }

        faqIsAnimating = true;
        await Promise.allSettled(animations);
        faqIsAnimating = false;
    });
});


document.querySelectorAll('[data-contact-select]').forEach((select) => {
    let trigger = select.querySelector('.contact__select-trigger');
    let list = select.querySelector('.contact__select-list');
    let value = select.querySelector('.contact__select-text');
    let input = select.querySelector('.contact__select-input');
    let options = select.querySelectorAll('.contact__select-option');

    function closeContactSelect() {
        list.hidden = true;
        select.classList.remove('contact__select--open');
    }

    function openContactSelect() {
        list.hidden = false;
        select.classList.add('contact__select--open');
    }

    trigger.addEventListener('click', () => {
        if (list.hidden) {
            openContactSelect();
        } else {
            closeContactSelect();
        }
    });

    options.forEach((option) => {
        option.addEventListener('click', () => {
            value.textContent = option.textContent.trim();
            input.value = option.dataset.value;

            options.forEach((item) => {
                item.classList.remove('contact__select-option--selected');
            });

            option.classList.add('contact__select-option--selected');
            closeContactSelect();
        });
    });

    document.addEventListener('click', (event) => {
        if (!select.contains(event.target)) closeContactSelect();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape' || list.hidden) return;

        closeContactSelect();
        trigger.focus();
    });
});

let popularList = document.querySelector('.form-country__options--popular');
let allList = document.querySelector('.form-country__options--all');

let popularCountries = ['Germany', 'France', 'Spain', 'Italy', 'Greece',];
let allCountries = [];

document.querySelectorAll('.route-menu__country-btn span, .menu-countries__link span').forEach((item) => {
    let name = item.textContent.trim();

    if (name && !allCountries.includes(name)) {
        allCountries.push(name);
    }
});

allCountries.sort((a, b) => a.localeCompare(b, 'en'));

function renderCountries(list, countries) {
    list.replaceChildren();

    countries.forEach((name) => {
        let item = document.createElement('li');
        item.className = 'form-country__item'

        item.innerHTML = `
        <label class="form-country__option">
                <input class="form-country__checkbox" type="checkbox">
                <span class="form-country__name"></span>
            </label>
        `;

        item.querySelector('.form-country__checkbox').value = name;
        item.querySelector('.form-country__name').textContent = name;

        list.append(item);
    });
}

if (popularList && allList) {
    renderCountries(popularList, popularCountries);
    renderCountries(allList, allCountries);
}

let countrySearch = document.querySelector('.form-country__search');
let countryCaption = document.querySelectorAll('.form-country__caption');
let countryEmpty = document.querySelector('.form-country__empty');
let countryDropdown = document.querySelector('.form-country__dropdown');
let countryToggle = document.querySelector('.form-country__toggle');
let country = document.querySelector('.form-country');
let countryTags = document.querySelector('.form-country__tags');
let countrySelection = document.querySelector('.form-country__selection');
let countryDone = document.querySelector('.form-country__done');
let countryScroll = document.querySelector('.form-country__scroll');

let selectedCountries = [];

function openCountryMenu() {
    if (country.classList.contains('form-country--open')) return;

    closeMobileCountry();
    closeMobileCalendar();
    closeCalendar();
    closeTravelers();
    countrySearch.value = '';
    filterCountries();
    country.classList.add('form-country--open');
    countryDropdown.hidden = false;
    countryToggle.setAttribute('aria-expanded', 'true');
    countryToggle.setAttribute('aria-label', 'Close country list');
}

function closeCountryMenu() {
    country.classList.remove('form-country--open');
    countryDropdown.hidden = true;
    countrySearch.value = selectedCountries.join(', ');
    countrySearch.scrollLeft = 0;
    countryToggle.setAttribute('aria-expanded', 'false');
    countryToggle.setAttribute('aria-label', 'Open country list');
}

function filterCountries() {
    let query = countrySearch.value.trim().toLowerCase();
    let items = allList.querySelectorAll('.form-country__item');
    countryCaption.forEach((caption) => {
        caption.hidden = query !== '';
    });
    popularList.hidden = query !== '';
    let found = 0;
    items.forEach((item) => {
        let name = item.querySelector('.form-country__name').textContent.toLowerCase();
        item.hidden = !name.startsWith(query);
        if (!item.hidden) {
            found++;
        }
    });
    countryEmpty.hidden = found > 0;
    countryScroll.scrollTop = 0;
}

function updateCountrySelection() {
    let checkboxes = countryDropdown.querySelectorAll('.form-country__checkbox');

    checkboxes.forEach((check) => {
        check.checked = selectedCountries.includes(check.value);
    });
    countryTags.replaceChildren();

    selectedCountries.forEach((name) => {
        let item = document.createElement('li');
        item.className = 'form-country__tag';
        item.innerHTML = `
      <span class="form-country__tag-name"></span>
      <button class="form-country__tag-remove" type="button">
        <img src="img/form/remove.svg" alt="">
      </button>
        `;
        item.querySelector('.form-country__tag-name').textContent = name;
        let removeButton = item.querySelector('.form-country__tag-remove');
        removeButton.setAttribute('aria-label', `Remove ${name}`);
        removeButton.addEventListener('click', () => {
            selectedCountries = selectedCountries.filter((countryName) => countryName !== name);
            updateCountrySelection();
            countryDone.focus();
            if (selectedCountries.length === 0) countrySearch.focus();
        });

        countryTags.append(item);
    });
    countrySelection.hidden = selectedCountries.length === 0;
    syncMobileCountries();
}

countrySearch.addEventListener('focus', openCountryMenu);
countrySearch.addEventListener('click', openCountryMenu);
countrySearch.addEventListener('input', filterCountries);

countryToggle.addEventListener('click', () => {
    if (country.classList.contains('form-country--open')) {
        closeCountryMenu();
    } else {
        openCountryMenu();
    }
});

countryDropdown.addEventListener('change', (event) => {
    let checkbox = event.target;
    if (!checkbox.matches('.form-country__checkbox')) return;

    if (checkbox.checked) {
        if (!selectedCountries.includes(checkbox.value)) {
            selectedCountries.push(checkbox.value);
        }
    } else {
        selectedCountries = selectedCountries.filter((name) => name !== checkbox.value);
    }
    updateCountrySelection();
});

countryDone.addEventListener('click', () => {
    closeCountryMenu();
    countryToggle.focus();
});

document.addEventListener('click', (event) => {
    if (!event.composedPath().includes(country) && country.classList.contains('form-country--open')) {
        closeCountryMenu();
    }
});

country.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && country.classList.contains('form-country--open')) {
        closeCountryMenu();
        countryToggle.focus();
    }
});

country.querySelectorAll('.form-field__option').forEach((button) => {
    button.addEventListener('click', () => {
        let name = button.textContent.trim();
        if (!selectedCountries.includes(name)) selectedCountries.push(name);
        updateCountrySelection();
        closeCountryMenu();
    });
});

updateCountrySelection();
closeCountryMenu();

let dateField = document.querySelector('.form-date');
let dateButton = document.querySelector('.form-field__btn-date');
let calendar = document.querySelector('.calendar');
let confirmButton = calendar.querySelector('.calendar__confirm');
let nextButton = calendar.querySelector('.calendar__nav--next');
let prevButton = calendar.querySelector('.calendar__nav--prev');
let startValue = dateField.querySelector('.form-date__start');
let endValue = dateField.querySelector('.form-date__end');
let rangeValue = dateField.querySelector('.form-date__range');
let annualValue = dateField.querySelector('.form-date__annual-value');
let annualCaption = dateField.querySelector('.form-date__annual-caption');
let annualDate = dateField.querySelector('.form-date__annual-date');
let dateError = dateField.querySelector('.form-date__error');
let annualCheckbox = dateField.querySelector('.form-field__annual-checkbox')
let today = new Date();
today.setHours(0, 0, 0, 0);
let currentYear = today.getFullYear();
let currentMonth = today.getMonth();
let months = calendar.querySelectorAll('.calendar__month');
let startDate = null;
let endDate = null;
let datesConfirmed = false;



function renderMonth(year, month, monthElement) {
    let monthTitle = monthElement.querySelector('.calendar__title');
    let firstDay = new Date(year, month, 1);
    let offset = (firstDay.getDay() + 6) % 7;
    let daysInMonth = new Date(year, month + 1, 0).getDate();
    monthTitle.textContent = firstDay.toLocaleDateString('en', {
        month: 'long',
        year: 'numeric'
    });
    let dayList = monthElement.querySelector('.calendar__days');
    dayList.replaceChildren();

    for (let i = 0; i < offset; i++) {
        let empty = document.createElement('span');
        dayList.append(empty);
    }
    for (let day = 1; day <= daysInMonth; day++) {
        let dayButton = document.createElement('button');
        dayButton.type = 'button';
        dayButton.className = 'calendar__day';
        dayButton.textContent = day;
        let dayDate = new Date(year, month, day);
        dayButton.dataset.date = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        dayButton.setAttribute('aria-label', dayDate.toLocaleDateString('en', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        }));
        dayButton.disabled = dayDate < today;
        if (startDate !== null && dayDate.getTime() === startDate.getTime()) {
            dayButton.classList.add('calendar__day--start');
        }
        if (endDate !== null && dayDate.getTime() === endDate.getTime()) {
            dayButton.classList.add('calendar__day--end');
        }
        dayButton.setAttribute('aria-pressed', String(
            (startDate !== null && dayDate.getTime() === startDate.getTime()) ||
            (endDate !== null && dayDate.getTime() === endDate.getTime())
        ));
        if (startDate !== null && endDate !== null && dayDate >= startDate && dayDate <= endDate) {
            dayButton.classList.add('calendar__day--in-range');
        }

        dayButton.addEventListener('click', () => {
            datesConfirmed = false;
            if (annualCheckbox.checked) {
                startDate = dayDate;
                endDate = null;
            } else {
                if (startDate === null || endDate !== null) {
                    startDate = dayDate;
                    endDate = null;
                } else if (dayDate < startDate) {
                    startDate = dayDate;
                } else {
                    endDate = dayDate;
                }
            }
            renderCalendar();
            monthElement.querySelector(`[data-date="${dayButton.dataset.date}"]`)?.focus({ preventScroll: true });
        });
        dayList.append(dayButton);
    }
}
function renderCalendar() {
    renderMonth(currentYear, currentMonth, months[0]);
    renderMonth(currentYear, currentMonth + 1, months[1]);
    let visibleMonth = new Date(currentYear, currentMonth, 1);
    let earliestMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    prevButton.disabled = visibleMonth <= earliestMonth;
    rangeValue.hidden = annualCheckbox.checked;
    rangeValue.querySelector('[aria-hidden]').hidden = startDate === null;
    annualValue.hidden = !annualCheckbox.checked;
    if (annualCheckbox.checked) {
        confirmButton.hidden = startDate === null;
        annualCaption.textContent = startDate === null
            ? 'Choose your annual policy start date'
            : 'Annual policy start date: ';

        annualDate.textContent = startDate === null
            ? ''
            : formatDate(startDate);
    } else {
        confirmButton.hidden = startDate === null || endDate === null;
    }
    if (startDate === null) {
        startValue.textContent = 'Select date';
        endValue.textContent = '';
        dateField.classList.remove('form-date--selected');
    } else {
        startValue.textContent = formatDate(startDate);
        dateField.classList.add('form-date--selected');
        if (endDate !== null) {
            endValue.textContent = formatDate(endDate);
            dateError.hidden = true;
            dateField.classList.remove('form-date--error');
        } else {
            endValue.textContent = '00.00.0000'
        }
    }
    renderMobileCalendar();
}
renderCalendar();

function formatDate(date) {
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function closeCalendar() {
    dateField.classList.remove('form-date--open');
    calendar.hidden = true;
    dateButton.ariaExpanded = 'false';
}
dateButton.addEventListener('click', () => {
    if (!calendar.hidden) {
        closeCalendar();
        return;
    }
    closeCountryMenu();
    closeTravelers();
    closeMobileCountry();
    closeMobileCalendar();
    dateField.classList.add('form-date--open');
    calendar.hidden = false;
    dateButton.setAttribute('aria-expanded', 'true');

});

nextButton.addEventListener('click', () => {
    currentMonth++;
    renderCalendar();
});
prevButton.addEventListener('click', () => {
    currentMonth--;
    renderCalendar();
});

confirmButton.addEventListener('click', () => {
    datesConfirmed = true;
    closeCalendar()
    dateButton.focus();
});
document.addEventListener('click', (event) => {
    if (!event.composedPath().includes(dateField) && calendar.hidden === false) {
        if (!annualCheckbox.checked && startDate !== null && endDate === null) {
            dateError.hidden = false;
            dateField.classList.add('form-date--error');
        } else {
            closeCalendar()
        }
    }
});

annualCheckbox.addEventListener('change', () => {
    setTripType(annualCheckbox.checked);
});


let travelers = document.querySelector('.form-travelers');
let travelersToggle = travelers.querySelector('.form-travelers__toggle');
let travelersDropdown = travelers.querySelector('.form-travelers__dropdown');
let travelersConfirm = travelers.querySelector('.form-travelers__confirm');
let travelersPlus = travelers.querySelector('.form-travelers__step--plus');
let travelersMinus = travelers.querySelector('.form-travelers__step--minus');
let travelersCount = travelers.querySelector('.form-travelers__count');
let travelersValue = travelers.querySelector('.form-travelers__value');
let travelersNumber = 1;


function closeTravelers() {
    travelers.classList.remove('form-travelers--open');
    travelersDropdown.hidden = true;
    travelersToggle.setAttribute('aria-expanded', 'false');
}

function updateTravelers() {
    travelersCount.textContent = travelersNumber;
    travelersValue.textContent = travelersNumber === 1
        ? '1 person'
        : `${travelersNumber} persons`;
    travelersMinus.disabled = travelersNumber <= 1;
    if (passengerValue) {
        passengerValue.value = travelersNumber;
        mobileMinus.disabled = travelersNumber <= 1;
        mobileForm.querySelector('#mobile-age-hint').hidden = travelersNumber === 1;
        mobileAge.inputMode = travelersNumber === 1 ? 'numeric' : 'text';
        clearMobileError(passengerValue, 'mobile-travelers-error');
        if (mobileFormSubmitted) validateMobileAge();
        clearMobileStatus();
    }
}

travelersToggle.addEventListener('click', () => {
    if (!travelersDropdown.hidden) {
        closeTravelers();
        return;
    }
    closeCountryMenu();
    closeCalendar();
    closeMobileCountry();
    closeMobileCalendar();
    travelers.classList.add('form-travelers--open');
    travelersDropdown.hidden = false;
    travelersToggle.setAttribute('aria-expanded', 'true');
});

travelersConfirm.addEventListener('click', () => {
    closeTravelers();
    travelersToggle.focus();
});

document.addEventListener('click', (event) => {
    if (!travelers.contains(event.target) && !travelersDropdown.hidden) {
        closeTravelers();
    }
});

travelersPlus.addEventListener('click', () => {
    travelersNumber++;
    updateTravelers()
});
travelersMinus.addEventListener('click', () => {
    if (travelersNumber <= 1) return;
    travelersNumber--;
    travelersCount.textContent = travelersNumber;
    updateTravelers()
});


function clearMobileStatus() {
    if (mobileStatus) mobileStatus.hidden = true;
}

function clearMobileError(field, errorId) {
    if (!mobileForm || !field) return;
    field.removeAttribute('aria-invalid');
    mobileForm.querySelector(`#${errorId}`).hidden = true;
}

function showMobileError(field, errorId, message) {
    field.setAttribute('aria-invalid', 'true');
    let error = mobileForm.querySelector(`#${errorId}`);
    if (message) error.textContent = message;
    error.hidden = false;
}

function closeMobileCountry() {
    if (!mobileCountry) return;
    mobileCountryDropdown.hidden = true;
    mobileCountry.classList.remove('hero-mobile-form__country--open');
    mobileCountryToggle.setAttribute('aria-expanded', 'false');
}

function closeMobileCalendar() {
    if (!mobileDate) return;
    mobileCalendar.hidden = true;
    mobileDate.classList.remove('hero-mobile-form__date--open');
    mobileDateButton.setAttribute('aria-expanded', 'false');
}

function syncMobileCountries() {
    if (!mobileCountry) return;
    mobileCountryValue.textContent = selectedCountries.join(', ') || 'Select country';
    mobileCountryToggle.title = selectedCountries.join(', ');
    mobileCountryToggle.classList.toggle('hero-mobile-form__field--selected', selectedCountries.length > 0);
    mobileCountryOptions.querySelectorAll('input').forEach((checkbox) => {
        checkbox.checked = selectedCountries.includes(checkbox.value);
    });
    if (selectedCountries.length) clearMobileError(mobileCountryToggle, 'mobile-country-error');
    clearMobileStatus();
}

function filterMobileCountries() {
    let query = mobileCountrySearch.value.trim().toLowerCase();
    let found = 0;
    [...mobileCountryOptions.children].forEach((item) => {
        item.hidden = !item.dataset.name.startsWith(query);
        if (!item.hidden) found++;
    });
    mobileCountryEmpty.hidden = found > 0;
    mobileCountryOptions.scrollTop = 0;
}

function openMobileCountry() {
    closeCountryMenu();
    closeCalendar();
    closeTravelers();
    closeMobileCalendar();
    mobileCountrySearch.value = '';
    filterMobileCountries();
    mobileCountryDropdown.hidden = false;
    mobileCountry.classList.add('hero-mobile-form__country--open');
    mobileCountryToggle.setAttribute('aria-expanded', 'true');
    mobileCountrySearch.focus({ preventScroll: true });
    mobileCountryDropdown.scrollIntoView({ block: 'nearest' });
}

function renderMobileCalendar() {
    if (!mobileCalendar) return;
    renderMonth(currentYear, currentMonth, mobileMonth);
    mobileCalendar.querySelector('.calendar__nav--prev').disabled =
        new Date(currentYear, currentMonth, 1) <= new Date(today.getFullYear(), today.getMonth(), 1);
    let complete = startDate !== null && (annualCheckbox.checked || endDate !== null);
    mobileCalendar.querySelector('.calendar__confirm').hidden = !complete;
    mobileDateValue.textContent = startDate === null
        ? (annualCheckbox.checked ? 'Choose your annual policy start date' : 'Select date')
        : annualCheckbox.checked ? `Annual policy start date: ${formatDate(startDate)}`
            : `${formatDate(startDate)} - ${endDate === null ? '00.00.0000' : formatDate(endDate)}`;
    mobileDateButton.classList.toggle('hero-mobile-form__field--selected', startDate !== null);
    mobileDateButton.title = mobileDateValue.textContent;
    if (annualCheckbox.checked && startDate !== null) {
        let caption = document.createElement('span');
        caption.className = 'form-date__annual-caption';
        caption.textContent = 'Annual policy start date: ';
        let value = document.createElement('span');
        value.className = 'form-date__annual-date';
        value.textContent = formatDate(startDate);
        mobileDateValue.replaceChildren(caption, value);
    }
    if (complete) clearMobileError(mobileDateButton, 'mobile-date-error');
    clearMobileStatus();
}

function openMobileCalendar() {
    closeCountryMenu();
    closeCalendar();
    closeTravelers();
    closeMobileCountry();
    renderCalendar();
    mobileCalendar.hidden = false;
    mobileDate.classList.add('hero-mobile-form__date--open');
    mobileDateButton.setAttribute('aria-expanded', 'true');
    mobileCalendar.scrollIntoView({ block: 'nearest' });
}

function setTripType(annual) {
    annualCheckbox.checked = annual;
    datesConfirmed = false;
    endDate = null;
    dateError.hidden = true;
    dateField.classList.remove('form-date--error');
    clearMobileError(mobileDateButton, 'mobile-date-error');
    mobileTripTabs.forEach((tab) => {
        let active = (tab.dataset.trip === 'annual') === annual;
        tab.classList.toggle('hero-mobile-form__tab--active', active);
        tab.setAttribute('aria-pressed', String(active));
    });
    closeCalendar();
    closeMobileCalendar();
    renderCalendar();
}

function validateMobileAge() {
    let entries = mobileAge.value.trim().split(',').map((age) => age.trim());
    let valid = entries.length === travelersNumber && entries.every((age) => /^\d+$/.test(age));
    if (valid) clearMobileError(mobileAge, 'mobile-age-error');
    else showMobileError(mobileAge, 'mobile-age-error',
        travelersNumber === 1 ? 'Please enter the age of the traveler' : 'Please enter one age per traveler, separated by commas');
    return valid;
}

if (mobileForm) {
    let countryFlags = new Map();
    document.querySelectorAll('.route-menu__country-btn, .menu-countries__link').forEach((link) => {
        let name = link.querySelector('span')?.textContent.trim();
        let image = link.querySelector('img');
        if (name && image) countryFlags.set(name, image.getAttribute('src'));
    });
    allCountries.forEach((name) => {
        let item = document.createElement('li');
        item.dataset.name = name.toLowerCase();
        let label = document.createElement('label');
        label.className = 'hero-mobile-form__country-option';
        let checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = name;
        let caption = document.createElement('span');
        caption.textContent = name;
        label.append(checkbox);
        if (countryFlags.has(name)) {
            let flag = document.createElement('img');
            flag.src = countryFlags.get(name);
            flag.alt = '';
            label.append(flag);
        }
        label.append(caption);
        item.append(label);
        mobileCountryOptions.append(item);
    });
    syncMobileCountries();
    updateTravelers();

    mobileCountryToggle.addEventListener('click', () => {
        if (mobileCountryDropdown.hidden) openMobileCountry();
        else closeMobileCountry();
    });
    mobileCountrySearch.addEventListener('input', filterMobileCountries);
    mobileCountryOptions.addEventListener('change', (event) => {
        let checkbox = event.target;
        if (!checkbox.matches('input[type="checkbox"]')) return;
        if (checkbox.checked && !selectedCountries.includes(checkbox.value)) selectedCountries.push(checkbox.value);
        if (!checkbox.checked) selectedCountries = selectedCountries.filter((name) => name !== checkbox.value);
        updateCountrySelection();
        closeCountryMenu();
    });
    mobileCountry.querySelector('.hero-mobile-form__country-done').addEventListener('click', () => {
        closeMobileCountry();
        mobileCountryToggle.focus();
    });
    mobileForm.querySelectorAll('.hero-mobile-form__countries button').forEach((button) => {
        button.addEventListener('click', () => {
            let name = button.textContent.trim();
            if (!selectedCountries.includes(name)) selectedCountries.push(name);
            updateCountrySelection();
            closeCountryMenu();
            closeMobileCountry();
        });
    });
    mobileTripTabs.forEach((tab) => tab.addEventListener('click', () => {
        let annual = tab.dataset.trip === 'annual';
        if (annual !== annualCheckbox.checked) setTripType(annual);
    }));
    mobileDateButton.addEventListener('click', () => {
        if (mobileCalendar.hidden) openMobileCalendar();
        else closeMobileCalendar();
    });
    mobileCalendar.querySelector('.calendar__nav--next').addEventListener('click', () => {
        currentMonth++;
        renderCalendar();
    });
    mobileCalendar.querySelector('.calendar__nav--prev').addEventListener('click', () => {
        currentMonth--;
        renderCalendar();
    });
    mobileCalendar.querySelector('.calendar__confirm').addEventListener('click', () => {
        datesConfirmed = true;
        closeMobileCalendar();
        mobileDateButton.focus();
    });
    mobileForm.querySelector('.hero-mobile-form__counter-btn--plus').addEventListener('click', () => {
        travelersNumber++;
        updateTravelers();
    });
    mobileMinus.addEventListener('click', () => {
        if (travelersNumber <= 1) return;
        travelersNumber--;
        updateTravelers();
    });
    passengerValue.addEventListener('input', () => {
        let value = Number(passengerValue.value);
        if (Number.isSafeInteger(value) && value >= 1) {
            travelersNumber = value;
            updateTravelers();
        }
        clearMobileStatus();
    });
    passengerValue.addEventListener('change', () => {
        let value = Number(passengerValue.value);
        if (!Number.isSafeInteger(value) || value < 1) {
            passengerValue.value = travelersNumber;
            showMobileError(passengerValue, 'mobile-travelers-error');
        }
    });
    mobileAge.addEventListener('input', () => {
        clearMobileStatus();
        if (mobileFormSubmitted) validateMobileAge();
    });
    mobileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        mobileFormSubmitted = true;
        let invalid = [];
        if (!selectedCountries.length) {
            showMobileError(mobileCountryToggle, 'mobile-country-error');
            invalid.push(mobileCountryToggle);
        }
        if (startDate === null || (!annualCheckbox.checked && endDate === null)) {
            showMobileError(mobileDateButton, 'mobile-date-error', startDate !== null
                ? 'Please select the end date of your trip' : 'Please select your trip dates');
            invalid.push(mobileDateButton);
        } else if (!datesConfirmed) {
            showMobileError(mobileDateButton, 'mobile-date-error', 'Please confirm your trip dates');
            invalid.push(mobileDateButton);
        }
        let count = Number(passengerValue.value);
        if (!Number.isSafeInteger(count) || count < 1) {
            showMobileError(passengerValue, 'mobile-travelers-error');
            invalid.push(passengerValue);
        }
        if (!validateMobileAge()) invalid.push(mobileAge);
        if (invalid.length) {
            invalid[0].focus();
            return;
        }
        closeMobileCountry();
        closeMobileCalendar();


        let continuation = new CustomEvent('insurance:continue', {
            bubbles: true, cancelable: true, detail: {
                countries: [...selectedCountries], startDate: formatDate(startDate),
                endDate: endDate === null ? null : formatDate(endDate), annual: annualCheckbox.checked,
                travelers: travelersNumber, ages: mobileAge.value.split(',').map(Number)
            }
        });
        if (mobileForm.dispatchEvent(continuation)) {
            mobileStatus.textContent = 'Trip details are ready.';
            mobileStatus.hidden = false;
        }
    });
    document.addEventListener('click', (event) => {
        let path = event.composedPath();
        if (!path.includes(mobileCountry)) closeMobileCountry();
        if (!path.includes(mobileDate) && !mobileCalendar.hidden) {
            if (!annualCheckbox.checked && startDate !== null && endDate === null) {
                showMobileError(mobileDateButton, 'mobile-date-error', 'Please select the end date of your trip');
            } else closeMobileCalendar();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        if (!mobileCountryDropdown.hidden) {
            closeMobileCountry();
            mobileCountryToggle.focus();
        } else if (!mobileCalendar.hidden) {
            closeMobileCalendar();
            mobileDateButton.focus();
        } else if (!calendar.hidden) {
            closeCalendar();
            dateButton.focus();
        } else if (!travelersDropdown.hidden) {
            closeTravelers();
            travelersToggle.focus();
        }
    });
    window.matchMedia('(max-width: 648px)').addEventListener('change', () => {
        closeCountryMenu();
        closeCalendar();
        closeTravelers();
        closeMobileCountry();
        closeMobileCalendar();
    });


    let heroSection = mobileForm.closest('.hero');
    let followingSection = document.querySelector('.why-chose');
    function updateMobileFormClearance() {
        if (!window.matchMedia('(max-width: 648px)').matches) return;
        let overlap = mobileForm.getBoundingClientRect().bottom - heroSection.getBoundingClientRect().bottom;
        followingSection.style.setProperty('--hero-form-clearance', `${Math.ceil(Math.max(0, overlap) + 32)}px`);
    }
    let formResizeObserver = new ResizeObserver(updateMobileFormClearance);
    formResizeObserver.observe(mobileForm);
    formResizeObserver.observe(heroSection.querySelector('.hero__inner'));
    window.addEventListener('resize', updateMobileFormClearance);
    updateMobileFormClearance();
}


document.querySelectorAll('.coverage__table-box').forEach((box, index) => {
    let viewport = box.querySelector('.coverage__table-wrapper');
    let table = box.querySelector('.coverage__table');
    if (!viewport || !table) return;

    let scrollbar = document.createElement('div');
    scrollbar.className = 'coverage__scrollbar';
    scrollbar.hidden = true;
    scrollbar.tabIndex = 0;
    scrollbar.setAttribute('role', 'scrollbar');
    scrollbar.setAttribute('aria-label', 'Scroll coverage table');
    scrollbar.setAttribute('aria-orientation', 'vertical');
    scrollbar.setAttribute('aria-valuemin', '0');
    scrollbar.setAttribute('aria-valuemax', '100');
    if (!viewport.id) viewport.id = `coverage-scroll-viewport-${index + 1}`;
    scrollbar.setAttribute('aria-controls', viewport.id);

    let thumb = document.createElement('span');
    thumb.className = 'coverage__scrollbar-thumb';
    scrollbar.append(thumb);
    box.append(scrollbar);

    let travel = 0;
    let inset = 0;
    let maxScroll = 0;
    let drag = null;
    function updateScrollbar() {
        let active = getComputedStyle(viewport).overflowY === 'auto'
            && viewport.scrollHeight > viewport.clientHeight + 1;
        box.classList.toggle('coverage__table-box--custom-scroll', active);
        scrollbar.hidden = !active;
        if (!active) return;

        let headerHeight = table.tHead?.getBoundingClientRect().height || 0;
        box.style.setProperty('--coverage-scrollbar-top', `${headerHeight}px`);
        let thumbHeight = Math.min(72, scrollbar.clientHeight);
        thumb.style.height = `${thumbHeight}px`;
        inset = Math.min(24, Math.max(0, (scrollbar.clientHeight - thumbHeight) / 2));
        travel = Math.max(0, scrollbar.clientHeight - thumbHeight - inset * 2);
        maxScroll = Math.max(0, viewport.scrollHeight - viewport.clientHeight);
        let progress = maxScroll > 0 ? viewport.scrollTop / maxScroll : 0;
        thumb.style.transform = `translateY(${inset + Math.max(0, Math.min(1, progress)) * travel}px)`;
        scrollbar.setAttribute('aria-valuenow', String(Math.round(progress * 100)));
    }

    viewport.addEventListener('scroll', updateScrollbar, { passive: true });
    let observer = new ResizeObserver(updateScrollbar);
    observer.observe(box);
    observer.observe(table);
    window.addEventListener('resize', updateScrollbar);

    scrollbar.addEventListener('pointerdown', (event) => {
        if (event.button !== 0 || travel === 0) return;
        event.preventDefault();
        scrollbar.focus({ preventScroll: true });
        if (event.target !== thumb) {
            let offset = event.clientY - scrollbar.getBoundingClientRect().top - inset - thumb.clientHeight / 2;
            viewport.scrollTop = Math.max(0, Math.min(1, offset / travel)) * maxScroll;
        }
        drag = { pointerId: event.pointerId, y: event.clientY, scrollTop: viewport.scrollTop };
        scrollbar.setPointerCapture(event.pointerId);
        scrollbar.classList.add('coverage__scrollbar--dragging');
    });
    scrollbar.addEventListener('pointermove', (event) => {
        if (!drag || event.pointerId !== drag.pointerId || travel === 0) return;
        viewport.scrollTop = drag.scrollTop + (event.clientY - drag.y) / travel * maxScroll;
    });
    function endDrag(event) {
        if (!drag || event.pointerId !== drag.pointerId) return;
        drag = null;
        scrollbar.classList.remove('coverage__scrollbar--dragging');
        if (scrollbar.hasPointerCapture(event.pointerId)) scrollbar.releasePointerCapture(event.pointerId);
    }
    scrollbar.addEventListener('pointerup', endDrag);
    scrollbar.addEventListener('pointercancel', endDrag);
    scrollbar.addEventListener('lostpointercapture', endDrag);

    scrollbar.addEventListener('wheel', (event) => {
        let previous = viewport.scrollTop;
        let scale = event.deltaMode === 1 ? 20 : event.deltaMode === 2 ? viewport.clientHeight : 1;
        viewport.scrollTop += event.deltaY * scale;
        if (viewport.scrollTop !== previous) event.preventDefault();
    }, { passive: false });
    scrollbar.addEventListener('keydown', (event) => {
        let pageSize = viewport.clientHeight - (table.tHead?.offsetHeight || 0);
        let actions = {
            ArrowDown: viewport.scrollTop + 40,
            ArrowUp: viewport.scrollTop - 40,
            PageDown: viewport.scrollTop + pageSize,
            PageUp: viewport.scrollTop - pageSize,
            Home: 0,
            End: maxScroll
        };
        if (!(event.key in actions)) return;
        event.preventDefault();
        viewport.scrollTop = actions[event.key];
    });
    updateScrollbar();
});
