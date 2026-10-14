function validateRequiredCheckbox(checkbox) {
    let error = document.getElementById(checkbox.dataset.error);
    let valid = checkbox.checked;

    if (valid) {
        checkbox.removeAttribute('aria-invalid');
        checkbox.removeAttribute('aria-describedby');
    } else {
        checkbox.setAttribute('aria-invalid', 'true');
        checkbox.setAttribute('aria-describedby', error.id);
    }

    error.hidden = valid;
    return valid;
}

document.addEventListener('invalid', (event) => {
    if (!event.target.matches('input[type="checkbox"][required][data-error]')) return;

    event.preventDefault();
    validateRequiredCheckbox(event.target);
}, true);

document.addEventListener('change', (event) => {
    let checkbox = event.target;

    if (
        checkbox.matches('input[type="checkbox"][required][data-error]') &&
        (checkbox.checked || checkbox.hasAttribute('aria-invalid'))
    ) {
        validateRequiredCheckbox(checkbox);
    }
});

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
let mobileForm = document.querySelector('.hero .hero-mobile-form');
let mobileTripTabs = mobileForm?.querySelectorAll('.hero-mobile-form__tab') || [];
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
        trigger.setAttribute('aria-expanded', 'false');
    }

    function openContactSelect() {
        list.hidden = false;
        select.classList.add('contact__select--open');
        trigger.setAttribute('aria-expanded', 'true');
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
            input.dispatchEvent(new Event('change', { bubbles: true }));
            trigger.focus();
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
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-label', 'Select type of question');
    select.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault(); openContactSelect();
        let index = Array.from(options).indexOf(document.activeElement);
        if (event.key === 'Home' || index < 0 && event.key === 'ArrowDown') index = 0;
        else if (event.key === 'End' || index < 0 && event.key === 'ArrowUp') index = options.length - 1;
        else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
        options[index]?.focus();
    });
    select.addEventListener('focusout', event => { if (!select.contains(event.relatedTarget)) closeContactSelect(); });
});

