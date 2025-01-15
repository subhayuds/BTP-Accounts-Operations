sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/model/ValidateException",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/core/Fragment"
],

    function (Controller, JSONModel, MessageToast, MessageBox, ValidateException, Filter, FilterOperator, Fragment) {

        "use strict";


        return Controller.extend("com.hcl.accountsoperations.controller.Home", {
            onInit: async function () {

                var oModel = new JSONModel();
                await oModel.loadData("model/region.json");
                this.getView().setModel(oModel, "regionModel");

                // var OEventBus = sap.ui.getCore().getEventBus();
                // OEventBus.subscribe("subaccounts", "refresh", this.readSubAccountsModel, this);

                sap.ui.getCore().getEventBus().subscribe("subaccount", "refresh", this.readSubAccountsModel, this);

                this.readSubAccountsModel();
            },

            readSubAccountsModel: function () {
                var that = this
                var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
                var sUrl = prefix + "accounts/v1/globalAccount?expand=true";

                $.ajax({
                    url: sUrl,
                    type: 'GET',
                    contentType: "application/json",
                    success: function (data) {
                        console.log("success" + data);
                        that.getView().setModel(new sap.ui.model.json.JSONModel({ subaccounts: data }), "subaccountsModel");

                    },
                    error: function (e) {
                        console.log("error: " + e);

                    }
                });

            },

            // onFilter: function (oEvent) {
            //     var sSelectionSet = oEvent.getParameter("selectionSet");
            //     var oTable = this.getView().byId("TreeTable1");
            //     var oBinding = oTable.getBinding("rows");
            //     var aFilters= []


            //     // var aFilters = sSelectionSet.reduce(function (aResult, oControl) {
            //     //     if (oControl.getMetadata().getName() == "sap.m.Input") {
            //         aFilters.push(new Filter({
            //                 path: "displayName",
            //                 operator: "Contains",
            //                 value1: sSelectionSet[0].getValue(),
            //                 caseSensitive: false
            //             }));
            //        // } else if (oControl.getMetadata().getName() == "sap.m.MultiComboBox") {
            //             var aSelectedKeys = sSelectionSet[1].getSelectedKeys();
            //             aSelectedKeys.map(function (sSelectedKey) {
            //                 aFilters.push(new Filter({
            //                     path: "region",
            //                     operator: "Contains",
            //                     value1: sSelectedKey
            //                 }));
            //             });


            //        // } else if (oControl.getMetadata().getName() == "sap.m.CheckBox") {
            //         aFilters.push(new Filter({
            //                 path: "betaEnabled",
            //                 operator: "EQ",
            //                 value1: sSelectionSet[2].getSelected(),

            //             }));


            //        // }
            //       //  return aResult;
            //    // }, []);

            //     oBinding.filter(aFilters);

            // },

            onFilter: function (oEvent) {
                var odisplayName = this.byId("Input1");
                var oRegion = this.byId("_IDGenComboBox");
                var obetaEnabled = this.byId("CheckBox1");

                var sdisplayName = odisplayName.getValue();
                var sRegion = oRegion.getSelectedKey();
                var sbetaEnabled = obetaEnabled.getSelected();

                var aFilters = [];

                if (sdisplayName) {
                    aFilters.push(new Filter("displayName", FilterOperator.Contains, sdisplayName));

                }

                if (sRegion) {
                    aFilters.push(new Filter("region", FilterOperator.Contains, sRegion));

                }

                if (obetaEnabled) {
                    aFilters.push(new Filter("betaEnabled", FilterOperator.EQ, sbetaEnabled));

                }

                var oTable = this.getView().byId("TreeTable1");
                var oBinding = oTable.getBinding("rows");
                oBinding.filter(aFilters);

            },

            onCollapseAll: function () {
                const oTreeTable = this.byId("TreeTable1");
                oTreeTable.collapseAll();
            },

            formateDate: function (oValue) {
                var dateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                    pattern: "dd-MMM-yyyy HH:mm:ss"
                });
                return dateFormat.format(new Date(oValue));

            },


            formateregion: function (oValue) {
                if (oValue) {
                    var regionModelData = this.getView().getModel("regionModel").getData().Regions;
                    var regionfilterdata = regionModelData.filter((oItem) => oItem.Region == oValue);
                    if (regionfilterdata[0]) {
                        return regionfilterdata[0].Region + " - " + regionfilterdata[0].RegionName;
                    } else {
                        return oValue
                    }
                }

            },

            formateIcon: function (oValue) {
                if (oValue) {
                    if (oValue.directoryType)
                        return "sap-icon://folder-full";
                    else if (oValue.parentType && !oValue.directoryType)
                        return "sap-icon://product";
                    else
                        return "sap-icon://world"

                }

            },

            formateProduction: function (sProduction) {
                return sProduction === "USED_FOR_PRODUCTION";

            },

            onRowSelection: function (oEvent) {
                var oObject = Object.assign({}, oEvent.getParameter("rowBindingContext").getObject());
                oObject.editFlag = false;
                //this.getView().setModel(new JSONModel(oObject), "subaccountDialogModel");

                if (oObject.directoryType) {
                    this.openDirectoryDialog(oObject);

                } else if (oObject.parentType && !oObject.directoryType) {
                    this.openSubAccountDialog(oObject);

                } else {
                    this.openGlobalAccountDialog(oObject);
                }

            },


            openSubAccountDialog: function (oData) {
                // Check if the subaccount dialog has already been created
                if (!this._subaccountDialog) {
                    // Load the subaccount dialog fragment only once and attach it to the current view
                    Fragment.load({
                        name: "com.hcl.accountsoperations.fragments.SubaccountDetails", // Fragment for Subaccount
                        controller: this
                    }).then(function (oDialog) {
                        this._subaccountDialog = oDialog;
                        this.getView().addDependent(this._subaccountDialog);
                        this._subaccountDialog.open();
                    }.bind(this));
                } else {
                    // If the dialog is already created, just open it
                    this._subaccountDialog.open();
                }

                // Set the selected subaccount data into the dialog model for binding
                this.getView().setModel(new JSONModel(oData), "subaccountDialogModel");
            },


            openDirectoryDialog: function (oData) {
                // Check if the directory dialog has already been created
                if (!this._directoryDialog) {
                    // Load the directory dialog fragment only once and attach it to the current view
                    Fragment.load({
                        name: "com.hcl.accountsoperations.fragments.DirectoryDetails", // Fragment for Directory
                        controller: this
                    }).then(function (oDialog) {
                        this._directoryDialog = oDialog;
                        this.getView().addDependent(this._directoryDialog);
                        this._directoryDialog.open();
                    }.bind(this));
                } else {
                    // If the dialog is already created, just open it
                    this._directoryDialog.open();
                }

                // Set the selected directory data into the dialog model for binding
                this.getView().setModel(new JSONModel(oData), "directoryDialogModel");
            },

            openGlobalAccountDialog: function (oData) {
                // Check if the global account dialog has already been created
                if (!this._globalAccountDialog) {
                    // Load the global account dialog fragment only once and attach it to the current view
                    Fragment.load({
                        name: "com.hcl.accountsoperations.fragments.GlobalAccountDetails", // Fragment for Global Account
                        controller: this
                    }).then(function (oDialog) {
                        this._globalAccountDialog = oDialog;
                        this.getView().addDependent(this._globalAccountDialog);
                        this._globalAccountDialog.open();
                    }.bind(this));
                } else {
                    // If the dialog is already created, just open it
                    this._globalAccountDialog.open();
                }

                // Set the selected global account data into the dialog model for binding
                this.getView().setModel(new JSONModel(oData), "globalAccountDialogModel");
            },

            onsubaccountEditDialog: function () {
                this.getView().getModel("subaccountDialogModel").setProperty("/editFlag", true)

            },

            ondirectoryEditDialog: function () {
                this.getView().getModel("directoryDialogModel").setProperty("/editFlag", true)

            },


            onsubaccountCloseDialog: function () {
                this._subaccountDialog.close();
                this.getView().getModel("subaccountDialogModel").setData({});
            },

            ondirectoryCloseDialog: function () {
                this._directoryDialog.close();
                this.getView().getModel("directoryDialogModel").setData({});
            },

            onglobalAccountCloseDialog: function () {
                this._globalAccountDialog.close();
                this.getView().getModel("globalAccountDialogModel").setData({});
            },

            onsubaccountSaveDialog: function () {
                var oDialogModel = this.getView().getModel("subaccountDialogModel");
                var oUpdatedData = oDialogModel.getData();
                var that = this;

                var bValid = true;
                var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
                var sUrl = prefix + "accounts/v1/subaccounts/" + oUpdatedData.guid;

                if (oUpdatedData.displayName === "" || oUpdatedData.displayName === null) {
                    MessageBox.warning("Please fill in all mandatory fields.");
                    sap.ui.getCore().byId("subaccontName").setValueState("Error").setValueStateText("Name is required. Please enter a valid name.");
                    return;
                }

                // Keep the original structure: check for existing name first
                this.checkNameExists(oUpdatedData.displayName, oUpdatedData.guid).then(function (existingName) {
                    if (existingName) {
                        MessageBox.warning("A subaccount with the name '" + existingName + "' already exists. Please choose a different name.");
                        bValid = false; // Set bValid to false if name exists
                    }

                    if (bValid) {
                        $.ajax({
                            url: sUrl,
                            method: "PATCH",
                            contentType: "application/json",
                            data: JSON.stringify({
                                "displayName": oUpdatedData.displayName,
                                "betaEnabled": oUpdatedData.betaEnabled,
                                "description": oUpdatedData.description,
                                "usedForProduction": oUpdatedData.usedForProduction
                            }),
                            success: function (oData) {
                                MessageToast.show("Subaccount details updated successfully!");
                                that.readSubAccountsModel();
                                that._subaccountDialog.close();
                                console.log(oData); // Inspect the structure

                            },
                            error: function () {
                                MessageToast.show("Failed to update subaccount details.");
                                that._subaccountDialog.close();
                            }
                        });
                    }
                });
            },

            checkNameExists: function (displayName, guid) {
                var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
                var sCheckUrl = prefix + "accounts/v1/globalAccount?expand=true";

                return new Promise(function (resolve) {
                    $.ajax({
                        url: sCheckUrl,
                        type: "GET",
                        contentType: "application/json",
                        success: function (data) {
                            // Safely get subaccounts or default to an empty array
                            var subaccounts = data.subaccounts || [];

                            // Check if displayName exists, excluding FOLDER types and the current guid
                            var exists = subaccounts.some(function (subaccount) {
                                return subaccount.directoryType !== "FOLDER" &&
                                    subaccount.displayName === displayName &&
                                    subaccount.guid !== guid;
                            });

                            resolve(exists ? displayName : null);
                        },
                        error: function () {
                            console.error("Error fetching subaccounts.");
                            resolve(null); // Assume no duplicate name on error
                        }
                    });
                });
            },


            ondirectorySaveDialog: function () {
                var oDialogModel = this.getView().getModel("directoryDialogModel");
                var oUpdatedData = oDialogModel.getData();
                var that = this;

                var bValid = true;
                var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
                var sUrl = prefix + "accounts/v1/directories/" + oUpdatedData.guid;

                if (oUpdatedData.displayName == "" || oUpdatedData.displayName == null) {
                    sap.ui.getCore().byId("_IDGenInput8").setValueState("Error").setValueStateText("Display Name is required");
                    MessageBox.warning("Please fill in all mandatory fields.");

                    return;
                }

                if (bValid) {
                    $.ajax({
                        url: sUrl,
                        method: "PATCH",
                        contentType: "application/json",
                        //data: JSON.stringify(oUpdatedData),
                        data: JSON.stringify({
                            "displayName": oUpdatedData.displayName,
                            "description": oUpdatedData.description,

                        }),
                        success: function () {
                            MessageToast.show("Directory details updated successfully!");
                            that.readSubAccountsModel();
                            that._directoryDialog.close();

                        },
                        error: function () {
                            MessageToast.show("Failed to update Directory details.");
                            that._directoryDialog.close();
                        }

                    });
                }
            },

            onCreateSubaccount: function () {
                if (!this._oDialog) {
                    this._oDialog = sap.ui.xmlfragment("com.hcl.accountsoperations.fragments.CreateSubaccount", this);
                    this.getView().addDependent(this._oDialog);
                }
                this._oDialog.open();

                sap.ui.getCore().byId("_IDGenInput1").setValue("");
                sap.ui.getCore().byId("_IDGenInput2").setValue("");
                sap.ui.getCore().byId("_IDGenComboBox3").setSelectedKey("");
                sap.ui.getCore().byId("_IDGenInput3").setValue("");
                sap.ui.getCore().byId("_IDGenInput6").setValue("");

                sap.ui.getCore().byId("_IDGenInput").setValue("");
                sap.ui.getCore().byId("_IDGenInput4").setValue("");
                sap.ui.getCore().byId("_IDGenInput5").setValue("");

            },

            onAccountTypeChange: function (oEvent) {
                const selectedIndex = oEvent.getParameter("selectedIndex");

                sap.ui.getCore().byId("subaccountForm").setVisible(selectedIndex === 0);
                sap.ui.getCore().byId("directoryForm").setVisible(selectedIndex === 1);

            },


            onParentTreeTable: function () {
                if (!this._oDialogParent) {
                    this._oDialogParent = sap.ui.xmlfragment("com.hcl.accountsoperations.fragments.ParentValueHelp", this);
                    this.getView().addDependent(this._oDialogParent);
                }
                this._oDialogParent.open();

            },

            onParentSelected: function (oEvent) {

                var oSelectedData = oEvent.getSource().getBindingContext("subaccountsModel").getObject();
                sap.ui.getCore().byId("_IDGenInput3").setValue(oSelectedData.displayName);
                //_IDGenInput5
                sap.ui.getCore().byId("_IDGenInput5").setValue(oSelectedData.displayName);
                this.parentGUID = oSelectedData.guid;

                if (oSelectedData === "parentType") {
                    MessageToast.show("Sub Accounts cannot be selected as a parent.")
                    sap.ui.getCore().byId("_IDGenInput3").clearSelection();
                    return;

                }

                this._oDialogParent.close();

            },

            formateParentSelected: function (oValue) {
                if (oValue.directoryType)
                    return "Active";
                else if (oValue.parentType && !oValue.directoryType)
                    return "Inactive";
                else
                    return "Active"

            },

            onParentDialogCancel: function () {
                this._oDialogParent.close();

            },

            onSubmitSubaccount: function () {
                // Get the selected account type (0 = Sub-account, 1 = Directory)
                var selectedType = sap.ui.getCore().byId("_IDGenRadioButtonGroup").getSelectedIndex();
                var apiUrl = "";
                var requestData = {};
                var prefix = sap.ui.require.toUrl(this.getOwnerComponent().getManifestEntry('/sap.app/id').replaceAll('.', '/')) + "/";
                var that = this;


                if (selectedType === 0) {
                    var displayName = sap.ui.getCore().byId("_IDGenInput1").getValue()

                    if (!displayName) {
                        sap.ui.getCore().byId("_IDGenInput1").setValueState("Error").setValueStateText("Display Name is required");
                        MessageBox.warning("Please fill in all mandatory fields.");
                        return;

                    }
                    // Sub-account selected, prepare the specific payload for subaccount
                    apiUrl = prefix + "accounts/v1/subaccounts";
                    //nameToCheck = sap.ui.getCore().byId("_IDGenInput1").getValue()
                    requestData =
                    {
                        displayName: displayName,
                        description: sap.ui.getCore().byId("_IDGenInput2").getValue(),
                        region: sap.ui.getCore().byId("_IDGenComboBox3").getSelectedKey(),
                        parentGUID: this.parentGUID,
                        subdomain: sap.ui.getCore().byId("_IDGenInput6").getValue(),

                    };
                } else {
                    // Directory selected, prepare the specific payload for directory
                    apiUrl = prefix + "accounts/v1/directories";
                    requestData =
                    {
                        displayName: sap.ui.getCore().byId("_IDGenInput").getValue(),
                        description: sap.ui.getCore().byId("_IDGenInput4").getValue(),
                        parentGUID: this.parentGUID

                    };
                }

                $.ajax({
                    url: apiUrl,
                    type: "POST",
                    contentType: "application/json",
                    data: JSON.stringify(requestData),
                    success: function (response) {
                        sap.m.MessageToast.show("Successfully created!");
                        console.log("Response:", response);
                        this.readSubAccountsModel();
                        this._oDialog.close();
                    }.bind(this),

                    error: function (xhr, status, error) {
                        sap.m.MessageBox.error("Failed to create. Error: " + error);
                        console.error("Error:", xhr, status, error);
                        that._oDialog.close();
                    }
                });
            },

            onCloseCreateDialog: function () {
                sap.ui.getCore().byId("_IDGenRadioButtonGroup").setSelectedIndex(0);

                sap.ui.getCore().byId("_IDGenInput1").setValue();
                sap.ui.getCore().byId("_IDGenInput2").setValue();
                sap.ui.getCore().byId("_IDGenComboBox3").setValue();
                sap.ui.getCore().byId("_IDGenInput3").setValue();

                sap.ui.getCore().byId("_IDGenInput").setValue();
                sap.ui.getCore().byId("_IDGenInput4").setValue();
                sap.ui.getCore().byId("_IDGenInput5").setValue();

                this._oDialog.close();

            },

            onBoosterPress: function () {
                // Navigate to the create page
                var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
                oRouter.navTo("Create");
            },

        });
    });
