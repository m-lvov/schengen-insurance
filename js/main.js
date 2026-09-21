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


document.querySelectorAll('.form-field__option').forEach((option) => {
    option.addEventListener('click', () => {
        let value = document.querySelector('.custom-select__value');

        if (value) value.textContent = option.textContent.trim();
    });
});

let mobileTripTabs = document.querySelectorAll('.hero-mobile-form__tab');

mobileTripTabs.forEach((tab) => {
    tab.setAttribute(
        'aria-pressed',
        String(tab.classList.contains('hero-mobile-form__tab--active'))
    );

    tab.addEventListener('click', () => {
        mobileTripTabs.forEach((item) => {
            let isActive = item === tab;

            item.classList.toggle('hero-mobile-form__tab--active', isActive);
            item.setAttribute('aria-pressed', String(isActive));
        });
    });
});

let mobileCountryValue = document.querySelector('.hero-mobile-form__country-value');

document.querySelectorAll('.hero-mobile-form__countries button').forEach((option) => {
    option.addEventListener('click', () => {
        if (mobileCountryValue) mobileCountryValue.textContent = option.textContent.trim();
    });
});

let passengerValue = document.querySelector('.hero-mobile-form__passenger-value');
let passengerCount = 1;

function renderPassengerCount() {
    if (!passengerValue) return;

    passengerValue.textContent = `${passengerCount} ${passengerCount === 1 ? 'passenger' : 'passengers'}`;
}

document.querySelector('.hero-mobile-form__counter-btn--plus')?.addEventListener('click', () => {
    passengerCount += 1;
    renderPassengerCount();
});

document.querySelector('.hero-mobile-form__counter-btn--minus')?.addEventListener('click', () => {
    passengerCount = Math.max(1, passengerCount - 1);
    renderPassengerCount();
});


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
let reviewsList = document.querySelector('.reviews__list');
let reviewsExpendet = false;
let reviewsSlider = document.querySelector('.reviews__slider');
let reviewsSwiper = null;
let reviewsMedia = window.matchMedia('(max-width: 648px)');

function setReviewsSlider() {
    if (reviewsMedia.matches && !reviewsSwiper && typeof Swiper !== 'undefined') {
        reviewsItem.forEach((item) => {
            item.hidden = false;
        });
        reviewsBtn.hidden = true;

        reviewsSwiper = new Swiper(reviewsSlider, {
            wrapperClass: 'reviews__list',
            slideClass: 'reviews__item',
            slidesPerView: 1,
            spaceBetween: 20,
            speed: 450,
            loop: true,
            autoHeight: true,
            grabCursor: true,

            pagination: {
                el: '.reviews__pagination',
                clickable: true,
                dynamicBullets: true,
                dynamicMainBullets: 3,
            },
        });
    }

    if (!reviewsMedia.matches && reviewsSwiper) {
        reviewsSwiper.destroy(true, true);
        reviewsSwiper = null;

        reviewsItem.forEach((item) => {
            item.hidden = !reviewsExpendet;
        });
        reviewsBtn.hidden = false;
    }
}

if (reviewsSlider) {
    setReviewsSlider();
    reviewsMedia.addEventListener('change', setReviewsSlider);
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

    question.addEventListener('click', () => {
        let item = question.closest('.faq__item');
        let answer = item.querySelector('.faq__answer');
        let willOpen = !item.classList.contains('faq__item--open');

        faqItems.forEach((faqItem) => {
            faqItem.classList.remove('faq__item--open');
            faqItem.querySelector('.faq__answer').hidden = true;
            faqItem.querySelector('.faq__question').setAttribute('aria-expanded', 'false');
        });

        item.classList.toggle('faq__item--open', willOpen);
        answer.hidden = !willOpen;

        question.setAttribute('aria-expanded', String(willOpen));
    });
});