document.querySelectorAll('.contact__form').forEach((form, formIndex) => {
    form.noValidate = true;
    let controls = [form.querySelector('.contact__select-trigger'), ...form.querySelectorAll('.contact__input')];
    let errors = controls.map((control, index) => {
        let error = document.createElement('p'); error.className = 'contact__error'; error.id = `contact-${formIndex}-${index}-error`;
        error.hidden = true; error.setAttribute('role', 'alert');
        (control.closest('.contact__select') || control).after(error);
        if (control.matches('input')) control.setAttribute('aria-label', control.placeholder);
        return error;
    });
    let status = document.createElement('p'); status.className = 'contact__status'; status.hidden = true; status.setAttribute('role', 'status'); form.append(status);
    function validateContact(showErrors) {
        let values = [form.querySelector('.contact__select-input').value, ...controls.slice(1).map(input => input.value.trim())];
        let valid = [!!values[0], /[a-z]/i.test(values[1]) && /^[a-z\s'-]+$/i.test(values[1]), /^\+?[\d\s()-]+$/.test(values[2]) && values[2].replace(/\D/g, '').length >= 7 && values[2].replace(/\D/g, '').length <= 15, /^[\x21-\x7E]+@[^\s@]+\.[^\s@]+$/.test(values[3]) && controls[3].validity.valid];
        let messages = ['Please select a type of question', 'Please enter your name in Latin letters', 'Please enter a valid phone number', 'Please enter a valid email'];
        controls.forEach((control, index) => {
            if (!showErrors && control.getAttribute('aria-invalid') !== 'true') return;
            errors[index].textContent = messages[index]; errors[index].hidden = valid[index];
            control.setAttribute('aria-invalid', String(!valid[index]));
            if (valid[index]) control.removeAttribute('aria-describedby'); else control.setAttribute('aria-describedby', errors[index].id);
        });
        return controls[valid.indexOf(false)];
    }
    form.addEventListener('submit', event => {
        event.preventDefault(); status.hidden = true;
        let invalid = validateContact(true);
        if (invalid) { invalid.focus(); return; }
        status.textContent = 'Demo form validated. No message was sent: a backend is not connected.'; status.hidden = false;
    });
    ['input', 'change'].forEach(type => form.addEventListener(type, () => { status.hidden = true; validateContact(false); }));
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



    function openQuote(applicantAge) {
        let tripData = {
            countries: [...selectedCountries],
            startDate: startDate.getTime(),
            endDate: endDate === null ? null : endDate.getTime(),
            annual: annualCheckbox.checked,
            travelers: travelersNumber,
            source: 'hero',
            discountRate: 0
        };
        if (applicantAge !== undefined) tripData.applicantAge = applicantAge;

        sessionStorage.removeItem('insuranceQuote');
        sessionStorage.setItem('insuranceTrip', JSON.stringify(tripData));
        window.location.href = 'quote.html';
    }

    quoteButton.addEventListener('click', (event) => {
        event.stopPropagation()
        let consentValid = validateRequiredCheckbox(quoteConsent);

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
        if (!consentValid) {
            quoteConsent.focus();
            return;
        }
        openQuote();
    });
    document.querySelector('.hero__form').addEventListener('submit', event => {
        event.preventDefault();
        quoteButton.click();
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
            clearMobileError(passengerValue, 'mobile-travelers-error');
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
        let age = mobileAge.value.trim();
        let valid = /^\d+$/.test(age) && Number.isSafeInteger(Number(age)) && Number(age) >= 16 && Number(age) <= 90;
        if (valid) clearMobileError(mobileAge, 'mobile-age-error');
        else showMobileError(mobileAge, 'mobile-age-error', 'Please enter your age between 16 and 90');
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


            openQuote(Number(mobileAge.value.trim()));
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

// The same country source is used by header menus, visa checker and popup.
window.sharedMenusReady.then(() => {
    let countries = new Map();
    document.querySelectorAll('.route-menu__country-btn, .menu-countries__link').forEach(link => {
        let name = link.querySelector('span')?.textContent.trim();
        if (name) countries.set(name, link.querySelector('img')?.getAttribute('src'));
    });
    let countryNames = Array.from(countries.keys()).sort((a, b) => a.localeCompare(b, 'en'));
    let activeDialog = null;
    let previousFocus;
    let inertElements = [];

    function closeDialog() {
        if (!activeDialog) return;
        activeDialog.hidden = true;
        inertElements.forEach(([element, wasInert]) => element.inert = wasInert);
        inertElements = [];
        activeDialog = null;
        let focus = previousFocus?.isConnected && previousFocus.getClientRects().length
            ? previousFocus : document.querySelector('.header__burger');
        focus?.focus({ preventScroll: true });
    }

    function openDialog(root, focus) {
        closeDialog();
        previousFocus = document.activeElement;
        root.hidden = false;
        activeDialog = root;
        Array.from(document.body.children).forEach(element => {
            if (element === root || ['SCRIPT', 'STYLE'].includes(element.tagName)) return;
            inertElements.push([element, element.inert]);
            element.inert = true;
        });
        focus.focus({ preventScroll: true });
    }

    document.addEventListener('keydown', event => {
        if (!activeDialog || event.defaultPrevented) return;
        if (event.key === 'Escape') { event.preventDefault(); closeDialog(); }
        if (event.key !== 'Tab') return;
        let focusable = Array.from(activeDialog.querySelectorAll('button, input, a[href], [tabindex="0"]'))
            .filter(element => !element.disabled && element.getClientRects().length && !element.closest('[inert]'));
        let first = focusable[0], last = focusable.at(-1);
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    });

    let languageMenu = document.querySelector('.language-menu');
    if (languageMenu) {
        let search = languageMenu.querySelector('.language-menu__input');
        let list = languageMenu.querySelector('.language-menu__list');
        let options = Array.from(list.querySelectorAll('.language-menu__option'));
        let regions = languageMenu.querySelectorAll('.language-menu__region');
        let region = '';
        let languages = {
            en: { label: 'Eng', country: 'United States', regions: ['america', 'europe', 'africa', 'asia', 'oceania'] },
            de: { label: 'Deu', country: 'Germany', regions: ['europe'] },
            fr: { label: 'Fra', country: 'France', regions: ['america', 'europe', 'africa', 'oceania'] }
        };
        let selected = 'en';
        try { if (languages[localStorage.getItem('siteLanguage')]) selected = localStorage.getItem('siteLanguage'); } catch { /* Storage is optional. */ }
        let empty = document.createElement('p');
        empty.className = 'language-menu__empty';
        empty.textContent = 'No languages found';
        empty.hidden = true;
        empty.setAttribute('role', 'status');
        list.after(empty);
        let close = document.createElement('button');
        close.type = 'button';
        close.className = 'language-menu__close';
        close.setAttribute('aria-label', 'Close language menu');
        close.textContent = '×';
        languageMenu.querySelector('.language-menu__panel').prepend(close);
        languageMenu.querySelector('.language-menu__description').textContent = 'Choose a language. This demo does not translate the page.';
        function syncLanguage() {
            document.querySelectorAll('.header__language').forEach(button => {
                button.querySelector('.header__language-value').textContent = languages[selected].label;
                let flag = button.querySelector('.header__language-flag');
                if (countries.get(languages[selected].country)) flag.src = countries.get(languages[selected].country);
                button.setAttribute('aria-label', `Select language: ${selected}`);
                button.setAttribute('aria-haspopup', 'dialog');
            });
            options.forEach(option => {
                let active = option.dataset.language === selected;
                option.classList.toggle('language-menu__option--selected', active);
                option.setAttribute('aria-pressed', String(active));
            });
        }
        function filterLanguages() {
            let query = search.value.trim().toLowerCase();
            list.hidden = !query && !region;
            let found = 0;
            options.forEach(option => {
                let match = option.textContent.toLowerCase().includes(query) && (!region || languages[option.dataset.language].regions.includes(region));
                option.closest('li').hidden = !match;
                if (match) found++;
            });
            empty.hidden = list.hidden || found > 0;
            regions.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.region === region)));
        }
        document.addEventListener('click', event => {
            if (!event.target.closest('.header__language')) return;
            search.value = ''; region = ''; filterLanguages();
            openDialog(languageMenu, search);
        });
        search.addEventListener('input', filterLanguages);
        regions.forEach(button => button.addEventListener('click', () => {
            region = region === button.dataset.region ? '' : button.dataset.region;
            filterLanguages();
        }));
        options.forEach(option => option.addEventListener('click', () => {
            selected = option.dataset.language;
            try { localStorage.setItem('siteLanguage', selected); } catch { /* Selection still works without storage. */ }
            syncLanguage(); closeDialog();
        }));
        languageMenu.querySelector('.language-menu__submit').addEventListener('click', closeDialog);
        close.addEventListener('click', closeDialog);
        languageMenu.addEventListener('click', event => { if (event.target === languageMenu) closeDialog(); });
        syncLanguage();
    }

    let popup = document.querySelector('.insurance-popup');
    let popupForm = popup?.querySelector('form');
    let openInsurancePopup;
    if (popupForm) {
        let selected = new Set();
        let annual = false, start = null, end = null, confirmed = false;
        let today = new Date(); today.setHours(0, 0, 0, 0);
        let month = new Date(today.getFullYear(), today.getMonth(), 1);
        let country = popupForm.querySelector('.hero-mobile-form__country');
        let countryButton = country.querySelector('.hero-mobile-form__field--select');
        let countryDropdown = country.querySelector('.hero-mobile-form__country-dropdown');
        let countrySearch = country.querySelector('.hero-mobile-form__country-search');
        let countryList = country.querySelector('.hero-mobile-form__country-options');
        let date = popupForm.querySelector('.hero-mobile-form__date');
        let dateButton = date.querySelector('.hero-mobile-form__field--date');
        let calendar = date.querySelector('.calendar');
        let travelers = popupForm.querySelector('.hero-mobile-form__passenger-value');
        let age = popupForm.querySelector('.hero-mobile-form__age');
        let minus = popupForm.querySelector('.hero-mobile-form__counter-btn--minus');
        let formStatus = popupForm.querySelector('.hero-mobile-form__status');
        const formatDate = value => value.toLocaleDateString('en-GB').replaceAll('/', '.');
        function setError(control, key, valid, message) {
            let error = popupForm.querySelector(`#popup-${key}-error`);
            error.hidden = valid;
            if (message) error.textContent = message;
            control.setAttribute('aria-invalid', String(!valid));
            return valid;
        }
        function closeCountry() {
            countryDropdown.hidden = true;
            country.classList.remove('hero-mobile-form__country--open');
            countryButton.setAttribute('aria-expanded', 'false');
        }
        function closeCalendar() {
            calendar.hidden = true;
            date.classList.remove('hero-mobile-form__date--open');
            dateButton.setAttribute('aria-expanded', 'false');
        }
        function syncCountries() {
            let value = country.querySelector('.hero-mobile-form__country-value');
            value.textContent = selected.size ? Array.from(selected).join(', ') : 'Select country';
            countryButton.title = value.textContent;
            countryButton.classList.toggle('hero-mobile-form__field--selected', selected.size > 0);
            countryList.querySelectorAll('input').forEach(input => input.checked = selected.has(input.value));
            if (selected.size) setError(countryButton, 'country', true);
        }
        countryNames.forEach(name => {
            let item = document.createElement('li');
            let label = document.createElement('label'); label.className = 'hero-mobile-form__country-option';
            let input = document.createElement('input'); input.type = 'checkbox'; input.value = name;
            label.append(input);
            if (countries.get(name)) {
                let flag = document.createElement('img'); flag.src = countries.get(name); flag.alt = ''; label.append(flag);
            }
            let text = document.createElement('span'); text.textContent = name; label.append(text);
            item.dataset.name = name.toLowerCase(); item.append(label); countryList.append(item);
        });
        countryButton.addEventListener('click', () => {
            if (!countryDropdown.hidden) { closeCountry(); return; }
            closeCalendar(); countryDropdown.hidden = false;
            country.classList.add('hero-mobile-form__country--open');
            countryButton.setAttribute('aria-expanded', 'true'); countrySearch.focus();
        });
        countrySearch.addEventListener('input', () => {
            let found = 0;
            Array.from(countryList.children).forEach(item => {
                item.hidden = !item.dataset.name.includes(countrySearch.value.trim().toLowerCase());
                if (!item.hidden) found++;
            });
            country.querySelector('.hero-mobile-form__country-empty').hidden = found > 0;
        });
        countryList.addEventListener('change', event => {
            let input = event.target;
            if (input.checked) selected.add(input.value); else selected.delete(input.value);
            syncCountries();
        });
        country.querySelector('.hero-mobile-form__country-done').addEventListener('click', () => { closeCountry(); countryButton.focus(); });
        country.querySelectorAll('.hero-mobile-form__countries button').forEach(button => button.addEventListener('click', () => {
            let name = button.textContent.trim();
            if (selected.has(name)) selected.delete(name); else selected.add(name);
            syncCountries();
        }));
        function renderCalendar() {
            calendar.querySelector('.calendar__title').textContent = month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            let days = calendar.querySelector('.calendar__days'); days.replaceChildren();
            let offset = (month.getDay() + 6) % 7;
            for (let index = 0; index < offset; index++) {
                let blank = document.createElement('span'); blank.className = 'calendar__day calendar__day--empty'; days.append(blank);
            }
            let count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
            for (let day = 1; day <= count; day++) {
                let value = new Date(month.getFullYear(), month.getMonth(), day);
                let button = document.createElement('button'); button.type = 'button'; button.className = 'calendar__day';
                button.textContent = day; button.dataset.date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                button.setAttribute('aria-label', value.toLocaleDateString('en-US', { dateStyle: 'full' }));
                button.disabled = value < today;
                if (start && +value === +start) button.classList.add('calendar__day--start');
                if (end && +value === +end) button.classList.add('calendar__day--end');
                if (start && end && value > start && value < end) button.classList.add('calendar__day--in-range');
                button.addEventListener('click', () => {
                    if (annual || !start || end || value < start) { start = value; end = null; }
                    else end = value;
                    confirmed = false; renderCalendar();
                    calendar.querySelector(`[data-date="${button.dataset.date}"]`)?.focus({ preventScroll: true });
                });
                days.append(button);
            }
            calendar.querySelector('.calendar__nav--prev').disabled = month <= new Date(today.getFullYear(), today.getMonth(), 1);
            calendar.querySelector('.calendar__confirm').hidden = !start || !annual && !end;
            date.querySelector('.hero-mobile-form__date-value').textContent = !start ? 'Select date'
                : annual ? `From ${formatDate(start)}` : `${formatDate(start)} - ${end ? formatDate(end) : '…'}`;
        }
        popupForm.querySelectorAll('.hero-mobile-form__tab').forEach(button => button.addEventListener('click', () => {
            annual = button.dataset.trip === 'annual'; start = end = null; confirmed = false;
            popupForm.querySelectorAll('.hero-mobile-form__tab').forEach(tab => {
                tab.classList.toggle('hero-mobile-form__tab--active', tab === button); tab.setAttribute('aria-pressed', String(tab === button));
            });
            renderCalendar();
        }));
        dateButton.addEventListener('click', () => {
            if (!calendar.hidden) { closeCalendar(); return; }
            closeCountry(); renderCalendar(); calendar.hidden = false;
            date.classList.add('hero-mobile-form__date--open'); dateButton.setAttribute('aria-expanded', 'true');
        });
        calendar.querySelectorAll('.calendar__nav').forEach(button => button.addEventListener('click', () => {
            month.setMonth(month.getMonth() + (button.classList.contains('calendar__nav--next') ? 1 : -1)); renderCalendar();
        }));
        calendar.querySelector('.calendar__confirm').addEventListener('click', () => {
            confirmed = true; closeCalendar(); setError(dateButton, 'date', true); dateButton.focus();
        });
        function syncTravelers() { minus.disabled = Number(travelers.value) <= 1; }
        popupForm.querySelectorAll('.hero-mobile-form__counter-btn').forEach(button => button.addEventListener('click', () => {
            let count = Number(travelers.value);
            travelers.value = Math.max(1, (Number.isSafeInteger(count) ? count : 1) + (button === minus ? -1 : 1));
            syncTravelers(); setError(travelers, 'travelers', true);
        }));
        travelers.addEventListener('input', syncTravelers);
        age.addEventListener('input', () => { age.value = age.value.replace(/\D/g, '').slice(0, 2); });
        popupForm.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            if (!countryDropdown.hidden) { closeCountry(); countryButton.focus(); }
            else if (!calendar.hidden) { closeCalendar(); dateButton.focus(); }
            else return;
            event.preventDefault(); event.stopPropagation();
        });
        document.addEventListener('click', event => {
            // Rendering a month replaces the clicked day; its original event path
            // still tells us that the click happened inside the calendar.
            if (!event.composedPath().includes(country)) closeCountry();
            if (!event.composedPath().includes(date)) closeCalendar();
        });
        popupForm.addEventListener('submit', event => {
            event.preventDefault();
            let checks = [
                [countryButton, 'country', selected.size > 0],
                [dateButton, 'date', confirmed && !!start && (annual || !!end)],
                [travelers, 'travelers', Number.isSafeInteger(Number(travelers.value)) && Number(travelers.value) >= 1],
                [age, 'age', /^\d+$/.test(age.value) && Number(age.value) >= 16 && Number(age.value) <= 90, 'Please enter your age between 16 and 90']
            ];
            checks.forEach(check => setError(...check));
            let invalid = checks.find(check => !check[2]);
            if (invalid) { invalid[0].focus(); return; }
            sessionStorage.removeItem('insuranceQuote');
            sessionStorage.setItem('insuranceTrip', JSON.stringify({
                countries: Array.from(selected), startDate: start.getTime(), endDate: annual ? null : end.getTime(),
                annual, travelers: Number(travelers.value), applicantAge: Number(age.value), source: 'visa-check', discountRate: 0.1
            }));
            window.location.href = 'quote.html';
        });
        popup.querySelector('.insurance-popup__close').addEventListener('click', () => { closeCountry(); closeCalendar(); closeDialog(); });
        popup.querySelector('.insurance-popup__overlay').addEventListener('click', closeDialog);
        openInsurancePopup = destination => {
            if (!selected.size && destination) { selected.add(destination); syncCountries(); }
            closeCountry(); closeCalendar(); formStatus.hidden = true;
            openDialog(popup, countryButton);
        };
        renderCalendar();
    }

    let visaCheck = document.querySelector('.visa-check');
    if (visaCheck) {
        let schengen = new Set('Austria|Belgium|Bulgaria|Croatia|Czech Republic|Denmark|Estonia|Finland|France|Germany|Greece|Hungary|Iceland|Italy|Latvia|Liechtenstein|Lithuania|Luxembourg|Malta|Netherlands|Norway|Poland|Portugal|Romania|Slovakia|Slovenia|Spain|Sweden|Switzerland'.split('|'));
        let visaFree = new Set('Albania|Andorra|Antigua and Barbuda|Argentina|Australia|Bahamas|Barbados|Bosnia and Herzegovina|Brazil|Brunei|Canada|Chile|Colombia|Costa Rica|Dominica|El Salvador|Georgia|Grenada|Guatemala|Honduras|Israel|Japan|Kiribati|Malaysia|Marshall Islands|Mauritius|Mexico|Micronesia|Moldova|Monaco|Montenegro|Nauru|New Zealand|Nicaragua|North Macedonia|Palau|Panama|Paraguay|Peru|Saint Kitts and Nevis|Saint Lucia|Saint Vincent and the Grenadines|Samoa|San Marino|Serbia|Seychelles|Singapore|Solomon Islands|South Korea|Timor-Leste|Tonga|Trinidad and Tobago|Tuvalu|Ukraine|United Arab Emirates|United Kingdom|United States|Uruguay|Vatican City|Venezuela|Kosovo'.split('|'));
        let selects = Array.from(visaCheck.querySelectorAll('.visa-select'));
        let start = visaCheck.querySelector('.visa-check__start');
        let result = visaCheck.querySelector('.visa-check__result');
        let resultTitle = result.querySelector('.visa-check__result-title'); resultTitle.tabIndex = -1;
        let resultText = result.querySelector('.visa-check__result-text');
        function closeSelect(root, focus = false) {
            root.querySelector('.visa-select__dropdown').hidden = true;
            let button = root.querySelector('.visa-select__trigger'); button.setAttribute('aria-expanded', 'false');
            if (focus) button.focus();
        }
        selects.forEach(root => {
            let button = root.querySelector('.visa-select__trigger');
            let dropdown = root.querySelector('.visa-select__dropdown');
            let search = root.querySelector('.visa-select__search');
            let list = root.querySelector('.visa-select__list');
            let input = root.querySelector('.visa-select__input');
            let error = root.querySelector('.visa-select__error');
            let names = root.dataset.field === 'destination' ? countryNames.filter(name => schengen.has(name)) : countryNames;
            names.forEach(name => {
                let item = document.createElement('li'); item.className = 'visa-select__item'; item.dataset.name = name.toLowerCase();
                let option = document.createElement('button'); option.type = 'button'; option.className = 'visa-select__option'; option.dataset.country = name; option.setAttribute('aria-pressed', 'false');
                if (countries.get(name)) { let flag = document.createElement('img'); flag.className = 'visa-select__flag'; flag.src = countries.get(name); flag.alt = ''; option.append(flag); }
                let text = document.createElement('span'); text.className = 'visa-select__name'; text.textContent = name; option.append(text);
                item.append(option); list.append(item);
                option.addEventListener('click', () => {
                    input.value = name; root.querySelector('.visa-select__value').textContent = name;
                    button.setAttribute('aria-invalid', 'false'); error.hidden = true;
                    list.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === option)));
                    closeSelect(root, true);
                });
            });
            button.addEventListener('click', () => {
                let open = dropdown.hidden; selects.forEach(select => closeSelect(select));
                dropdown.hidden = !open; button.setAttribute('aria-expanded', String(open));
                if (open) search.focus();
            });
            search.addEventListener('input', () => {
                let found = 0;
                Array.from(list.children).forEach(item => { item.hidden = !item.dataset.name.includes(search.value.trim().toLowerCase()); if (!item.hidden) found++; });
                root.querySelector('.visa-select__empty').hidden = found > 0;
            });
            root.addEventListener('keydown', event => {
                if (event.key === 'Escape' && !dropdown.hidden) { event.preventDefault(); closeSelect(root, true); }
                if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                event.preventDefault(); dropdown.hidden = false; button.setAttribute('aria-expanded', 'true');
                let options = Array.from(list.querySelectorAll('li:not([hidden]) button'));
                let index = options.indexOf(document.activeElement);
                if (event.key === 'Home' || index < 0 && event.key === 'ArrowDown') index = 0;
                else if (event.key === 'End' || index < 0 && event.key === 'ArrowUp') index = options.length - 1;
                else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
                options[index]?.focus();
            });
            root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) closeSelect(root); });
            document.addEventListener('click', event => { if (!root.contains(event.target)) closeSelect(root); });
        });
        function checkVisa(event) {
            event.preventDefault();
            let invalid = selects.filter(root => {
                let valid = !!root.querySelector('.visa-select__input').value;
                root.querySelector('.visa-select__error').hidden = valid;
                root.querySelector('.visa-select__trigger').setAttribute('aria-invalid', String(!valid));
                return !valid;
            });
            if (invalid.length) { invalid[0].querySelector('.visa-select__trigger').focus(); return; }
            let countryAliases = {
                'Great Britain': 'United Kingdom', 'USA': 'United States', 'United States of America': 'United States',
                'East Timor': 'Timor-Leste', 'Macedonia': 'North Macedonia', 'Ivory Coast': 'Côte d’Ivoire',
                "Côte d'Ivoire": 'Côte d’Ivoire', 'Türkiye': 'Turkey', 'Sao Tome and Principe': 'São Tomé and Príncipe',
                'Holy See (Vatican City)': 'Vatican City', 'DR Congo': 'Democratic Republic of the Congo',
                'Republic of the Congo': 'Congo', 'Eswatini (Swaziland)': 'Eswatini', 'St. Vincent': 'Saint Vincent and the Grenadines'
            };
            let selectedCountry = selects[0].querySelector('input').value;
            let citizenship = countryAliases[selectedCountry] || selectedCountry;
            let euCitizen = schengen.has(citizenship) || ['Cyprus', 'Ireland'].includes(citizenship);
            let free = euCitizen || visaFree.has(citizenship);
            resultTitle.textContent = free
                ? 'No, you don’t need a Schengen visa'
                : 'Yes, you need a Schengen visa!';
            let text = free
                ? 'However, we still recommend getting travel insurance for the Schengen area. Purchase it now with a '
                : 'To apply for a Schengen visa from your country, travel insurance covering the Schengen area is mandatory — get it now with a ';
            let discount = document.createElement('span'); discount.className = 'visa-check__discount'; discount.textContent = '10% discount!';
            resultText.replaceChildren(text, discount);
            selects.forEach(root => closeSelect(root)); start.hidden = true; result.hidden = false; resultTitle.focus({ preventScroll: true });
        }
        visaCheck.querySelector('.visa-check__form').addEventListener('submit', checkVisa);
        start.querySelector('.visa-check__btn').addEventListener('click', checkVisa);
        result.querySelector('.visa-check__apply').addEventListener('click', () => openInsurancePopup?.(selects[1].querySelector('input').value));
    }
}).catch(error => {
    // Keep the rest of the page usable if the shared country menus cannot load.
    document.querySelectorAll('.visa-check__btn').forEach(button => {
        button.disabled = true; button.title = 'Country list unavailable. Reload the page.';
    });
});

