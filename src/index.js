/**
 * Created by wuhan01 on 2017/8/6.
 */

export function PullToRefresh(element, opts) {
    if (!element) return;

    const defaultOptions = {
        dist: 60,
        distMax: 60 * 2,
        distRefresh: 48,
        keyPrefix: '',
        beforeDistHtml: 'Pull down to refresh',
        corsssDistHtml: 'Release to refresh',
        refreshingHtml: 'Refreshing',
        holdingHtml: 'Completion',
        holdingDuration: 800, // ms
        onRefresh: () => {},
        onPulling: () => {},
        targetElement: null
    };

    let startY = 0,
        direaction = null,
        isLoading = false,
        isScrolling,
        isPending = true,
        touchesStart = {},
        moveY = 0;

    let ptrDom, ptrInDom;


    let options = Object.assign({}, defaultOptions, opts);

    setupDoms(), setupStyles(), setupEvents(), setupStatus();
    
    function setupEvents() {
        window.addEventListener('touchstart', onTouchStart, false);
        window.addEventListener('touchmove', onTouchMove, false);
        window.addEventListener('touchend', onTouchEnd, false);
    }

    function setupStatus() {

    }

    function setupDoms() {
        ptrDom = document.createElement('div');
        ptrDom.className = options.keyPrefix + '-ptr';
        ptrDom.id = options.keyPrefix + '-ptr';

        ptrInDom = document.createElement('div');
        ptrInDom.className = options.keyPrefix + '-ptrInner';
        ptrInDom.id = options.keyPrefix + '-ptrInner';

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
                    top: -40px;
                    height: 0;
            
                    display: flex;
                    align-content: stretch;
            
                    text-align: center;
                    width: 100%;
                    backgroundColor: '#fff'
                }
                
                .${prefix}-ptrInner {
                    height: 40px;
                    padding: 0 16px;
                    flex-basis: 100%;
                }`.replace(/\s+/g, ' ');
    }

    function onTouchStart(e) {
        if (!options.isLoading) {
            options.isScrolling = undefined;
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

        if (!pageX || !pageY) return;

        if (typeof isScrolling === 'undefined') {
            isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
        }

        if (!isScrolling) {
            direaction = null;
            return;
        }

        if (moveY > 0 && !isLoading && scrollTop <= 1) {
            e.preventDefault();
            direaction = 'down';
            if (moveY < options.dist) {
                ptrInDom.innerHTML = options.beforeDistHtml;
            }

            if (moveY >= options.dist) {
                moveY = options.dist + (moveY - options.dist) / 3;
                ptrInDom.innerHTML = options.corsssDistHtml;
            }

            options.onPulling();

            const style =
                '-webkit-transform: translate3d(0px, ' + Math.floor(moveY).toString() + 'px, 0px); ' +
                'transform: translate3d(0px, ' + Math.floor(moveY).toString() + 'px, 0px);';
            options.targetElement.setAttribute('style', style);

            ptrDom.setAttribute('style', style);
        }

        if (moveY < 0) direaction = 'up';
    }

    function onTouchEnd(e) {
        const refreshStyle =
            '-webkit-transform: translate3d(0px, ' + options.distRefresh + 'px, 0px); ' +
            'transform: translate3d(0px, ' + options.distRefresh + 'px, 0px);' +
            '-webkit-transition: all 300ms; ' +
            'transition: all 300ms';
        const overStyle =
            'transform: translate3d(0px, 0px, 0px);' +
            ' transition: all 300ms';

        if (moveY >= 48 && direaction === 'down' && !isLoading) {
            isLoading = true;
            options.targetElement.setAttribute('style', refreshStyle);
            ptrDom.setAttribute('style', refreshStyle);
            ptrInDom.innerHTML = options.refreshingHtml;
            options.onRefresh();
        }
        else {
            if (direaction === 'down') {
                options.targetElement.setAttribute('style', overStyle);
                ptrDom.setAttribute('style', overStyle);
            }
        }

        direaction = null;
    }

    function onFinished() {
        isLoading = false;
        const overStyle = 'transform: translate3d(0px, 0px, 0px); transition: all 300ms';
        options.targetElement.setAttribute('style', overStyle);
        ptrDom.setAttribute('style', overStyle);
    }

    function callRefresh() {
        options.onRefresh();
        const refreshStyle = 'transform: translate3d(0px, 48px, 0px); transition: all 300ms';
        isLoading = true;
        targetEle.setAttribute('style', refreshStyle);
        ptrDom.setAttribute('style', refreshStyle);
        ptrInDom.innerHTML = ptrCurStatus.value;
    }


    // changeHtml() {}

    function finishRefresh(over) {
        if (over) {
            onFinished();
        }
        else {
            ptrInDom.innerHTML = options.holdingHtml;
            let t = setTimeout(_ => {
                clearTimeout(t);
                onFinished();
            }, options.holdingDuration)
        }
    }

    return {
        finishRefresh,
        callRefresh
    }
}