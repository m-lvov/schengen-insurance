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
if (document.querySelector('.hero__form')) {
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
    let quoteButton = document.querySelector('.form-field__btn-quote');
    let quoteConsent = document.querySelector('.form-field__quote-checkbox');
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
    let annualCheckbox = dateField.querySelector('.form-field__annual-checkbox');
    let today = new Date();
    today.setHours(0, 0, 0, 0);
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    let months = calendar.querySelectorAll('.calendar__month');
    let startDate = null;
    let endDate = null;
    let datesConfirmed = false;
    quoteConsent.required = true;


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



    quoteButton.addEventListener('click', (event) => {
        event.stopPropagation()
        if (selectedCountries.length === 0) {
            openCountryMenu();
            countrySearch.focus();
            return;
        }
        let datesSelected = startDate !== null && (annualCheckbox.checked || endDate !== null);

        if (!datesSelected || !datesConfirmed) {
            if (calendar.hidden) dateButton.click();
            dateButton.focus();
            return;
        }
        if (!Number.isSafeInteger(travelersNumber) || travelersNumber < 1) {
            if (travelersDropdown.hidden) travelersToggle.click();
            travelersToggle.focus();
            return;
        }
        if (!quoteConsent.reportValidity()) {
            return;
        }
        let tripData = {
            countries: [...selectedCountries],
            startDate: startDate.getTime(),
            endDate: endDate === null ? null : endDate.getTime(),
            annual: annualCheckbox.checked,
            travelers: travelersNumber
        };
        sessionStorage.removeItem('insuranceQuote');
        sessionStorage.setItem('insuranceTrip', JSON.stringify(tripData));

        window.location.href = 'quote.html';
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

let quotePage = document.querySelector('.quote-page');

if (quotePage) {
    let tripData = null;

    try {
        tripData = JSON.parse(sessionStorage.getItem('insuranceTrip'));
    } catch {
        tripData = null
    }


    let savedQuote = null

    try {
        savedQuote = JSON.parse(sessionStorage.getItem('insuranceQuote'));
    } catch {
        savedQuote = null;
    }

    if (tripData) {
        let countryText = tripData.countries.length === 1
            ? tripData.countries[0]
            : 'Several directions';

        document.querySelectorAll(
            '.quote-page__summary-item__country, .addons__country, .quote-coverage__country'
        ).forEach((element) => {
            element.textContent = countryText;
            element.title = tripData.countries.join(', ')
        });
        let tripStart = new Date(tripData.startDate);
        let dateText;
        let countryTooltip = document.querySelector('.addons__country-tooltip');

        countryTooltip.textContent = tripData.countries.join(', ');
        countryTooltip.hidden = tripData.countries.length < 2;
        document.querySelector('.addons__country').removeAttribute('title');

        let topCountryTooltip = document.querySelector('.quote-page__country-tooltip');

        topCountryTooltip.textContent = tripData.countries.join(', ');
        topCountryTooltip.hidden = tripData.countries.length < 2;

        document.querySelector('.quote-page__summary-item__country').removeAttribute('title');

        if (tripData.annual) {
            dateText = `From ${tripStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            })}`;
        } else {
            let tripEnd = new Date(tripData.endDate);

            let startText = tripStart.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });

            let endText = tripEnd.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            dateText = `${startText} - ${endText}`;
        }

        document.querySelectorAll(
            '.quote-page__summary-item__date, .quote-coverage__date'
        ).forEach((element) => {
            element.textContent = dateText;
        });
        let daysText = 'Annual insurance';

        if (!tripData.annual) {
            let days = Math.round(
                (tripData.endDate - tripData.startDate) / 86400000
            ) + 1;

            daysText = `${days} ${days === 1 ? 'day' : 'days'}`;
        }

        document.querySelectorAll(
            '.quote-page__summary-item__days, .addons__days, .quote-coverage__days'
        ).forEach((element) => {
            element.textContent = daysText;
        });

        let travelersText = `${tripData.travelers} ${tripData.travelers === 1 ? 'traveler' : 'travelers'
            }`;

        document.querySelectorAll(
            '.quote-page__summary-item__traveler, .addons__travelers, .quote-coverage__travelers'
        ).forEach((element) => {
            element.textContent = travelersText;
        });
    }
    let basePrice = 21.75;
    let annualPrice = 200;
    let coverageRates = {
        35000: 1,
        100000: 1.6,
        500000: 2,
        1000000: 2.4
    };
    let tripRates = {
        'standard': 1,
        'studying-abroad': 1.2,
        'working-abroad': 1.4,
        'cruise': 1.5
    };
    let selectedCoverage = 35000;
    let coverageButtons = quotePage.querySelectorAll('.quote-page__coverage-btn');
    let coverageValue = document.querySelector('.quote-coverage__cost-value');
    let coverageMinus = document.querySelector('.quote-coverage__cost-button--minus');
    let coveragePlus = document.querySelector('.quote-coverage__cost-button--plus');
    let tripMenu = quotePage.querySelector('.quote-page__trip');
    let tripButton = tripMenu.querySelector('.quote-page__select');
    let tripOptions = tripMenu.querySelector('.quote-page__options');
    let tripRadios = tripMenu.querySelectorAll('.quote-page__radio');
    let tripValue = tripMenu.querySelector('.quote-page__select-value')
    let selectedTrip = tripMenu.querySelector('.quote-page__radio:checked').value;
    let coverageBody = document.querySelector('.quote-coverage__body');

    if (savedQuote) {
        let savedCoverageButton = Array.from(coverageButtons).find((button) => {
            return Number(button.dataset.coverage) === savedQuote.coverage;
        });

        if (savedCoverageButton) {
            selectedCoverage = Number(savedCoverageButton.dataset.coverage);

            coverageButtons.forEach((button) => {
                button.classList.toggle(
                    'quote-page__coverage-btn--active',
                    button === savedCoverageButton
                );
            });
        }

        let savedTripRadio = Array.from(tripRadios).find((radio) => {
            return radio.value === savedQuote.tripType;
        });

        if (savedTripRadio) {
            selectedTrip = savedTripRadio.value;
            savedTripRadio.checked = true;

            tripValue.textContent = savedTripRadio.closest('.quote-page__option')
                .querySelector('.quote-page__name').textContent.trim();
        }
    }

    let standardCoverageRows = Array.from(coverageBody.rows, (row) => {
        return {
            name: row.cells[0].textContent.trim(),
            detail: row.cells[1].textContent.trim()
        };
    });

    let abroadCoverageRows = [
        {
            name: 'Medical assistance',
            detail: 'Student schengen medical travel insurance covers emergency medical assistance, treatment due to injury, acute respiratory and viral infections, outpatient treatment and inpatient treatment.'
        },
        {
            name: 'Medical transport',
            detail: 'Student schengen insurance included medical transport services emergency ambulance call, transportation by medical aviation.'
        },
        {
            name: 'Viral and infections',
            detail: 'Schengen insurance for student coverage of costs for the treatment of COVID-19 and other viral and (or) infectious diseases includes outpatient treatment, inpatient treatment, medical care, and mandatory observation for up to 15 days.'
        },
        {
            name: 'Repatriation',
            detail: 'Expenses are paid for repatriation of the body to the country of birth and (or) burial in place.'
        },
        {
            name: 'Accidents',
            detail: 'Schengen insurance provides compensation in case of accidental injury. The payment depends on the insured sum selected in the policy.'
        },
        {
            name: 'Liability',
            detail: 'Schengen insurance for students includes financial compensation for liability to third parties resulting from harm to life, health, or emotional distress, as well as damage to the property of third parties.'
        },
        {
            name: 'Deductible',
            detail: 'Schengen medical insurance for students has a €0 deductible.'
        },
        {
            name: 'Activation',
            detail: 'Schengen insurance becomes effective (activated) after crossing the border or 48 hours from the moment of purchase.'
        }
    ];

    let cruiseBasicRows = standardCoverageRows.map((item) => {
        return { ...item };
    });

    cruiseBasicRows[0].name = 'Medical assistance';
    cruiseBasicRows[0].detail = "Schengen medical travel insurance for cruise covers emergency medical assistance, treatment due to injury, medication provision, calling a doctor, doctor's consultation (examination), emergency dental care, exacerbation of chronic diseases, acute respiratory and viral infections, outpatient treatment and inpatient treatment.";

    cruiseBasicRows[1].detail = 'Schengen insurance for cruise includes medical transportation services, emergency ambulance call, independent taxi call to the hospital in the event of an insured event, as well as medical air transportation.';

    cruiseBasicRows.find((item) => item.name === 'Deductible').detail =
        'Schengen medical insurance for cruise has a deductible of 0 EUR.';

    let cruiseCoverageRows = [
        {
            name: 'Medical assistance',
            detail: 'Schengen travel insurance for cruise covers emergency medical assistance during your trip, including treatment for injuries, COVID-19, acute respiratory viral infections, doctor consultations, diagnostics, outpatient treatment, medications, medical certificates, and emergency dental care for acute pain.'
        },
        {
            name: 'Inpatient treatment services in a hospital',
            detail: 'Basic Schengen insurance covers both outpatient medical care and inpatient treatment in a hospital if urgent hospitalization is necessary, including diagnostics, emergency surgery, prescribed treatment, medications, and a standard hospital stay.'
        },
        {
            name: 'COVID-19 quarantine / mandatory observation',
            detail: 'If local law requires mandatory observation or quarantine due to COVID-19, Schengen visa insurance covers these expenses for up to 15 days within the limits of the policy.'
        },
        {
            name: 'Evacuation, ambulance, and transportation',
            detail: 'Schengen travel insurance includes emergency ambulance services, taxi transportation to a medical institution when needed, helicopter transportation where available, medical evacuation, and transportation to your home country or country of permanent residence if medically necessary.'
        },
        {
            name: 'Funeral services and repatriation',
            detail: 'The policy covers repatriation of the body to the home country and funeral or burial expenses within the limits specified in the contract.'
        },
        {
            name: 'Accidents',
            detail: 'Schengen insurance provides compensation in case of accidental injury. The payment depends on the insured sum selected in the policy.'
        },
        {
            name: 'Emergency pregnancy complications',
            detail: 'Basic travel insurance for Schengen also covers emergency gynecological care and complications of pregnancy up to 27 weeks, within the limits and conditions of the policy.'
        },
        {
            name: 'Loss of baggage',
            detail: 'If an airline loses your checked baggage during a regular flight and the carrier refuses compensation, Schengen travel insurance can compensate the loss within the policy limits and according to baggage claim rules.'
        },
        {
            name: 'Flight delay',
            detail: 'If your flight is delayed for more than 4 hours, the insurance may cover access to an enhanced comfort waiting area or other compensation provided under the contract.'
        },
        {
            name: 'Loss of documents',
            detail: 'If your documents are lost during the trip, Schengen travel insurance covers the costs of restoration within the policy limits.'
        },
        {
            name: 'Liability to third parties',
            detail: 'The policy includes personal liability coverage for damage caused to third parties, including physical, moral, or material damage, within the limits specified in the contract.'
        },
        {
            name: 'Legal and translation assistance',
            detail: 'Schengen insurance also includes legal and translation services if they are required for receiving medical treatment or arranging return to the home country in an emergency.'
        },
        {
            name: 'Return ticket',
            detail: 'In certain insured events, the policy may also cover the cost of a return ticket or the return of accompanying family members or children, according to the contract terms.'
        },
        {
            name: 'Telephone communication expenses',
            detail: 'If you need to contact the assistance service or insurer regarding an insured event, the policy may reimburse telephone communication expenses related to the claim.'
        },
        {
            name: 'Deductible',
            detail: 'Schengen medical insurance for cruise has a deductible of 0 EUR.'
        }
    ];

    function renderCoverageTable(rows) {
        coverageBody.innerHTML = rows.map((item) => {
            return `
            <tr class="quote-coverage__row">
                <td class="quote-coverage__cell quote-coverage__cell--name">
                    ${item.name}
                </td>
                <td class="quote-coverage__cell">
                    ${item.detail}
                </td>
            </tr>
        `;
        }).join('');
    }

    function updateCoverageTable() {
        let rows = standardCoverageRows;



        if (selectedTrip === 'studying-abroad' || selectedTrip === 'working-abroad') {
            rows = abroadCoverageRows.map((item) => {
                return { ...item };
            });

            rows[0].name = selectedCoverage === 35000
                ? 'Medical assistance'
                : 'Medical coverage';
        }
        if (selectedTrip === 'cruise') {
            rows = selectedCoverage === 35000
                ? cruiseBasicRows
                : cruiseCoverageRows;
        }

        renderCoverageTable(rows)
    }

    function updatePrice() {
        if (!tripData) return;

        let days = tripData.annual
            ? 1
            : Math.round(
                (tripData.endDate - tripData.startDate) / 86400000
            ) + 1;
        let price = tripData.annual
            ? annualPrice
            : basePrice * days;
        let addonsTotal = 0;

        document.querySelectorAll('.addons__button--added').forEach((button) => {
            addonsTotal += Number(button.dataset.price);
        });

        let total = (
            price
            * coverageRates[selectedCoverage]
            * tripRates[selectedTrip]
            + addonsTotal
        ) * tripData.travelers;
        let [whole, fraction] = total.toFixed(2).split('.');

        document.querySelectorAll(
            '.quote-page__price, .addons__total-price, .quote-coverage__price'
        ).forEach((element) => {
            element.firstChild.textContent = `$${whole}`;
            element.querySelector('span').textContent = `,${fraction}`;
        });
    }

    function updateCoverage() {
        coverageValue.textContent = `€ ${selectedCoverage.toLocaleString('en-US')}`;

        coverageMinus.disabled = selectedCoverage === Number(coverageButtons[0].dataset.coverage);
        coveragePlus.disabled = selectedCoverage === Number(coverageButtons[coverageButtons.length - 1].dataset.coverage);
        updateCoverageTable();
        updatePrice();
    }

    updateCoverage();



    coverageButtons.forEach((button) => {
        button.addEventListener('click', () => {
            selectedCoverage = Number(button.dataset.coverage);
            updateCoverage();
            coverageButtons.forEach((item) => {
                item.classList.remove('quote-page__coverage-btn--active');
            });
            button.classList.add('quote-page__coverage-btn--active');
            saveQuoteSelection();
        });
    });

    tripButton.addEventListener('click', () => {
        let isOpen = tripMenu.classList.toggle('quote-page__trip--open')

        tripOptions.hidden = !isOpen;
    });

    tripRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            selectedTrip = radio.value;
            updateCoverageTable();
            updatePrice();
            let option = radio.closest('.quote-page__option');
            tripValue.textContent = option.querySelector('.quote-page__name').textContent.trim();

            closeTripMenu();
            saveQuoteSelection();
        });
    });

    function closeTripMenu() {
        tripMenu.classList.remove('quote-page__trip--open');
        tripOptions.hidden = true;
    }
    document.addEventListener('click', (event) => {
        if (!tripMenu.contains(event.target)) {
            closeTripMenu();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && tripMenu.classList.contains('quote-page__trip--open')) {
            closeTripMenu();
            tripButton.focus()
        }
    });

    function changeCoverage(direction) {
        let currentIndex = Array.from(coverageButtons).findIndex((button) => {
            return Number(button.dataset.coverage) === selectedCoverage;
        });
        let nextButton = coverageButtons[currentIndex + direction];
        if (nextButton) nextButton.click();
    }

    coverageMinus.addEventListener('click', () => {
        changeCoverage(-1);
    });

    coveragePlus.addEventListener('click', () => {
        changeCoverage(1);
    });

    let addonsFullButton = document.querySelector('.addons__button-full');
    let hiddenAddons = document.querySelectorAll('.addons__item[hidden]');
    let addonsList = document.querySelector('.addons__list');
    let addonsButtons = addonsList.querySelectorAll('.addons__button');
    let addonsSelected = document.querySelector('.addons__selected')

    function saveQuoteSelection() {
        let addons = Array.from(
            addonsList.querySelectorAll('.addons__button--added'),
            (button) => {
                return button.closest('.addons__item')
                    .querySelector('.addons__name').textContent.trim()
            }
        );
        sessionStorage.setItem('insuranceQuote', JSON.stringify({
            coverage: selectedCoverage,
            tripType: selectedTrip,
            addons: addons
        }));
    }

    addonsFullButton.addEventListener('click', () => {
        let startHeight = addonsList.getBoundingClientRect().height;
        hiddenAddons.forEach((item) => {
            item.hidden = false;

            item.animate(
                [{ opacity: 0 }, { opacity: 1 }],
                { duration: 350, easing: 'ease-out' }
            );
        });
        let endHeight = addonsList.getBoundingClientRect().height;

        addonsList.style.overflow = 'hidden';
        let animation = addonsList.animate(
            [
                { height: `${startHeight}px` },
                { height: `${endHeight}px` }
            ],
            { duration: 350, easing: 'ease-out' }
        );

        animation.onfinish = () => {
            addonsList.style.removeProperty('overflow')
        };
        addonsFullButton.hidden = true;
    });

    function updateSelectedAddons() {
        let selectedButtons = addonsList.querySelectorAll('.addons__button--added');

        addonsSelected.replaceChildren();

        selectedButtons.forEach((button) => {
            let addon = button.closest('.addons__item');
            let name = addon.querySelector('.addons__name').textContent.trim()
            let item = document.createElement('li');

            item.className = 'addons__selected-item';
            item.textContent = name;

            addonsSelected.append(item);
        });

        addonsSelected.hidden = selectedButtons.length === 0;
        updatePrice();

    }

    addonsButtons.forEach((button) => {
        let text = button.querySelector('.addons__button-text');
        let icon = button.querySelector('.addons__button-icon');

        button.addEventListener('click', () => {
            let isAdded = button.classList.toggle('addons__button--added');

            text.textContent = isAdded ? 'Added' : 'Add';
            icon.textContent = isAdded ? '✓' : '+';

            updateSelectedAddons();
            saveQuoteSelection();
        });
    });
    if (savedQuote && Array.isArray(savedQuote.addons)) {
        addonsButtons.forEach((button) => {
            let item = button.closest('.addons__item');
            let name = item.querySelector('.addons__name').textContent.trim();
            let isAdded = savedQuote.addons.includes(name);

            button.classList.toggle('addons__button--added', isAdded);
            button.querySelector('.addons__button-text').textContent =
                isAdded ? 'Added' : 'Add';
            button.querySelector('.addons__button-icon').textContent =
                isAdded ? '✓' : '+';
        });

        let hasSelectedHiddenAddon = Array.from(hiddenAddons).some((item) => {
            return item.querySelector('.addons__button--added') !== null;
        });

        if (hasSelectedHiddenAddon) {
            hiddenAddons.forEach((item) => {
                item.hidden = false;
            });

            addonsFullButton.hidden = true;
        }
    }

    updateSelectedAddons();

    let backButton = quotePage.querySelector('.quote-page__back');
    let fullCoverageButton = quotePage.querySelector('.quote-page__full-coverage');
    let coverageSection = document.querySelector('.quote-coverage');

    backButton.addEventListener('click', () => {
        window.location.href = 'index.html#hero';
    });

    fullCoverageButton.addEventListener('click', () => {
        coverageSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    });


    let orderSummary = document.querySelector('.order-summary');
    let addonsSummarySlot = document.querySelector('.order-summary-slot--addons');
    let coverageSummarySlot = document.querySelector('.order-summary-slot--coverage');
    let summaryMoving = false;
    let nextSummarySlot;

    function updateSummaryHeight() {
        let height = `${orderSummary.offsetHeight}px`;
        addonsSummarySlot.style.minHeight = height;
        coverageSummarySlot.style.minHeight = height;
    }

    let summaryObserver = new ResizeObserver(updateSummaryHeight);

    summaryObserver.observe(orderSummary);
    updateSummaryHeight()

    function updateSummaryLocation(animate = true) {
        let coverageTop = coverageSection.getBoundingClientRect().top;

        nextSummarySlot = coverageTop <= window.innerHeight / 2
            ? coverageSummarySlot
            : addonsSummarySlot;

        if (summaryMoving || orderSummary.parentElement === nextSummarySlot) return;

        if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            nextSummarySlot.append(orderSummary);
            return;
        }

        summaryMoving = true;
        orderSummary.classList.add('order-summary--switching');

        setTimeout(() => {
            nextSummarySlot.append(orderSummary);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    orderSummary.classList.remove('order-summary--switching')

                    setTimeout(() => {
                        summaryMoving = false;
                        updateSummaryLocation();
                    }, 200)
                });
            });
        }, 150);
    }

    window.addEventListener('scroll', () => updateSummaryLocation(), { passive: true });
    window.addEventListener('resize', () => updateSummaryLocation());


    updateSummaryLocation(false);
}

