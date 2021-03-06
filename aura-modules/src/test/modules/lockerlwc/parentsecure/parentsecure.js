import { Element, api } from 'engine';
import * as testUtils from 'securemoduletest-test-util';

export default class ParentSecure extends Element {
    // properties
    @api callback;

    // utilities
    getCustomEventData(doneObj) {
        return {
            object: {
                foo: 'bar',
                bar: {
                    baz: 'foo'
                }
            },
            array: [0, 1, 2],
            string: 'foobar',
            number: 1,
            boolean: true,
            domElement: this.template.querySelector('#parent-secure'),
            win: window,
            doc: document,
            body: document.body,
            head: document.head,
            func: this.createDoneCallback(doneObj)
        };
    }

    createDoneCallback(doneObj = {}) {
        const fn = function (cb) {
            doneObj.triggered = true;
            return cb ? cb() : undefined;
        }

        return fn
    }

    // assertion helpers
    assertIsSecureElement(el) {
        testUtils.assertEquals(
            true,
            `${el}`.startsWith('SecureElement:'),
            'Expected a SecureElement object in Lockerized LWC component'
        );
    }

    assertIsSecureWindow(window) {
        testUtils.assertEquals(
            'SecureWindow: [object Window]{ key: {"namespace":"lockerlwc"} }',
            `${window}`,
            'Expected window to be a SecureWindow'
        );
    }

    assertIsSecureDocument(doc) {
        testUtils.assertEquals(
            'SecureDocument: [object HTMLDocument]{ key: {"namespace":"lockerlwc"} }',
            `${doc}`,
            'Expected document to be a SecureDocument'
        );
    }

    assertIsSecureBody(body) {
        testUtils.assertEquals(
            'SecureElement: [object HTMLBodyElement]{ key: {"namespace":"lockerlwc"} }',
            `${body}`,
            'Expected body to be a SecureElement: [object HTMLBodyElement]'
        );
    }

    assertIsSecureHead(head) {
        testUtils.assertEquals(
            'SecureElement: [object HTMLHeadElement]{ key: {"namespace":"lockerlwc"} }',
            `${head}`,
            'Expected head to be a SecureElement: [object HTMLHeadElement]'
        );
    }

    assertIsFunction(func) {
        testUtils.assertEquals(
            true,
            func instanceof Function,
            'Expected instance of Function'
        );
    }

    assertIsSecureObjectElement(el) {
        testUtils.assertEquals(
            'SecureObject: [object HTMLDivElement]{ key: {"namespace":"lockerlwc"} }',
            `${el}`,
            'Should receive a SecureObject'
        );
    }

    assertIsSecureDOMEvent(ev) {
        testUtils.assertEquals(
            'SecureDOMEvent: [object MouseEvent]{ key: {"namespace":"lockerlwc"} }',
            `${ev}`,
            'Expected SecureEvent in event handler'
        );

    }

    assertIsSecureCustomEvent(ev) {
        testUtils.assertEquals(
            'SecureDOMEvent: [object CustomEvent]{ key: {"namespace":"lockerlwc"} }',
            `${ev}`,
            'CustomEvent constructor should return a SecureEvent'
        );
    }

    assertCustomEventDataPayload(ev) {
        this.assertIsSecureCustomEvent(ev);
        this.assertIsSecureWindow(window);
        this.assertDataPayload(ev.detail.data);
    }

    assertDataPayload(data) {
        testUtils.assertEqualsValue({
            foo: 'bar',
            bar: {
                baz: 'foo'
            }
        },
            data.object,
            'Expected object was not received in event data'
        );
        testUtils.assertEqualsValue([0, 1, 2], data.array, 'Expected array was not received in event data');
        testUtils.assertEquals('foobar', data.string, 'Expected string was not received in event data');
        testUtils.assertEquals(1, data.number, 'Expected number was not received in event data');
        testUtils.assertEquals(true, data.boolean, 'Expected boolean was not received in event data');
        if (data.isSecure) {
            this.assertIsSecureElement(data.domElement);
        } else {
            this.assertIsSecureObjectElement(data.domElement);
        }

        this.assertIsSecureWindow(data.win);
        this.assertIsSecureDocument(data.doc);
        this.assertIsSecureBody(data.body);
        this.assertIsSecureHead(data.head);
        this.assertIsFunction(data.func);
    }

    // tests
    @api testAuraLWCApiMethodOnHostElement(data, cb) {
        this.assertDataPayload(data);
        this.assertIsFunction(data.func);
        data.func();
        cb();
    }

    @api testSLWC2AuraApiReturnValue() {
        return this.getCustomEventData();
    }

    @api testTemplateQuerySelectorReturnsSecureElement() {
        const el = this.template.querySelector('#parent-secure');
        this.assertIsSecureElement(el);
    }

    @api testLWCCustomEventOnSelf() {
        const doneObj = {};
        const _this = this;
        const ev = new CustomEvent('testLWCCustomEventOnSelf', {
            detail: {
                data: _this.getCustomEventData(doneObj, true)
            }
        });

        this.assertIsSecureCustomEvent(ev);

        const promise = testUtils.waitForPromise(
            true,
            function () {
                return doneObj.triggered;
            },
            'Function in CustomEvent payload could not be called'
        )

        this.dispatchEvent(ev);
        return promise;
    }