let quotePage = document.querySelector('.quote-page');

if (quotePage) {
    let tripData = null;

    try {
        tripData = JSON.parse(sessionStorage.getItem('insuranceTrip'));
    } catch {
        tripData = null
    }

    if (tripData && (
        !Array.isArray(tripData.countries) || !tripData.countries.length ||
        !tripData.countries.every(country => typeof country === 'string') ||
        !Number.isFinite(tripData.startDate) || !Number.isFinite(new Date(tripData.startDate).getTime()) ||
        !Number.isSafeInteger(tripData.travelers) || tripData.travelers < 1 ||
        !tripData.annual && (!Number.isFinite(tripData.endDate) || tripData.endDate < tripData.startDate)
    )) tripData = null;


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

        let coverageCountryTooltip = document.querySelector('.quote-coverage__country-tooltip');
        coverageCountryTooltip.textContent = tripData.countries.join(', ');
        coverageCountryTooltip.hidden = tripData.countries.length < 2;
        document.querySelector('.quote-coverage__country').removeAttribute('title');

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

        let baseTotal = price * coverageRates[selectedCoverage] * tripRates[selectedTrip];
        let discount = tripData.source === 'visa-check' && tripData.discountRate === 0.1 ? 0.1 : 0;
        let total = (baseTotal * (1 - discount) + addonsTotal) * tripData.travelers;
        let oldPrice = document.querySelector('.payment-receipt__old-price');
        oldPrice.hidden = !discount;
        oldPrice.textContent = discount
            ? `$${((baseTotal + addonsTotal) * tripData.travelers).toFixed(2).replace('.', ',')}`
            : '';
        let [whole, fraction] = total.toFixed(2).split('.');

        document.querySelectorAll(
            '.quote-page__price, .addons__total-price, .quote-coverage__price, .payment-receipt__price'
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
        if (checkoutStep > 2) {
            showCheckoutStep(checkoutStep - 1);
            return;
        }
        window.location.href = 'index.html#hero';
    });

    fullCoverageButton.addEventListener('click', () => {
        showQuoteScreen(2);
    });

    let quoteMain = document.querySelector('.quote-main');
    let quoteCard = document.querySelector('.quote-page__card');
    let quoteSummary = document.querySelector('.quote-page__summary');
    let touristsForm = document.querySelector('.tourists-form');
    let touristConsent = touristsForm.querySelector('.tourists-form__checkbox');
    let payment = document.querySelector('.payment');
    let cardNumberInput = payment.querySelector('.payment-form__input--number');
    let cardNumberPreviews = payment.querySelectorAll('.payment-card__number');
    let paymentTypeMenu = payment.querySelector('.payment-form__select-wrap');
    let paymentTypeButton = paymentTypeMenu.querySelector('.payment-form__select');
    let paymentTypeOptions = paymentTypeMenu.querySelector('.payment-form__options');
    let paymentTypeValue = paymentTypeMenu.querySelector('.payment-form__type-value');

    function formatCardNumber(value) {
        let digits = value.replace(/\D/g, '').slice(0, 16);

        return digits.match(/.{1,4}/g)?.join(' · ') || '';
    }

    function createCardDigits(value, length, field, padStart = false) {
        let fragment = document.createDocumentFragment();
        let placeholder = '0'.repeat(Math.max(0, length - value.length));

        if (padStart) fragment.append(placeholder);

        if (value) {
            let digits = document.createElement('span');
            digits.className = `payment-card__digits payment-card__digits--${field}`;
            digits.textContent = value;
            fragment.append(digits);
        }

        if (!padStart) fragment.append(placeholder);

        return fragment;
    }

    function updateCardNumber() {
        let digits = cardNumberInput.value.replace(/\D/g, '').slice(0, 16);

        cardNumberPreviews.forEach((element) => {
            let fragment = document.createDocumentFragment();

            for (let offset = 0; offset < 16; offset += 4) {
                if (offset) fragment.append(' · ');
                fragment.append(createCardDigits(digits.slice(offset, offset + 4), 4, 'number'));
            }

            element.replaceChildren(fragment);
        });
    }

    cardNumberInput.maxLength = 25;

    cardNumberInput.addEventListener('input', () => {
        let value = cardNumberInput.value;
        let cursor = cardNumberInput.selectionStart;
        let formatted = formatCardNumber(value);

        if (formatted !== value) {
            cardNumberInput.value = formatted;

            let position = Math.min(
                formatCardNumber(value.slice(0, cursor)).length,
                formatted.length
            );

            cardNumberInput.setSelectionRange(position, position);
        }

        updateCardNumber();
    });
    let expiryMonthInput = payment.querySelector(
        '.payment-form__input--month'
    );

    let expiryYearInput = payment.querySelector(
        '.payment-form__input--year'
    );

    let cardExpiryPreviews = payment.querySelectorAll(
        '.payment-card__expiry-value'
    );

    function updateCardExpiry() {
        cardExpiryPreviews.forEach((element) => {
            element.replaceChildren(
                createCardDigits(expiryMonthInput.value, 2, 'month', true),
                '/',
                createCardDigits(expiryYearInput.value, 2, 'year', true)
            );
        });
    }

    [expiryMonthInput, expiryYearInput].forEach((input) => {
        input.addEventListener('input', () => {
            let value = input.value.replace(/\D/g, '').slice(0, 2);

            if (input === expiryMonthInput && Number(value) > 12) {
                value = '12';
            }

            if (input.value !== value) {
                input.value = value;
            }

            updateCardExpiry();
        });
    });

    let paymentCard = payment.querySelector('.payment-card');
    let cvvInput = payment.querySelector('.payment-form__input--cvv');
    let cardCvvPreview = payment.querySelector('.payment-card__cvv');

    cvvInput.addEventListener('focus', () => {
        paymentCard.classList.add('payment-card--flipped');
    });

    cvvInput.addEventListener('blur', () => {
        paymentCard.classList.remove('payment-card--flipped');
    });

    cvvInput.addEventListener('input', () => {
        let value = cvvInput.value.replace(/\D/g, '').slice(0, 3);

        if (cvvInput.value !== value) {
            cvvInput.value = value;
        }

        cardCvvPreview.replaceChildren(createCardDigits(value, 3, 'cvv'));
    });

    let paymentInputs = [cardNumberInput, expiryMonthInput, expiryYearInput, cvvInput];
    let paymentFocusComplete = new WeakMap();
    let payNowButton = payment.querySelector('.payment-form__submit');

    // Local demo only: these numbers never leave the browser or enter storage.
    let demoCards = {
        '4242424242424242': 'success',
        '5555555555554444': 'success',
        '4000000000000119': 'error',
        '4000000000000002': 'failed'
    };
    let paymentForm = payment.querySelector('.payment-form');
    let paymentModals = document.querySelectorAll('.payment-modal');
    let paymentAttempt = 0;
    let paymentTimer;
    let stepText = document.querySelector('.quote-page__step-text');
    let normalStepText = Array.from(stepText.childNodes);
    paymentForm.noValidate = true;
    let demoNote = document.createElement('details');
    demoNote.className = 'payment-form__demo';
    demoNote.innerHTML = '<summary>Demo payment — no real charge</summary><p>Use any made-up 16-digit number for success; do not enter real card details. Processing error: 4000 0000 0000 0119. Declined: 4000 0000 0000 0002. Use any future expiry and 3-digit CVV. No policy or email is issued.</p>';
    paymentForm.querySelector('.payment-form__footer').before(demoNote);

    function hasValidCardNumber() {
        let digits = cardNumberInput.value.replace(/\D/g, '');
        return /^\d{16}$/.test(digits);
    }

    function validatePayment(showErrors = true) {
        let numberValid = hasValidCardNumber();
        let groups = [
            { inputs: [cardNumberInput], valid: numberValid, field: cardNumberInput.closest('.payment-form__field') },
            { inputs: [expiryMonthInput, expiryYearInput], valid: isPaymentInputComplete(expiryYearInput), field: expiryMonthInput.closest('fieldset') },
            { inputs: [cvvInput], valid: isPaymentInputComplete(cvvInput), field: cvvInput.closest('.payment-form__field') }
        ];
        let firstInvalid;
        groups.forEach(({ inputs, valid, field }, index) => {
            let error = field.querySelector('.payment-form__error');
            error.id = `payment-error-${index}`;
            error.setAttribute('role', 'alert');
            if (index === 0) error.textContent = 'Please enter a 16-digit card number.';
            let reveal = showErrors || inputs.some(input => input.getAttribute('aria-invalid') === 'true');
            if (reveal) {
                error.hidden = valid;
                inputs.forEach(input => {
                    input.classList.toggle('payment-form__input--error', !valid);
                    input.setAttribute('aria-invalid', String(!valid));
                    if (valid) input.removeAttribute('aria-describedby');
                    else input.setAttribute('aria-describedby', error.id);
                });
            }
            if (!valid && !firstInvalid) firstInvalid = inputs[0];
        });
        payment.querySelector('.payment-form__valid').hidden = !numberValid;
        let mastercard = /^5[1-5]/.test(cardNumberInput.value);
        payment.querySelector('.payment-card__brand').hidden = !mastercard || !numberValid;
        let brand = payment.querySelector('.payment-form__brand');
        brand.src = mastercard ? 'img/quote/mastercard.svg' : 'img/quote/famicons_card.svg';
        brand.alt = mastercard ? 'Mastercard' : 'Card';
        return firstInvalid;
    }

    paymentInputs.forEach(input => input.addEventListener('input', () => validatePayment(false)));

    function cancelDemoPayment() {
        paymentAttempt++;
        clearTimeout(paymentTimer);
        paymentForm.inert = false;
        paymentForm.removeAttribute('aria-busy');
        payNowButton.disabled = false;
        payNowButton.firstChild.textContent = 'Pay Now ';
    }

    function showPaymentResult(state) {
        cancelDemoPayment();
        payment.hidden = true;
        quoteNavigation.hidden = true;
        document.querySelector('.quote-page__back').hidden = state === 'success';
        stepText.textContent = state === 'success' ? 'Demo completed' : 'Something went wrong';
        progressSteps.forEach((element, index) => element.classList.toggle('quote-page__step--active', index < (state === 'success' ? 4 : 3)));
        paymentModals.forEach(modal => modal.hidden = !modal.classList.contains(`payment-modal--${state}`));
        let activeModal = document.querySelector(`.payment-modal--${state}`);
        activeModal.focus();
        cvvInput.value = '';
        cardCvvPreview.replaceChildren(createCardDigits('', 3, 'cvv'));
        paymentCard.classList.remove('payment-card--flipped');
        window.scrollTo({ top: 0, behavior: 'instant' });
    }

    function submitDemoPayment(event) {
        event.preventDefault();
        if (payNowButton.disabled || checkoutStep !== 4) return;
        let invalid = validatePayment();
        if (invalid) { invalid.focus(); return; }
        let result = demoCards[cardNumberInput.value.replace(/\D/g, '')] || 'success';
        let attempt = ++paymentAttempt;
        payNowButton.disabled = true;
        payNowButton.firstChild.textContent = 'Processing… ';
        paymentForm.setAttribute('aria-busy', 'true');
        paymentForm.inert = true;
        paymentTimer = setTimeout(() => {
            if (attempt === paymentAttempt && checkoutStep === 4) showPaymentResult(result);
        }, 650);
    }
    payNowButton.addEventListener('click', submitDemoPayment);
    paymentForm.addEventListener('submit', submitDemoPayment);
    paymentModals.forEach(modal => {
        let notice = document.createElement('p');
        notice.className = 'payment-modal__demo';
        notice.textContent = 'Demo only. No money charged, policy issued or email sent.';
        modal.querySelector('.payment-modal__content').append(notice);
    });
    document.querySelector('.payment-modal--success .payment-modal__text').textContent = 'The test payment scenario was completed successfully.';
    document.querySelectorAll('.payment-modal__retry').forEach(button => button.addEventListener('click', () => {
        showCheckoutStep(4);
        cardNumberInput.focus();
    }));
    document.querySelectorAll('.payment-modal__contact').forEach(button => button.addEventListener('click', () => {
        let notice = button.closest('.payment-modal').querySelector('.payment-modal__demo');
        notice.setAttribute('role', 'status');
        notice.textContent = 'Support links are not connected in this demo. Use Back to retry the test payment.';
    }));

    function isPaymentInputComplete(input) {
        if (input === cardNumberInput) {
            return /^\d{16}$/.test(input.value.replace(/\D/g, ''));
        }

        if (input === expiryMonthInput) {
            return /^\d{2}$/.test(input.value) && Number(input.value) >= 1 && Number(input.value) <= 12;
        }

        if (input === expiryYearInput) {
            if (!/^\d{2}$/.test(input.value) || !isPaymentInputComplete(expiryMonthInput)) return false;

            let today = new Date();
            let year = 2000 + Number(input.value);

            return year > today.getFullYear() ||
                (year === today.getFullYear() && Number(expiryMonthInput.value) >= today.getMonth() + 1);
        }

        return /^\d{3}$/.test(input.value);
    }

    function movePaymentFocus(input, direction = 1) {
        let index = paymentInputs.indexOf(input);
        let next = paymentInputs[index + direction];

        if (!next && direction > 0) next = payNowButton;
        if (!next) return;

        next.focus();

        if (next.matches('input')) {
            next.setSelectionRange(next.value.length, next.value.length);
        }
    }

    payment.addEventListener('focusin', (event) => {
        if (paymentInputs.includes(event.target)) {
            paymentFocusComplete.set(event.target, isPaymentInputComplete(event.target));
        }
    });

    payment.addEventListener('input', (event) => {
        let input = event.target;

        if (
            paymentInputs.includes(input) && document.activeElement === input &&
            !paymentFocusComplete.get(input) && !event.isComposing &&
            !event.inputType?.startsWith('delete') && isPaymentInputComplete(input) &&
            input.selectionStart === input.value.length && input.selectionEnd === input.value.length
        ) {
            movePaymentFocus(input);
        }
    });

    payment.addEventListener('keydown', (event) => {
        let input = event.target;

        if (!paymentInputs.includes(input) || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;

        if (event.key === 'Enter') {
            event.preventDefault();

            if (isPaymentInputComplete(input)) movePaymentFocus(input);
        }

        if (event.key === 'Backspace' && !input.value && paymentInputs.indexOf(input) > 0) {
            event.preventDefault();
            movePaymentFocus(input, -1);
        }
    });

    function closePaymentTypeMenu(returnFocus = false) {
        paymentTypeOptions.hidden = true;
        paymentTypeButton.setAttribute('aria-expanded', 'false');

        if (returnFocus) paymentTypeButton.focus();
    }

    function openPaymentTypeMenu() {
        paymentTypeOptions.hidden = false;
        paymentTypeButton.setAttribute('aria-expanded', 'true');
    }

    paymentTypeButton.addEventListener('click', () => {
        if (paymentTypeOptions.hidden) {
            openPaymentTypeMenu();
        } else {
            closePaymentTypeMenu();
        }
    });

    paymentTypeOptions.addEventListener('click', (event) => {
        let option = event.target.closest('.payment-form__option');

        if (!option) return;

        paymentTypeValue.value = option.dataset.value;
        paymentTypeButton.querySelector('.payment-form__select-value').textContent =
            option.querySelector('.payment-form__option-name').textContent.trim();

        paymentTypeOptions.querySelectorAll('.payment-form__option').forEach((element) => {
            element.setAttribute('aria-selected', String(element === option));
        });

        closePaymentTypeMenu(true);
    });

    paymentTypeMenu.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && !paymentTypeOptions.hidden) {
            event.preventDefault();
            event.stopPropagation();
            closePaymentTypeMenu(true);
            return;
        }

        if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

        event.preventDefault();
        let options = Array.from(paymentTypeOptions.querySelectorAll('.payment-form__option'));
        let index = options.indexOf(document.activeElement);

        openPaymentTypeMenu();

        if (event.key === 'Home' || (index < 0 && event.key === 'ArrowDown')) index = 0;
        else if (event.key === 'End' || (index < 0 && event.key === 'ArrowUp')) index = options.length - 1;
        else index = (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;

        options[index]?.focus();
    });

    paymentTypeMenu.addEventListener('focusout', (event) => {
        if (!paymentTypeMenu.contains(event.relatedTarget)) closePaymentTypeMenu();
    });

    document.addEventListener('click', (event) => {
        if (!paymentTypeMenu.contains(event.target)) closePaymentTypeMenu();
    });

    let progressSteps = document.querySelectorAll('.quote-page__step');
    let stepNumber = document.querySelector('.quote-page__step-text-swap');
    let getCoveredButtons = document.querySelectorAll(
        '.quote-page__submit, .addons__submit, .quote-coverage__submit'
    );
    let quoteDetails = document.querySelector('.quote-details');
    let addonsSection = document.querySelector('.addons');
    let priceBar = document.querySelector('.quote-coverage__bar');
    let priceBarSlot = document.querySelector('.quote-coverage__bar-slot');
    let quoteHeader = document.querySelector('.header');
    let orderSummary = document.querySelector('.order-summary');
    let addonsSummarySlot = document.querySelector('.order-summary-slot--addons');
    let coverageSummarySlot = document.querySelector('.order-summary-slot--coverage');
    let touristsList = touristsForm.querySelector('.tourists-form__list');
    let touristTemplate = document.querySelector('.tourist-template');
    let addTouristButton = touristsForm.querySelector('.tourists-form__add');
    let quoteNavigation = quoteMain.querySelector('.quote-navigation');
    let quoteNavigationButtons = quoteNavigation.querySelectorAll('.quote-navigation__button');
    let quoteSummaryTooltipTriggers = quoteMain.querySelectorAll(
        '.quote-page__summary-item--country, .addons__trip-item--country, .addons__trip-item--travelers, .quote-coverage__summary-item--country'
    );
    let checkoutStep = 2;
    let quoteScreens = [quotePage, addonsSection, coverageSection];
    let screenNames = ['quote', 'addons', 'coverage'];
    let currentScreen = 0;
    let screenChanging = false;
    let lastWheelTime = -Infinity;
    history.scrollRestoration = 'manual';

    let quoteInfoTriggers = quoteMain.querySelectorAll('.quote-page__info, .addons__info');
    let quoteInfoPointerFocus = new WeakSet();

    function closeQuoteInfoTooltips(except = null) {
        quoteInfoTriggers.forEach(trigger => {
            if (trigger !== except) trigger.setAttribute('aria-expanded', 'false');
        });
    }

    quoteInfoTriggers.forEach((trigger, index) => {
        let tooltip = trigger.nextElementSibling;
        if (!tooltip?.matches('.quote-page__tooltip, .addons__tooltip')) return;
        tooltip.id = `quote-info-tooltip-${index}`;
        tooltip.setAttribute('role', 'tooltip');
        trigger.setAttribute('aria-controls', tooltip.id);
        trigger.setAttribute('aria-expanded', 'false');
        if (!trigger.hasAttribute('aria-label')) {
            let name = trigger.closest('.addons__heading')?.querySelector('.addons__name')
                || trigger.closest('.quote-page__item')?.querySelector('.quote-page__name');
            trigger.setAttribute('aria-label', `More about ${name?.textContent.trim() || 'this coverage'}`);
        }
        trigger.addEventListener('pointerdown', () => quoteInfoPointerFocus.add(trigger));
        trigger.addEventListener('focus', () => {
            if (quoteInfoPointerFocus.has(trigger)) return;
            closeQuoteInfoTooltips(trigger);
            trigger.setAttribute('aria-expanded', 'true');
        });
        trigger.addEventListener('click', event => {
            event.preventDefault();
            let open = trigger.getAttribute('aria-expanded') !== 'true';
            quoteInfoPointerFocus.delete(trigger);
            closeQuoteInfoTooltips(trigger);
            trigger.setAttribute('aria-expanded', String(open));
        });
        trigger.addEventListener('blur', () => {
            quoteInfoPointerFocus.delete(trigger);
            trigger.setAttribute('aria-expanded', 'false');
        });
        trigger.addEventListener('keydown', event => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            trigger.setAttribute('aria-expanded', 'false');
            trigger.blur();
        });
    });

    document.addEventListener('pointerdown', event => {
        if (!event.target.closest('.quote-page__info, .addons__info, .quote-page__tooltip, .addons__tooltip')) closeQuoteInfoTooltips();
    });

    function syncQuoteNavigation() {
        quoteNavigation.hidden = checkoutStep !== 2;
        quoteNavigationButtons.forEach((button) => {
            let active = Number(button.dataset.quoteScreen) === currentScreen;
            button.classList.toggle('quote-navigation__button--active', active);
            if (active) button.setAttribute('aria-current', 'page');
            else button.removeAttribute('aria-current');
        });
    }

    quoteNavigationButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (checkoutStep !== 2) return;
            let index = Number(button.dataset.quoteScreen);
            showQuoteScreen(index, index < currentScreen ? -1 : 1, true, true);
        });
    });

    function closeQuoteSummaryTooltip(trigger, blur = false) {
        trigger.classList.remove('quote-summary-tooltip--open');
        if (blur && trigger.contains(document.activeElement)) document.activeElement.blur();
    }

    quoteSummaryTooltipTriggers.forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            if (event.target.closest('button, a, input, select, textarea')) return;
            let tooltip = trigger.querySelector('[role="tooltip"]');
            if (!tooltip || tooltip.hidden || !tooltip.textContent.trim()) return;
            let open = !trigger.classList.contains('quote-summary-tooltip--open');
            quoteSummaryTooltipTriggers.forEach((other) => {
                if (other !== trigger) closeQuoteSummaryTooltip(other, true);
            });
            trigger.classList.toggle('quote-summary-tooltip--open', open);
            if (open) trigger.focus({ preventScroll: true });
            else closeQuoteSummaryTooltip(trigger, true);
        });
        trigger.addEventListener('focusout', (event) => {
            if (!trigger.contains(event.relatedTarget)) closeQuoteSummaryTooltip(trigger);
        });
        trigger.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            closeQuoteSummaryTooltip(trigger, true);
        });
    });

    document.addEventListener('pointerdown', (event) => {
        quoteSummaryTooltipTriggers.forEach((trigger) => {
            if (!trigger.contains(event.target)) closeQuoteSummaryTooltip(trigger, true);
        });
    });

    function updateTouristsCount() {
        if (!tripData) return;

        let count = touristsList.children.length;

        tripData.travelers = count;

        sessionStorage.setItem('insuranceTrip', JSON.stringify(tripData));

        document.querySelectorAll(
            '.quote-page__summary-item__traveler, .addons__travelers, .quote-coverage__travelers'
        ).forEach((element) => {
            element.textContent = `${count} ${count === 1 ? 'traveler' : 'travelers'}`;
        });

        updatePrice();
    }

    function isValidBirth(field, minAge = 0, maxAge = 90) {
        let inputs = field.querySelectorAll('.tourist__input');
        let [monthText, dayText, yearText] = Array.from(
            inputs, (input) => input.value.trim()
        );

        if (
            !/^\d{1,2}$/.test(monthText) ||
            !/^\d{1,2}$/.test(dayText) ||
            !/^\d{4}$/.test(yearText)
        ) {
            return false;
        }

        let month = Number(monthText);
        let day = Number(dayText);
        let year = Number(yearText);

        let date = new Date();
        date.setHours(0, 0, 0, 0);
        date.setFullYear(year, month - 1, day);

        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let age = today.getFullYear() - year;

        if (
            today.getMonth() < month - 1 ||
            (today.getMonth() === month - 1 && today.getDate() < day)
        ) {
            age--;
        }

        return year > 0 &&
            date.getFullYear() === year &&
            date.getMonth() === month - 1 &&
            date.getDate() === day &&
            date <= today &&
            age >= minAge &&
            age <= maxAge;
    }

    function setTouristError(field, hasError) {
        let error = field.querySelector('.tourist__error');

        field.querySelectorAll('.tourist__input').forEach((input) => {
            input.classList.toggle('tourist__input--error', hasError);

            if (hasError) {
                input.setAttribute('aria-invalid', 'true');
            } else {
                input.removeAttribute('aria-invalid');
            }
        });

        error.hidden = !hasError
    }

    function getTouristInvalidInput(field) {
        let inputs = Array.from(field.querySelectorAll('.tourist__input'));
        let invalidInput = inputs.find((input) => {
            let value = input.value.trim();

            if (!value || !input.validity.valid) return true;

            if (input.matches('[name$="[firstName]"], [name$="[lastName]"]')) {
                return !/^[A-Za-z]+(?:[ '-][A-Za-z]+)*$/.test(value);
            }

            return input.name === 'email' && /[^\x21-\x7E]/.test(value);
        });

        if (field.classList.contains('tourist__birth')) {
            let error = field.querySelector('.tourist__error');
            let isPrimary = field.closest('.tourist') === touristsList.firstElementChild;

            error.textContent = 'Enter a valid date of birth';

            if (!invalidInput && !isValidBirth(field, 0, Infinity)) {
                invalidInput = inputs[0];
            } else if (!invalidInput && !isValidBirth(field)) {
                invalidInput = inputs[2];
                error.textContent = 'Tourists must be no older than 90 years';
            } else if (!invalidInput && isPrimary && !isValidBirth(field, 16)) {
                invalidInput = inputs[2];
                error.textContent = 'The main tourist must be at least 16 years old';
            }
        }

        return invalidInput;
    }

    function createTourist() {
        let index = touristsList.children.length;
        let tourist = touristTemplate.content.firstElementChild.cloneNode(true);

        tourist.querySelector('.tourist__number').textContent = index + 1;

        tourist.querySelectorAll('[data-field]').forEach((input) => {
            input.name = `tourists[${index}][${input.dataset.field}]`;
        });
        touristsList.append(tourist);
    }

    let initialTourists = Number(tripData?.travelers);

    if (!Number.isSafeInteger(initialTourists) || initialTourists < 1) {
        initialTourists = 1;
    }
    for (let i = 1; i < initialTourists; i++) {
        createTourist()
    }
    addTouristButton.addEventListener('click', () => {
        createTourist()
        updateTouristsCount();
    });
    touristsList.addEventListener('click', (event) => {
        let removeButton = event.target.closest('.tourist__remove');

        if (!removeButton) return;

        removeButton.closest('.tourist').remove();

        Array.from(touristsList.children).forEach((tourist, index) => {
            let number = tourist.querySelector('.tourist__number');

            if (number) {
                number.textContent = index + 1;
            }
            tourist.querySelectorAll('[data-field]').forEach((input) => {
                input.name = `tourists[${index}][${input.dataset.field}]`;
            })
        });
        updateTouristsCount();
    });

    touristsForm.noValidate = true;

    let touristFocusComplete = new WeakMap();

    function isTouristInputComplete(input) {
        let value = input.value.trim();
        let birth = input.closest('.tourist__birth');

        if (!birth) return !getTouristInvalidInput(input.closest('.tourist__field'));

        if (input.name.endsWith('[month]')) {
            return /^\d{2}$/.test(value) && Number(value) >= 1 && Number(value) <= 12;
        }

        if (input.name.endsWith('[day]')) {
            let month = Number(birth.querySelector('[name$="[month]"]').value);
            let year = Number(birth.querySelector('[name$="[year]"]').value) || 2000;
            let maxDay = month >= 1 && month <= 12 ? new Date(year, month, 0).getDate() : 31;

            return /^\d{2}$/.test(value) && Number(value) >= 1 && Number(value) <= maxDay;
        }

        return !getTouristInvalidInput(birth);
    }

    function updateTouristFieldState(input) {
        let field = input.closest('.tourist__field, .tourist__birth');

        field.querySelectorAll('.tourist__input').forEach((element) => {
            element.classList.toggle('tourist__input--filled', isTouristInputComplete(element));
        });

        if (!field.querySelector('.tourist__error').hidden) {
            setTouristError(field, Boolean(getTouristInvalidInput(field)));
        }
    }

    function moveTouristFocus(input, direction) {
        let inputs = Array.from(touristsList.querySelectorAll('.tourist__input'));
        let next = inputs[inputs.indexOf(input) + direction];

        if (!next) return false;

        next.focus();

        if (next.selectionStart !== null) {
            next.setSelectionRange(next.value.length, next.value.length);
        } else if (next.type === 'email') {
            let value = next.value;
            next.value = '';
            next.value = value;
        }

        return true;
    }

    touristsList.addEventListener('focusin', (event) => {
        let input = event.target;

        if (!input.matches('.tourist__input')) return;

        touristFocusComplete.set(input, isTouristInputComplete(input));
        updateTouristFieldState(input);
    });

    touristsList.addEventListener('focusout', (event) => {
        if (event.target.matches('.tourist__input')) updateTouristFieldState(event.target);
    });

    touristsList.addEventListener('keydown', (event) => {
        let input = event.target;

        if (!input.matches('.tourist__input') || event.isComposing || event.ctrlKey || event.altKey || event.metaKey) return;

        if (event.key === 'Enter') {
            event.preventDefault();

            if (isTouristInputComplete(input)) {
                moveTouristFocus(input, 1);
            } else {
                let field = input.closest('.tourist__field, .tourist__birth');
                getTouristInvalidInput(field);
                setTouristError(field, true);
            }
        }

        if (
            event.key === 'Backspace' &&
            (!input.value || (input.name === 'phone' && /^\+380\s*$/.test(input.value))) &&
            moveTouristFocus(input, -1)
        ) {
            event.preventDefault();
        }
    });

    function formatTouristPassport(value) {
        let series = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
        let number = value.replace(/\D/g, '').slice(0, 6);

        return series + (series.length === 2 ? number : '');
    }

    function formatTouristPhone(value) {
        let digits = value.replace(/\D/g, '');

        if (!digits) return '';

        if (digits.startsWith('380')) {
            digits = digits.slice(3);
        } else if (digits.startsWith('0')) {
            digits = digits.slice(1);
        }

        digits = digits.slice(0, 9);

        return [
            '+380', digits.slice(0, 2), digits.slice(2, 5),
            digits.slice(5, 7), digits.slice(7, 9)
        ].filter(Boolean).join(' ');
    }

    touristsList.addEventListener('beforeinput', (event) => {
        let input = event.target;

        if (
            input.name === 'phone' && input.value.startsWith('+380') &&
            event.inputType.startsWith('delete') &&
            input.selectionStart === input.selectionEnd && input.selectionStart <= 4
        ) {
            event.preventDefault();
        }
    });

    touristsList.addEventListener('input', (event) => {
        let input = event.target;
        let format;

        if (input.matches('.tourist__birth .tourist__input')) {
            format = (value) => {
                let digits = value.replace(/\D/g, '').slice(0, input.maxLength);

                if (input.name.endsWith('[month]') && Number(digits) > 12) return '12';
                if (input.name.endsWith('[day]') && Number(digits) > 31) return '31';

                return digits;
            };
        } else if (input.matches('[name$="[firstName]"], [name$="[lastName]"]')) {
            format = (value) => value.replace(/[^a-z '-]/gi, '');
        } else if (input.name.endsWith('[passport]')) {
            format = formatTouristPassport;
        } else if (input.name === 'phone') {
            format = formatTouristPhone;
        } else if (input.name === 'email') {
            format = (value) => value.replace(/[^\x21-\x7E]/g, '');
        }

        if (!format) return;

        let value = input.value;
        let cursor = input.selectionStart;
        let formatted = format(value);

        if (formatted !== value) {
            input.value = formatted;

            if (cursor !== null) {
                let position = Math.min(format(value.slice(0, cursor)).length, formatted.length);
                input.setSelectionRange(position, position);
            }
        }

        updateTouristFieldState(input);

        let fixedLength = input.closest('.tourist__birth') ||
            input.name.endsWith('[passport]') || input.name === 'phone';

        if (
            fixedLength && document.activeElement === input &&
            !touristFocusComplete.get(input) && !event.isComposing &&
            !event.inputType?.startsWith('delete') && isTouristInputComplete(input) &&
            input.selectionStart === input.value.length && input.selectionEnd === input.value.length
        ) {
            moveTouristFocus(input, 1);
        }
    });

    touristsForm.addEventListener('submit', (event) => {
        event.preventDefault();

        let firstInvalidInput = null;

        touristsList.querySelectorAll(
            '.tourist__field, .tourist__birth'
        ).forEach((field) => {
            let invalidInput = getTouristInvalidInput(field);
            setTouristError(field, Boolean(invalidInput));

            if (invalidInput && !firstInvalidInput) {
                firstInvalidInput = invalidInput;
            }
        });

        let consentValid = validateRequiredCheckbox(touristConsent);

        if (firstInvalidInput) {
            firstInvalidInput.focus();
            return;
        }

        if (!consentValid) {
            touristConsent.focus();
            return;
        }

        showCheckoutStep(4);
    });
    function updateQuoteSizes() {
        quoteMain.style.setProperty('--quote-header-height', `${quoteHeader.offsetHeight}px`);

        let title = quoteScreens[currentScreen].querySelector('.title');

        if (title && title.offsetHeight) {
            let offset = title.offsetHeight + parseFloat(getComputedStyle(title).marginBottom);
            quoteMain.style.setProperty('--quote-title-offset', `${offset}px`);
        }
    }

    function revealPriceBar() {
        if (currentScreen !== 2 || quoteMain.classList.contains('quote-main--switching')) return;

        let position = priceBarSlot.getBoundingClientRect();

        if (position.top < window.innerHeight - 24 && position.bottom > 0) {
            priceBar.classList.add('quote-coverage__bar--visible');
            priceBar.inert = false;
        }
    }

    function showQuoteScreen(index, direction = 1, animate = true, startAtTop = false) {
        if (screenChanging || index < 0 || index >= quoteScreens.length) return;
        if (animate && index === currentScreen) return;

        let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let moveFocus = quoteScreens[currentScreen].contains(document.activeElement);
        let restoreNavigationFocus = quoteNavigation.contains(document.activeElement);
        closeQuoteInfoTooltips();
        quoteSummaryTooltipTriggers.forEach((trigger) => closeQuoteSummaryTooltip(trigger));
        screenChanging = true;
        quoteMain.inert = true;
        quoteMain.style.setProperty('--quote-transition-offset', `${-direction * 12}px`);
        quoteMain.classList.add('quote-main--switching');

        function applyScreen() {
            currentScreen = index;
            syncQuoteNavigation();
            quoteMain.dataset.screen = screenNames[index];
            quotePage.hidden = index !== 0;
            quoteDetails.hidden = index === 0;
            addonsSection.hidden = index !== 1;
            coverageSection.hidden = index !== 2;
            addonsSummarySlot.hidden = index !== 1;
            coverageSummarySlot.hidden = index !== 2;
            priceBarSlot.hidden = index !== 2;
            priceBar.classList.remove('quote-coverage__bar--visible');
            priceBar.inert = true;

            if (index > 0) {
                let slot = index === 1 ? addonsSummarySlot : coverageSummarySlot;
                slot.append(orderSummary);
            }

            closeTripMenu();
            updateQuoteSizes();
            window.scrollTo({
                top: direction < 0 && !startAtTop ? document.documentElement.scrollHeight : 0,
                behavior: 'instant'
            });
            quoteMain.style.setProperty('--quote-transition-offset', `${direction * 12}px`);

            function finishScreen() {
                quoteMain.inert = false;
                quoteMain.classList.remove('quote-main--switching');
                revealPriceBar();

                if (restoreNavigationFocus && !quoteNavigation.hidden) {
                    quoteNavigationButtons[index].focus({ preventScroll: true });
                } else if (moveFocus) {
                    quoteScreens[index].focus({ preventScroll: true });
                }

                if (animate && !reducedMotion) {
                    setTimeout(() => { screenChanging = false; }, 200);
                } else {
                    screenChanging = false;
                }
            }

            if (animate && !reducedMotion) {
                requestAnimationFrame(() => requestAnimationFrame(finishScreen));
            } else {
                finishScreen();
            }
        }

        if (animate && !reducedMotion) {
            setTimeout(applyScreen, 180);
        } else {
            applyScreen();
        }
    }

    function showCheckoutStep(step) {
        if (screenChanging) return;

        cancelDemoPayment();
        paymentModals.forEach(modal => modal.hidden = true);
        stepText.replaceChildren(...normalStepText);
        document.querySelector('.quote-page__back').hidden = false;
        closePaymentTypeMenu();
        showQuoteScreen(0, 1, false);
        checkoutStep = step;
        syncQuoteNavigation();

        quoteCard.hidden = step !== 2;
        fullCoverageButton.hidden = step !== 2;
        touristsForm.hidden = step !== 3;
        payment.hidden = step !== 4;
        quoteSummary.hidden = step === 4;

        stepNumber.textContent = step;

        progressSteps.forEach((element, index) => {
            element.classList.toggle(
                'quote-page__step--active',
                index < step
            );
        });

        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
    }
    getCoveredButtons.forEach((button) => {
        button.addEventListener('click', () => {
            if (!tripData) { window.location.href = 'index.html#hero'; return; }
            showCheckoutStep(3)
        });
    });
    function quoteScrollBoundary(direction) {
        if (direction < 0) return window.scrollY <= 2;

        return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    }

    function quoteHasLocalScroll(target, direction) {
        for (let element = target; element && element !== document.body; element = element.parentElement) {
            let overflow = getComputedStyle(element).overflowY;

            if (!['auto', 'scroll'].includes(overflow)) continue;
            if (direction < 0 && element.scrollTop > 0) return true;
            if (direction > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 1) return true;
        }

        return false;
    }

    function quoteMenuOpen() {
        return document.querySelector('.burger-menu:not([hidden]), .route-menu:not([hidden])') !== null;
    }

    window.addEventListener('wheel', (event) => {
        if (checkoutStep !== 2) return;
        if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;

        let direction = Math.sign(event.deltaY);
        let now = performance.now();
        let newGesture = now - lastWheelTime > 240;
        lastWheelTime = now;

        if (quoteMenuOpen() || quoteHasLocalScroll(event.target, direction)) return;

        if (screenChanging) {
            event.preventDefault();
            return;
        }

        let next = currentScreen + direction;

        if (next < 0 || next >= quoteScreens.length || !quoteScrollBoundary(direction)) return;

        event.preventDefault();

        if (newGesture) showQuoteScreen(next, direction);
    }, { passive: false });

    document.addEventListener('keydown', (event) => {
        if (checkoutStep !== 2) return;
        if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || quoteMenuOpen()) return;
        if (event.target.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;

        let direction;

        if (event.key === 'ArrowDown' || event.key === 'PageDown' || (event.key === ' ' && !event.shiftKey)) direction = 1;
        if (event.key === 'ArrowUp' || event.key === 'PageUp' || (event.key === ' ' && event.shiftKey)) direction = -1;
        if (!direction) return;

        if (screenChanging) {
            event.preventDefault();
            return;
        }

        let next = currentScreen + direction;

        if (next < 0 || next >= quoteScreens.length || !quoteScrollBoundary(direction)) return;

        event.preventDefault();

        if (!event.repeat) showQuoteScreen(next, direction);
    });

    let quoteSizeObserver = new ResizeObserver(updateQuoteSizes);
    quoteSizeObserver.observe(quoteHeader);
    let priceBarObserver = new IntersectionObserver(revealPriceBar, {
        rootMargin: '0px 0px -24px 0px'
    });
    priceBarObserver.observe(priceBarSlot);
    window.addEventListener('resize', updateQuoteSizes);
    document.fonts.ready.then(updateQuoteSizes);

    showQuoteScreen(window.location.hash === '#coverage' ? 2 : 0, 1, false);
}

