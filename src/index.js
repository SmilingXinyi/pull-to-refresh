/**
 * Created by SmilingXinyi on 2017/8/6.
 */

export function PullToRefresh(element, opts) {
    if (!element) throw new Error('No element option');

    const defaultOptions = {
        height: 40,
        dist: 60,
        distMax: 60 * 2,
        distRefresh: 48,
        keyPrefix: '',
        beforeDistHtml: 'Pull down to refresh',
        corsssDistHtml: 'Release to refresh',
        refreshingHtml: 'Refreshing',
        holdingHtml: 'Completion',
        errorHtml: 'Error',
        holdingDuration: 800, // ms
        onRefresh: () => {
        },
        onPulling: () => {
        },
        targetElement: null
    };

    let startY = 0,
        direaction = null,
        isLoading = false,
        isScrolling,
        isPending = true,
        touchesStart = {},
        moveY = 0;

    var ptrDom, ptrInDom;

    let options = Object.assign({}, defaultOptions, opts);

    setupDoms(), setupStyles(), setupEvents();

    function setupEvents() {
        const supportPassive = supportsPassive();
        const passiveListener = supportPassive ? {passive: true, capture: false} : false;
        const activeListener = passiveListener ? {passive: false, capture: false} : false;

        options.targetElement.addEventListener('touchstart', onTouchStart, passiveListener);
        options.targetElement.addEventListener('touchmove', onTouchMove, activeListener);
        options.targetElement.addEventListener('touchend', onTouchEnd, passiveListener);
        document.addEventListener(options.keyPrefix + '-pull', callRefresh, true);
    }

    function setupDoms() {
        ptrDom = document.createElement('div');
        ptrDom.className = options.keyPrefix + '-ptr';
        ptrDom.id = options.keyPrefix + '-ptr';

        ptrInDom = document.createElement('div');
        ptrInDom.className = options.keyPrefix + '-ptrInner';
        ptrInDom.id = options.keyPrefix + '-ptrInner';
        ptrInDom.style.display = 'none';

        ptrDom.appendChild(ptrInDom);

        options.targetElement = document.querySelector(element);
        options.targetElement.parentElement.insertBefore(ptrDom, options.targetElement);
    }

    function setupStyles() {
        let style = document.createElement('style');
        style.textContent = styleContent(options.keyPrefix);
        document.head.appendChild(style);
    }

    function styleContent(prefix) {
        return `.${prefix}-ptr {
                    position: relative;
                    top: -${options.height}px;
                    height: 0;
                    display: flex;
                    align-content: stretch;
                    text-align: center;
                    width: 100%;
                    backgroundColor: '#fff'
                }
                
                .${prefix}-ptrInner {
                    height: ${options.height}px;
                    padding: 0 16px;
                    flex-basis: 100%;
                }`.replace(/\s+/g, ' ');
    }

    function onTouchStart(e) {
        if (!options.isLoading) {
            isScrolling = undefined;
            startY = e.touches[0].pageY;
            touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
            touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
        }
    }

    function onTouchMove(e) {
        let pageX, pageY;
        const current = e.touches[0].pageY,
            scrollTop = document.body.scrollTop;
        moveY = Math.abs(current - startY);
        pageX = e.touches[0].pageX;
        pageY = e.touches[0].pageY;

        const touchesDiff = pageY - touchesStart.y;

        if (!pageX || !pageY) return;

        if (typeof isScrolling === 'undefined') {
            isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }

        if (!isScrolling || moveY < 0) {
            direaction = null;
            return;
        }

        if (touchesDiff > 0 && moveY > 0 && !isLoading && scrollTop <= 1) {
            e.preventDefault();
            ptrInDom.style.display = 'block';
            direaction = 'down';
            if (moveY < options.distRefresh) {
                ptrInDom.innerHTML = options.beforeDistHtml;
            }

            if (moveY >= options.distRefresh) {
                moveY = options.distRefresh + (moveY - options.distRefresh) / 3;
                ptrInDom.innerHTML = options.corsssDistHtml;
            }

            options.onPulling(moveY);

            const style =
                '-webkit-transform: translate3d(0px, ' + Math.floor(moveY).toString() + 'px, 0px); ' +
                'transform: translate3d(0px, ' + Math.floor(moveY).toString() + 'px, 0px); ';
            options.targetElement.setAttribute('style', style);

            const rectStyle =
                '-webkit-transform: translate3d(0px, ' + Math.floor(moveY).toString() + 'px, 0px); ' +
                'transform: translate3d(0px, ' + Math.floor(moveY).toString() + 'px, 0px);';
            ptrDom.setAttribute('style', rectStyle);
        }

        if (moveY < 0) direaction = 'up';
    }

    function onTouchEnd(e) {
        const refreshStyle =
            '-webkit-transform: translate3d(0px, ' + options.distRefresh + 'px, 0px); ' +
            'transform: translate3d(0px, ' + options.distRefresh + 'px, 0px); ' +
            '-webkit-transition: all 300ms; ' +
            'transition: all 300ms; ';
        const overStyle =
            '-webkit-transform: translate3d(0px, 0px, 0px); ' +
            'transform: translate3d(0px, 0px, 0px); ' +
            '-webkit-transition: all 300ms; ' +
            'transition: all 300ms;';

        if (moveY >= options.distRefresh && direaction === 'down' && !isLoading) {
            isLoading = true;
            options.targetElement.setAttribute('style', refreshStyle);
            ptrDom.setAttribute('style', refreshStyle);
            ptrInDom.innerHTML = options.refreshingHtml;
            options.onRefresh();
        }
        else {
            if (direaction === 'down') {
                ptrInDom.style.display = 'none';
                options.targetElement.setAttribute('style', overStyle);
                ptrDom.setAttribute('style', overStyle);
            }
        }

        direaction = null;
    }

    function onFinished() {
        isLoading = false;
        const overStyle =
            '-webkit-transform: translate3d(0px, 0px, 0px); ' +
            'transform: translate3d(0px, 0px, 0px); ' +
            '-webkit-transition: all 300ms; ' +
            'transition: all 300ms;';
        options.targetElement.setAttribute('style', overStyle);
        ptrInDom.style.display = 'none';
    }

    function hideByOne() {
        // Todo
        ptrDom.setAttribute('style', overStyle);
        ptrDom.addEventListener('webkitTransitionEnd', hideByOne);

        ptrInDom.style.display = 'none';
        this.removeEventListener('webkitTransitionEnd', hideByOne);
    }

    function callRefresh() {
        options.onRefresh();
        const refreshStyle =
            '-webkit-transform: translate3d(0px, ' + options.distRefresh + 'px, 0px); ' +
            'transform: translate3d(0px, ' + options.distRefresh + 'px, 0px); ' +
            '-webkit-transition: all 300ms; ' +
            'transition: all 300ms';
        isLoading = true;
        targetEle.setAttribute('style', refreshStyle);
        ptrDom.setAttribute('style', refreshStyle);
        ptrInDom.innerHTML = ptrCurStatus.value;
    }

    function supportsPassive() {
        return (function () {
            let supportsPassive = false;
            try {
                let opts = Object.defineProperty({}, 'passive', {
                    get: function () {
                        supportsPassive = true;
                    }
                });
                window.addEventListener('testPassiveListener', null, opts);
            } catch (e) {
            }
            return supportsPassive;
        })();
    }

    function finishRefresh({over = false, isError = false, str = null}) {
        if (over && !isError) {
            onFinished();
        }
        else {
            ptrInDom.innerHTML = isError ? options.errorHtml : str ? str : options.holdingHtml;
            let t = setTimeout(() => {
                clearTimeout(t);
                onFinished();
            }, options.holdingDuration);
        }
    }

    return {
        finishRefresh,
        callRefresh
    }
}


