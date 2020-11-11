(function() {
    let _shadowRoot;
    let _id;

    let div;
    let widgetName;
    var Ar = [];
    let _input;

    let tmpl = document.createElement("template");
    tmpl.innerHTML = `
      <style>
      .sapMListUl {
        max-width: 600px;
      }
      </style>      
    `;

    class NotificationListItem extends HTMLElement {

        constructor() {
            super();

            _shadowRoot = this.attachShadow({
                mode: "open"
            });
            _shadowRoot.appendChild(tmpl.content.cloneNode(true));

            _id = createGuid();

            this._export_settings = {};
            this._export_settings.title = "";
            this._export_settings.subtitle = "";
            this._export_settings.icon = "";
            this._export_settings.unit = "";
            this._export_settings.footer = "";

            this.addEventListener("click", event => {
                console.log('click');

            });

            this._firstConnection = 0;
            this._firstLoadLib = 0;
        }

        connectedCallback() {
            try {
                if (window.commonApp) {
                    let outlineContainer = commonApp.getShell().findElements(true, ele => ele.hasStyleClass && ele.hasStyleClass("sapAppBuildingOutline"))[0]; // sId: "__container0"

                    if (outlineContainer && outlineContainer.getReactProps) {
                        let parseReactState = state => {
                            let components = {};

                            let globalState = state.globalState;
                            let instances = globalState.instances;
                            let app = instances.app["[{\"app\":\"MAIN_APPLICATION\"}]"];
                            let names = app.names;

                            for (let key in names) {
                                let name = names[key];

                                let obj = JSON.parse(key).pop();
                                let type = Object.keys(obj)[0];
                                let id = obj[type];

                                components[id] = {
                                    type: type,
                                    name: name
                                };
                            }

                            for (let componentId in components) {
                                let component = components[componentId];
                            }

                            let metadata = JSON.stringify({
                                components: components,
                                vars: app.globalVars
                            });

                            if (metadata != this.metadata) {
                                this.metadata = metadata;

                                this.dispatchEvent(new CustomEvent("propertiesChanged", {
                                    detail: {
                                        properties: {
                                            metadata: metadata
                                        }
                                    }
                                }));
                            }
                        };

                        let subscribeReactStore = store => {
                            this._subscription = store.subscribe({
                                effect: state => {
                                    parseReactState(state);
                                    return {
                                        result: 1
                                    };
                                }
                            });
                        };

                        let props = outlineContainer.getReactProps();
                        if (props) {
                            subscribeReactStore(props.store);
                        } else {
                            let oldRenderReactComponent = outlineContainer.renderReactComponent;
                            outlineContainer.renderReactComponent = e => {
                                let props = outlineContainer.getReactProps();
                                subscribeReactStore(props.store);

                                oldRenderReactComponent.call(outlineContainer, e);
                            }
                        }
                    }
                }
            } catch (e) {}
        }

        disconnectedCallback() {
            if (this._subscription) { 
                this._subscription();
                this._subscription = null;
            }
        }

        onCustomWidgetBeforeUpdate(changedProperties) {
            if ("designMode" in changedProperties) {
                this._designMode = changedProperties["designMode"];
            }
        }

        onCustomWidgetAfterUpdate(changedProperties) {
            console.log(changedProperties);
            var that = this;

            if (this._firstLoadLib === 0) {
                this._firstLoadLib = 1;
                let pubnubjs = "http://localhost/SAC/sacnotificationlistitem/pubnub.4.29.9.js";
                async function LoadLibs() {
                    try {
                        await loadScript(pubnubjs, _shadowRoot);
                    } catch (e) {
                        alert(e);
                    } finally {
						letsGo(that, changedProperties);
                    }
                }
                LoadLibs();
            }
        }

        _renderExportButton() {
            let components = this.metadata ? JSON.parse(this.metadata)["components"] : {};
            console.log("_renderExportButton-components");
            console.log(components);
            console.log("end");
        }

        _firePropertiesChanged() {
            this.footer = "";
            this.dispatchEvent(new CustomEvent("propertiesChanged", {
                detail: {
                    properties: {
                        footer: this.footer
                    }
                }
            }));
        }

        // SETTINGS
        get title() {
            return this._export_settings.title;
        }
        set title(value) {
            console.log("setTitle:" + value);
            this._export_settings.title = value;
        }

        get subtitle() {
            return this._export_settings.subtitle;
        }
        set subtitle(value) {
            this._export_settings.subtitle = value;
        }

        get icon() {
            return this._export_settings.icon;
        }
        set icon(value) {
            this._export_settings.icon = value;
        }

        get unit() {
            return this._export_settings.unit;
        }
        set unit(value) {
            this._export_settings.unit = value;
        }

        get footer() {
            return this._export_settings.footer;
        }
        set footer(value) {
            console.log("hello is me");
            value = _input;
            this._export_settings.footer = value;
        }

        static get observedAttributes() {
            return [
                "title",
                "subtitle",
                "icon",
                "unit",
                "footer",
                "link"
            ];
        }

        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue != newValue) {
                this[name] = newValue;
            }
        }

    }
    customElements.define("com-fd-djaja-sap-sac-notificationlistitem", NotificationListItem);

    // UTILS
    function letsGo(that, changedProperties) {
        // Update this block with your publish/subscribe keys
        pubnub = new PubNub({
            publishKey: "REPLACE_WITH_YOUR_PUBLISHKEY",
            subscribeKey: "REPLACE_WITH_YOUR_SUBSCRIBEKEY",
            uuid: "REPLACE_WITH_RANDOM_STRING"
        })
        pubnub.addListener({
            status: function(statusEvent) {
            },
            message: function(msg) {
				loadthis(that, changedProperties, msg);
            },
            presence: function(presenceEvent) {
            }
        })
        console.log("Subscribing...");
        pubnub.subscribe({
            channels: ['sac']
        });
		loadthis(that, changedProperties, "");
    };

    function loadthis(that, changedProperties, msg) {
        var that_ = that;
        widgetName = that._export_settings.title.split("|")[0];
        if (typeof widgetName === "undefined") {
            widgetName = that._export_settings.title.split("|")[0];
        }
        div = document.createElement('div');
        div.slot = "content_" + widgetName;

        if (that._firstConnection === 0) {
            console.log("--First Time --");
            const css = document.createElement('div');
            css.innerHTML = '<style>.sapMListUl {max-width: 600px;}</style>'
            _shadowRoot.appendChild(css);
            let div0 = document.createElement('div');
            div0.innerHTML = '<?xml version="1.0"?><script id="oView_' + widgetName + '" name="oView_' + widgetName + '" type="sapui5/xmlview"><core:View xmlns:core="sap.ui.core" xmlns:mvc="sap.ui.core.mvc" xmlns="sap.m" xmlns:l="sap.ui.layout" xmlns:html="http://www.w3.org/1999/xhtml" controllerName="myView.Template"><l:VerticalLayout class="sapUiContentPadding" width="100%"><List class="sapUiResponsiveMargin" width="auto" items="{/headers}"><layoutData><FlexItemData maxWidth="600px" /></layoutData><NotificationListGroup title="{heading}" datetime="{datetime}" showCloseButton="false" authorName="{authorName}" authorPicture="{authorPicture}" items="{items}"><items><NotificationListItem title="{title}" description="{Descr}" showCloseButton="false" datetime="{datetime}" unread="true" priority="{priority}" close="" press="" authorName="{authorName}" authorPicture="{authorPicture}"/></items></NotificationListGroup></List></l:VerticalLayout></core:View></script>';
            _shadowRoot.appendChild(div0);
            let div1 = document.createElement('div');
            div1.innerHTML = '<div id="ui5_content_' + widgetName + '" name="ui5_content_' + widgetName + '"><slot name="content_' + widgetName + '"></slot></div>';
            _shadowRoot.appendChild(div1);
            that_.appendChild(div);
            var mapcanvas_divstr = _shadowRoot.getElementById('oView_' + widgetName);
            Ar.push({
                'id': widgetName,
                'div': mapcanvas_divstr
            });
            console.log(Ar);
        }

        that_._renderExportButton();

        sap.ui.getCore().attachInit(function() {
            "use strict";

            //### Controller ###
            sap.ui.define([
                "jquery.sap.global",
                "sap/ui/core/mvc/Controller",
                "sap/ui/model/json/JSONModel",
                "sap/m/MessageToast",
                "sap/ui/core/library",
                "sap/ui/core/Core",
                'sap/ui/model/Filter',
                'sap/m/library',
                'sap/m/MessageBox',
                'sap/ui/unified/DateRange',
                'sap/ui/core/format/DateFormat',
                "sap/ui/model/BindingMode",
                "sap/ui/unified/CalendarLegendItem",
                "sap/ui/unified/DateTypeRange",
                "sap/ui/unified/library",
                'sap/ui/Device',
                "sap/suite/ui/commons/MicroProcessFlow",
                "sap/suite/ui/commons/MicroProcessFlowItem"
            ], function(jQuery, Controller, JSONModel, MessageToast, coreLibrary, Core, Filter, mobileLibrary, MessageBox, DateRange, DateFormat, BindingMode, CalendarLegendItem, DateTypeRange, unifiedLibrary, Device, MicroProcessFlow, MicroProcessFlowItem) {
                "use strict";
                return Controller.extend("myView.Template", {
                    onInit: function() {
                        console.log("-------oninit--------");
                        var widgetName = that._export_settings.title.split("|")[0];

                        if (that._firstConnection === 0) {
                            that._firstConnection = 1;
                            var oModel = new JSONModel({
                                "headers": []
                            });
                            this.getView().setModel(oModel);
                            sap.ui.getCore().setModel(oModel, "core");
                        } else {
                            console.log("----after---");
                            var oModel = sap.ui.getCore().getModel("core");

                            var data = new JSONModel(msg.message);
                            oModel.setProperty("/headers", data.oData.headers);
                            this.getView().setModel(data);
                            oModel.refresh(true);
                        }
                    }
                });
            });

            console.log("widgetName Final:" + widgetName);
            var foundIndex = Ar.findIndex(x => x.id == widgetName);
            var divfinal = Ar[foundIndex].div;
            //### THE APP: place the XMLView somewhere into DOM ###
            var oView = sap.ui.xmlview({
                viewContent: jQuery(divfinal).html(),
            });
            oView.placeAt(div);
        });
    }

    function createGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
            let r = Math.random() * 16 | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function loadScript(src, shadowRoot) {
        return new Promise(function(resolve, reject) {
            let script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                console.log("Load: " + src);
                resolve(script);
            }
            script.onerror = () => reject(new Error(`Script load error for ${src}`));
            shadowRoot.appendChild(script)
        });
    }
})();