    @api testSecureLWC2SecureLWCCustomEvent() {
        const doneObj = {};
        const child = this.template.querySelector('lockerlwc-childsecure');
        const _this = this;

        const ev = new CustomEvent('customEvent', {
            detail: {
                data: Object.assign(_this.getCustomEventData(doneObj, true), {isSecure : true})
            }
        });

        this.assertIsSecureCustomEvent(ev);
        const promise = testUtils.waitForPromise(
            true,
            function () {
                return doneObj.triggered;
            },
            'Function in CustomEvent payload was not invoked '
        );

        child.dispatchEvent(ev);
        return promise;
    }

    @api testSecureLWC2SecureLWCDomEvent() {
        const child = this.template.querySelector('lockerlwc-childsecure');

        const promise = testUtils.waitForPromise(
            'true',
            function () {
                return child.getAttribute('data-triggered');
            },
            'Child component handler did not fire'
        );

        child.click();
        return promise;
    }

    @api testSecureLWC2UnsecureLWCCustomEvent() {
        const doneObj = {};
        const child = this.template.querySelector('lockerlwc-parentunsecure');
        const _this = this;

        const ev = new CustomEvent('customEvent', {
            detail: {
                data: _this.getCustomEventData(doneObj)
            }
        });

        this.assertIsSecureCustomEvent(ev);
        testUtils.waitForTimeout(
            true,
            function () {
                return doneObj.triggered;
            },
            'Function in CustomEvent payload was not invoked '
        );

        child.dispatchEvent(ev);
    }

    @api testSecureLWC2UnsecureLWCDOMEvent(cb) {
        const child = this.template.querySelector('lockerlwc-parentunsecure');
        child.callback = cb;
        child.click();
    }

    @api testSecureLWC2SecureLWCCustomEventCrossNamespace() {
        const doneObj = {};
        const child = this.template.querySelector('securemoduletest-child');
        const _this = this;

        const ev = new CustomEvent('customEvent', {
            detail: {
                data: _this.getCustomEventData(doneObj)
            }
        });

        this.assertIsSecureCustomEvent(ev);
        const promise = testUtils.waitForPromise(
            true,
            function () {
                return doneObj.triggered;
            },
            'Function in CustomEvent payload was not invoked '
        );

        child.dispatchEvent(ev);
        return promise;
    }

    @api
    testSLWC2SWLCParentCanCallAPIProp() {
        const doneObj = {};
        const child = this.template.querySelector('lockerlwc-childsecure');

        // Access properties
        const expectedValue = {
            foo: 'bar',
            bar: {
                baz: 'foo'
            }
        };
        testUtils.assertEquals('childSecure', child.stringProp, 'Unable to access string property on child component');
        testUtils.assertEquals(99, child.integerProp, 'Unable to access integer property on child component');
        testUtils.assertFalse(child.booleanProp, 'Unable to access boolean property on child component');

        testUtils.assertEqualsValue([91, 92, 93], child.arrayProp, 'Unable to access array on child component');
        testUtils.assertEqualsValue(expectedValue, child.objProp, 'Unable to access object property on child component');

        // Access public methods
        testUtils.assertDefined(child.assertParamsInPublicMethod, 'Unable to access @api method on child component');
        testUtils.assertTrue(child.assertParamsInPublicMethod instanceof Function, 'Unexpected wrapped value received on child');
        child.assertParamsInPublicMethod(
            Object.assign(this.getCustomEventData(doneObj, true), { isSecure : true })
        );
        testUtils.assertTrue(doneObj.triggered, 'Failed to execute callback in child component');
    }

    assertTestAuraLWCDomEventOnHostElement(ev) {
        this.assertIsSecureDOMEvent(ev);
        this.assertIsSecureWindow(window);
        this.assertIsSecureDocument(document);
        this.assertIsSecureElement(ev.currentTarget);

        testUtils.assertEquals(ev.target, undefined);
        if (this.callback) {
            this.callback();
        }
    }

    assertTestLWCCustomEventOnSelf(ev) {
        this.assertIsSecureCustomEvent(ev);
        this.assertIsSecureWindow(window);
        testUtils.assertEqualsValue({
            foo: 'bar',
            bar: {
                baz: 'foo'
            }
        },
            ev.detail.data.object,
            'Expected object was not received in event data'
        );
        testUtils.assertEqualsValue([0, 1, 2], ev.detail.data.array, 'Expected array was not received in event data');
        testUtils.assertEquals('foobar', ev.detail.data.string, 'Expected string was not received in event data');
        testUtils.assertEquals(1, ev.detail.data.number, 'Expected number was not received in event data');
        testUtils.assertEquals(true, ev.detail.data.boolean, 'Expected boolean was not received in event data');
        this.assertIsSecureElement(ev.detail.data.domElement);
        this.assertIsSecureWindow(ev.detail.data.win);
        this.assertIsSecureDocument(ev.detail.data.doc);
        this.assertIsSecureBody(ev.detail.data.body);
        this.assertIsSecureHead(ev.detail.data.head);
        this.assertIsFunction(ev.detail.data.func);
        ev.detail.data.func();
    }

    connectedCallback() {
        this.addEventListener('testAuraLWCCustomEventOnHostElement', (ev) => {
            this.assertCustomEventDataPayload(ev);
            this.assertIsFunction(ev.detail.data.func);
            ev.detail.data.func();
        });
        this.addEventListener('testLWCCustomEventOnSelf', this.assertTestLWCCustomEventOnSelf);
        this.addEventListener('click', this.assertTestAuraLWCDomEventOnHostElement)
    }
}