export function RowToRefresh(element, handler, opts) {
    if (!element) throw new Error('No element option');
    if (!handler) throw new Error('No handler option');

    const defaultOptions = {
        height: 40,
        keyPrefix: '',
        innerHTML: 'Refreshing',
        errorHtml: 'Error',
        offset: document.documentElement.clientHeight
    };

    const options = Object.assign({}, defaultOptions, opts);

    window.addEventListener('scroll', checkPosition, true);

    const targetElement = setupDoms();
    var rtrDom, canFired = true;

    let direaction = null,
        winScrollTop = 0,
        oldScrollTop = 0;

    function checkPosition(e) {
        winScrollTop = window.scrollTop || window.pageYOffset;
        direaction = winScrollTop > oldScrollTop ? 'down' : 'up';
        oldScrollTop = winScrollTop;
        let targetElementTop = updatePosition();
        if (canFired && direaction === 'down' && oldScrollTop + options.offset >= targetElementTop) {
            canFired = false;
            handler(function (fired) {
                canFired = fired;
                if (!canFired) showErrorHtml();
            })
        }
    }

    function updatePosition() {
        return targetElement.getBoundingClientRect().top;
    }

    function setupDoms() {
        rtrDom = document.createElement('div');
        rtrDom.className = (options.keyPrefix || "") + '-row';
        rtrDom.id = (options.keyPrefix || "") + '-row';
        rtrDom.innerHTML = options.innerHTML;
        options.height && (rtrDom.style.height = options.height + 'px');
        rtrDom.style.textAlign = 'center';
        document.querySelector(element).parentNode.appendChild(rtrDom);
        return rtrDom;
    }

    function changeInnerHtml(html) {
        if (!html) throw new Error('empty html string!');
        options.innerHTML = html;
        rtrDom.innerHTML = html;
    }

    function showErrorHtml() {
        rtrDom.innerHTML = options.errorHtml;
    }

    function reset() {
        rtrDom.innerHTML = options.innerHTML;
        canFired = true;
    }

    return {
        changeInnerHtml,
        showErrorHtml,
        reset
    }
}